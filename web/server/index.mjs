import { createServer } from "node:http";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { openStore, passwordHash, passwordMatches } from "./store.mjs";

import { redeemInvite } from "./invites.mjs";
import { verifyPrivyIdentity } from "./privy.mjs";

const DAY = 86400000;
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const text = (value, label, max = 200) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${label} is required (maximum ${max} characters).`);
  return value.trim();
};
const money = (n, label, max = 1e9) => {
  if (
    typeof n !== "number" ||
    !Number.isFinite(n) ||
    n <= 0 ||
    n > max ||
    Math.abs(n * 100 - Math.round(n * 100)) > 0.00001
  )
    fail(
      400,
      `${label} must be a positive amount with up to two decimal places, no more than ${max}.`,
    );
  return n;
};
const sessionHash = (token) => createHash("sha256").update(token).digest("hex");
const publicUser = ({ id, email, name, role }) => ({ id, email, name, role });

export function createApp({
  db = openStore(),
  verifyIdentity = verifyPrivyIdentity,
  allowLegacyAuth = false,
  origin = process.env.FLOAT_ORIGIN || "http://localhost:5173",
  secure = process.env.NODE_ENV === "production",
} = {}) {
  if (secure && !process.env.FLOAT_ORIGIN)
    throw new Error(
      "Set FLOAT_ORIGIN to the public HTTPS origin before running in production.",
    );
  const attempts = new Map();
  const save = (a) =>
    db
      .prepare("UPDATE applications SET data=? WHERE id=?")
      .run(JSON.stringify(a), a.id);
  const record = (a, actor, message) =>
    a.events.push({ at: Date.now(), actor, message });
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store");
    const send = (status, value) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    };
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (!path.startsWith("/api/")) {
        if (req.method !== "GET")
          return send(405, { error: "Method not allowed." });
        const root = resolve("dist");
        const requested = resolve(root, "." + path);
        if (!requested.startsWith(root + "/") && requested !== root)
          fail(404, "Not found.");
        let file;
        try {
          file = await readFile(requested);
        } catch {
          file = await readFile(resolve(root, "index.html"));
        }
        const mime = {
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".woff2": "font/woff2",
        };
        res.setHeader("Content-Type", mime[extname(requested)] || "text/html");
        return res.end(file);
      }
      const mutation = !["GET", "HEAD"].includes(req.method);
      if (
        mutation &&
        !(secure ? [origin] : [origin, "http://127.0.0.1:5173"]).includes(
          req.headers.origin,
        )
      )
        fail(403, "This request must come from the Float app.");
      let body = {};
      if (mutation) {
        if (!req.headers["content-type"]?.startsWith("application/json"))
          fail(415, "Send JSON.");
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 7 * 1024 * 1024)
            fail(413, "Invoice must be smaller than 5 MB.");
          chunks.push(chunk);
        }
        try {
          body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
        } catch {
          fail(400, "Invalid request.");
        }
        if (!body || typeof body !== "object" || Array.isArray(body))
          fail(400, "Invalid request.");
      }
      const rawToken = req.headers.cookie
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("float_session="))
        ?.slice(14);
      let user =
        rawToken &&
        db
          .prepare(
            "SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?",
          )
          .get(sessionHash(rawToken), Date.now());
      // Old password sessions cannot bypass mandatory wallet onboarding.
      if (user && !allowLegacyAuth && !db.prepare("SELECT 1 FROM privy_identities WHERE user_id=?").get(user.id)) user = null;
      const session = (u) => {
        const token = randomBytes(32).toString("hex");
        db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
        if (rawToken)
          db.prepare("DELETE FROM sessions WHERE token=?").run(
            sessionHash(rawToken),
          );
        db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
          sessionHash(token),
          u.id,
          Date.now() + DAY,
        );
        res.setHeader(
          "Set-Cookie",
          `float_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure ? "; Secure" : ""}`,
        );
      };
      if (path === "/api/privy" && req.method === "POST") {
        const key = req.socket.remoteAddress;
        const limit = attempts.get(key);
        if (limit && limit.until > Date.now() && limit.count >= 20) fail(429, "Too many sign-in attempts. Try again later.");
        if (!limit || limit.until <= Date.now()) attempts.set(key, {count:1, until:Date.now()+900000});
        else limit.count++;
        const token = text(body.accessToken, "Sign-in token", 12000);
        let identity;
        try { identity = await verifyIdentity(token); }
        catch (e) { if (e.status === 503) throw e; fail(401, "Your sign-in expired. Please sign in again."); }
        const wallet = identity.linkedAccounts?.find(a => a.type === "wallet" && a.chainType === "solana" && typeof a.address === "string" && a.address.length > 0);
        if (!wallet) fail(403, "Create or connect a Solana wallet to continue.");
        const link = db.prepare("SELECT user_id FROM privy_identities WHERE subject=?").get(identity.id);
        let u;
        if (link) {
          u = db.prepare("SELECT * FROM users WHERE id=?").get(link.user_id);
          db.prepare("UPDATE privy_identities SET wallet=? WHERE subject=?").run(wallet.address, identity.id);
        } else {
          // Invite redemption and new identity creation succeed or roll back together.
          // Never merge or promote an account based on a matching email.
          u = {id:randomUUID(), email:`${identity.id}@privy.local`, name:"", password:passwordHash(randomBytes(32).toString("hex")), role:"borrower"};
          db.exec("BEGIN");
          try {
            if (!redeemInvite(db, body.inviteCode)) throw Object.assign(new Error("Enter a valid invitation code. It may have expired or already been used."), {status:403, code:"INVITE_REQUIRED"});
            db.prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(u.id,u.email,u.name,u.password,u.role);
            db.prepare("INSERT INTO privy_identities VALUES(?,?,?)").run(identity.id,u.id,wallet.address);
            db.exec("COMMIT");
          } catch (e) { db.exec("ROLLBACK"); throw e; }
        }
        session(u);
        return send(200, {user:{...publicUser(u), wallet:wallet.address}});
      }
      if (path === "/api/session" && req.method === "GET")
        return send(200, {
          user: user ? publicUser(user) : null,
          settlement: "simulation",
        });
      if (
        ["/api/register", "/api/login"].includes(path) &&
        req.method === "POST"
      ) {
        const key = req.socket.remoteAddress;
        const limit = attempts.get(key);
        if (limit && limit.until > Date.now() && limit.count >= 20)
          fail(429, "Too many attempts. Try again in 15 minutes.");
        if (!limit || limit.until <= Date.now())
          attempts.set(key, { count: 1, until: Date.now() + 900000 });
        else limit.count++;
        if (attempts.size > 1000)
          for (const [k, v] of attempts)
            if (v.until < Date.now()) attempts.delete(k);
        if (!allowLegacyAuth) fail(403, "Continue with email or wallet through Privy.");
        const email = text(body.email, "Email").toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          fail(400, "Enter a valid email address.");
        const password = text(body.password, "Password", 128);
        let u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
        if (path === "/api/register") {
          if (password.length < 12)
            fail(400, "Use at least 12 characters for your password.");
          if (u)
            fail(
              409,
              "An account with this email already exists. Sign in instead.",
            );
          u = {
            id: randomUUID(),
            email,
            name: text(body.name, "Business name"),
            password: passwordHash(password),
            role: "borrower",
          };
          db.prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(
            u.id,
            u.email,
            u.name,
            u.password,
            u.role,
          );
        } else if (!u || !passwordMatches(password, u.password))
          fail(401, "Email or password is incorrect.");
        session(u);
        return send(200, { user: publicUser(u) });
      }
      if (!user) fail(401, "Please sign in to continue.");
      if (path === "/api/logout" && req.method === "POST") {
        db.prepare("DELETE FROM sessions WHERE token=?").run(
          sessionHash(rawToken),
        );
        res.setHeader(
          "Set-Cookie",
          `float_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`,
        );
        return send(200, {});
      }
      if (path === "/api/profile" && req.method === "POST") {
        const name = text(body.name, "Business name");
        db.prepare("UPDATE users SET name=? WHERE id=?").run(name,user.id);
        return send(200,{user:publicUser({...user,name})});
      }
      if (path === "/api/applications" && req.method === "GET") {
        const rows =
          user.role === "operator"
            ? db.prepare("SELECT data FROM applications").all()
            : db
                .prepare("SELECT data FROM applications WHERE user_id=?")
                .all(user.id);
        return send(200, rows.map((r) => JSON.parse(r.data)).reverse());
      }
      if (path === "/api/applications" && req.method === "POST") {
        if (user.role !== "borrower")
          fail(403, "Only businesses can submit applications.");
        if (!user.name.trim()) fail(400, "Add your business name before applying.");
        const a = {
          id: randomUUID(),
          userId: user.id,
          businessName: user.name,
          payer: text(body.payer, "Customer"),
          invoiceNumber: text(body.invoiceNumber, "Invoice reference", 100),
          amount: money(body.amount, "Advance", 5000),
          expectedInflow: money(body.expectedInflow, "Invoice amount"),
          termDays: body.termDays,
          invoiceDue: body.invoiceDue,
          status: "Requested",
          feeBps: 0,
          totalDue: 0,
          requestedAt: Date.now(),
          dueAt: null,
          events: [],
          settlement: "simulation",
        };
        if (a.amount > a.expectedInflow)
          fail(400, "Advance cannot exceed the invoice amount.");
        if (!Number.isInteger(a.termDays) || a.termDays < 1 || a.termDays > 60)
          fail(400, "Choose a term between 1 and 60 days.");
        if (
          typeof a.invoiceDue !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(a.invoiceDue) ||
          !Number.isFinite(Date.parse(a.invoiceDue)) ||
          new Date(a.invoiceDue).toISOString().slice(0, 10) !== a.invoiceDue
        )
          fail(400, "Enter a valid invoice due date.");
        const existing = db
          .prepare("SELECT data FROM applications WHERE user_id=?")
          .all(user.id)
          .map((r) => JSON.parse(r.data));
        if (
          existing.some(
            (x) =>
              x.invoiceNumber.toLowerCase() === a.invoiceNumber.toLowerCase() &&
              x.payer.toLowerCase() === a.payer.toLowerCase(),
          )
        )
          fail(
            409,
            "You have already submitted this invoice for this customer.",
          );
        const doc = body.document;
        if (!doc || typeof doc.base64 !== "string")
          fail(400, "Attach a PDF, PNG, or JPEG invoice.");
        const name = text(doc.name, "File name", 180);
        const content = Buffer.from(doc.base64, "base64");
        if (!content.length || content.length > 5 * 1024 * 1024)
          fail(400, "Invoice must be between 1 byte and 5 MB.");
        const mime =
          content.subarray(0, 5).toString() === "%PDF-"
            ? "application/pdf"
            : content
                  .subarray(0, 8)
                  .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
              ? "image/png"
              : content[0] === 255 && content[1] === 216 && content[2] === 255
                ? "image/jpeg"
                : null;
        if (!mime)
          fail(400, "Only PDF, PNG, and JPEG invoice files are accepted.");
        a.documentName = name;
        record(a, "Business", "Application submitted with invoice.");
        db.exec("BEGIN");
        try {
          db.prepare("INSERT INTO applications VALUES(?,?,?)").run(
            a.id,
            user.id,
            JSON.stringify(a),
          );
          db.prepare("INSERT INTO documents VALUES(?,?,?,?)").run(
            a.id,
            name,
            mime,
            content,
          );
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return send(201, a);
      }
      const match = path.match(
        /^\/api\/applications\/([a-z0-9-]+)\/(document|offer|accept|decline|fund|repay|reject|information|respond)$/,
      );
      if (match) {
        const row = db
          .prepare("SELECT * FROM applications WHERE id=?")
          .get(match[1]);
        if (!row || (user.role !== "operator" && row.user_id !== user.id))
          fail(404, "Application not found.");
        const a = JSON.parse(row.data),
          action = match[2];
        if (action === "document" && req.method === "GET") {
          const doc = db
            .prepare("SELECT * FROM documents WHERE application_id=?")
            .get(a.id);
          if (!doc) fail(404, "Document not found.");
          res.setHeader("Content-Type", doc.mime);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="invoice${{ "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg" }[doc.mime]}"`,
          );
          return res.end(Buffer.from(doc.content));
        }
        if (req.method !== "POST" || action === "document")
          fail(405, "Method not allowed.");
        const operatorAction = [
          "offer",
          "fund",
          "reject",
          "information",
        ].includes(action);
        if (
          operatorAction
            ? user.role !== "operator"
            : user.role !== "borrower" || a.userId !== user.id
        )
          fail(403, "You are not authorised for this action.");
        const allowed = {
          offer: ["Requested"],
          reject: ["Requested", "NeedsInformation"],
          information: ["Requested"],
          respond: ["NeedsInformation"],
          accept: ["Offered"],
          decline: ["Offered"],
          fund: ["Accepted"],
          repay: ["Active"],
        };
        if (!allowed[action]?.includes(a.status))
          fail(
            409,
            "This application has changed. Refresh to see its current status.",
          );
        if (action === "offer") {
          if (
            !Number.isInteger(body.feeBps) ||
            body.feeBps < 0 ||
            body.feeBps > 1000
          )
            fail(400, "Fee must be between 0 and 1,000 basis points.");
          a.reviewNote = text(body.note, "Review note", 2000);
          a.feeBps = body.feeBps;
          a.totalDue =
            (Math.round(a.amount * 100) +
              Math.round((Math.round(a.amount * 100) * a.feeBps) / 10000)) /
            100;
          a.status = "Offered";
          record(
            a,
            "Float",
            `Offer issued: ${a.amount} USDC; total repayment ${a.totalDue} USDC. ${a.reviewNote}`,
          );
        } else if (action === "information" || action === "reject") {
          const note = text(body.note, "Reason", 2000);
          a.status = action === "information" ? "NeedsInformation" : "Rejected";
          record(a, "Float", note);
        } else if (action === "respond") {
          a.status = "Requested";
          record(a, "Business", text(body.note, "Response", 2000));
        } else if (action === "accept") {
          a.status = "Accepted";
          a.acceptedAt = Date.now();
          record(
            a,
            "Business",
            "Accepted the test financing terms. Awaiting simulated funding.",
          );
        } else if (action === "decline") {
          a.status = "Declined";
          record(a, "Business", "Declined the offer.");
        } else if (action === "fund") {
          a.status = "Active";
          a.disbursedAt = Date.now();
          a.dueAt = Date.now() + a.termDays * DAY;
          record(
            a,
            "Float",
            "Simulated disbursement recorded. No money moved.",
          );
        } else if (action === "repay") {
          a.status = "Repaid";
          a.repaidAt = Date.now();
          record(
            a,
            "Business",
            "Simulated full repayment recorded. No money moved.",
          );
        }
        save(a);
        return send(200, a);
      }
      fail(404, "Not found.");
    } catch (error) {
      if (!error.status) console.error(error);
      send(error.status || 500, {
        ...(error.code === "INVITE_REQUIRED" ? {code:error.code} : {}),
        error: error.status
          ? error.message
          : "Something went wrong. Please try again.",
      });
    }
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  createApp().listen(
    Number(process.env.PORT || 3001),
    process.env.HOST || "127.0.0.1",
    () =>
      console.log(
        "Float API listening on http://127.0.0.1:" + (process.env.PORT || 3001),
      ),
  );
}
