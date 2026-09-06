import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "./store.mjs";
import { createApp } from "./index.mjs";

const origin = "http://localhost:5173";
const application = {
  payer: "Customer Ltd",
  invoiceNumber: "INV-1",
  invoiceDue: "2026-10-06",
  amount: 2500,
  expectedInflow: 5000,
  termDays: 30,
  document: {
    name: "invoice.pdf",
    base64: Buffer.from("%PDF-1.4\nTest invoice").toString("base64"),
  },
};
async function setup(t, path = ":memory:") {
  const db = openStore(path);
  const server = createApp({ db, origin, allowLegacyAuth: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  function client() {
    let cookie = "";
    return async (path, body, custom = {}) => {
      const res = await fetch(base + "/api" + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          cookie,
          origin,
          "Content-Type": "application/json",
          ...custom,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.headers.get("set-cookie"))
        cookie = res.headers.get("set-cookie").split(";")[0];
      return {
        status: res.status,
        data: res.headers.get("content-type")?.includes("json")
          ? await res.json()
          : await res.text(),
      };
    };
  }
  const borrower = client(),
    operator = client(),
    stranger = client();
  for (const [c, email] of [
    [borrower, "borrower@example.com"],
    [operator, "operator@example.com"],
    [stranger, "stranger@example.com"],
  ]) {
    assert.equal(
      (
        await c("/register", {
          name: email,
          email,
          password: "a-test-password-123",
        })
      ).status,
      200,
    );
  }
  db.prepare(
    "UPDATE users SET role='operator' WHERE email='operator@example.com'",
  ).run();
  return { db, borrower, operator, stranger, client };
}
test("complete review → offer → acceptance → simulated funding → repayment journey", async (t) => {
  const { borrower, operator, stranger } = await setup(t);
  const created = await borrower("/applications", application);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await stranger("/applications")).data.length, 0);
  assert.equal((await stranger(`/applications/${id}/document`)).status, 404);
  assert.equal(
    (
      await borrower(`/applications/${id}/offer`, {
        feeBps: 250,
        note: "Reviewed",
      })
    ).status,
    403,
  );
  assert.equal((await operator(`/applications/${id}/fund`, {})).status, 409);
  assert.equal(
    (
      await operator(`/applications/${id}/information`, {
        note: "Please confirm service delivery.",
      })
    ).data.status,
    "NeedsInformation",
  );
  assert.equal(
    (
      await borrower(`/applications/${id}/respond`, {
        note: "Delivered on 1 September.",
      })
    ).data.status,
    "Requested",
  );
  const offered = await operator(`/applications/${id}/offer`, {
    feeBps: 250,
    note: "Reviewed for prototype testing.",
  });
  assert.equal(offered.data.totalDue, 2562.5);
  assert.equal((await operator(`/applications/${id}/fund`, {})).status, 409);
  assert.equal(
    (await borrower(`/applications/${id}/accept`, {})).data.status,
    "Accepted",
  );
  assert.equal((await borrower(`/applications/${id}/fund`, {})).status, 403);
  assert.equal(
    (await operator(`/applications/${id}/fund`, {})).data.status,
    "Active",
  );
  assert.equal((await operator(`/applications/${id}/fund`, {})).status, 409);
  assert.equal(
    (await borrower(`/applications/${id}/repay`, {})).data.status,
    "Repaid",
  );
  assert.equal((await borrower(`/applications/${id}/repay`, {})).status, 409);
  assert.equal((await borrower("/applications")).data[0].events.length, 7);
  assert.match((await operator(`/applications/${id}/document`)).data, /^%PDF/);
});
test("server validates money, terms, documents, dates, duplicates, and fees", async (t) => {
  const { borrower, operator } = await setup(t);
  for (const invalid of [
    { amount: -1 },
    { amount: 5001 },
    { amount: 0.001 },
    { expectedInflow: 2000 },
    { termDays: 61 },
    { termDays: 1.5 },
    { invoiceDue: "2026-02-30" },
    {
      document: {
        name: "x.html",
        base64: Buffer.from("<script>alert(1)</script>").toString("base64"),
      },
    },
  ]) {
    assert.equal(
      (await borrower("/applications", { ...application, ...invalid })).status,
      400,
    );
  }
  const a = await borrower("/applications", application);
  assert.equal((await borrower("/applications", application)).status, 409);
  for (const feeBps of [-1, 1001, 0.5, "250", null])
    assert.equal(
      (
        await operator(`/applications/${a.data.id}/offer`, {
          feeBps,
          note: "test",
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await operator(`/applications/${a.data.id}/offer`, {
        feeBps: 250,
        note: "",
      })
    ).status,
    400,
  );
});
test("authentication, role assignment, logout, and cross-origin protection", async (t) => {
  const { client, borrower, stranger } = await setup(t);
  assert.equal((await client()("/applications")).status, 401);
  assert.equal(
    (
      await client()("/login", {
        email: "borrower@example.com",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal((await stranger("/session")).data.user.role, "borrower");
  assert.equal(
    (
      await borrower("/applications", application, {
        origin: "https://untrusted.example",
      })
    ).status,
    403,
  );
  assert.equal((await borrower("/logout", {})).status, 200);
  assert.equal((await borrower("/applications")).status, 401);
});
test("saved accounts, applications, and documents survive reopening the database", async () => {
  const dir = mkdtempSync(join(tmpdir(), "float-db-"));
  const path = join(dir, "test.sqlite");
  let db = openStore(path);
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(
    "u",
    "a@example.com",
    "A",
    "hash",
    "borrower",
  );
  db.prepare("INSERT INTO applications VALUES(?,?,?)").run(
    "a",
    "u",
    JSON.stringify(application),
  );
  db.prepare("INSERT INTO documents VALUES(?,?,?,?)").run(
    "a",
    "invoice.pdf",
    "application/pdf",
    Buffer.from("%PDF-1.4"),
  );
  db.close();
  db = openStore(path);
  assert.equal(db.prepare("SELECT * FROM applications").all().length, 1);
  assert.equal(db.prepare("SELECT * FROM documents").all().length, 1);
  db.close();
  rmSync(dir, { recursive: true });
});
test("borrower may decline an offer and operator may reject with a reason", async (t) => {
  const { borrower, operator } = await setup(t);
  const a = (await borrower("/applications", application)).data;
  await operator(`/applications/${a.id}/offer`, {
    feeBps: 100,
    note: "Test offer",
  });
  assert.equal(
    (await borrower(`/applications/${a.id}/decline`, {})).data.status,
    "Declined",
  );
  assert.equal(
    (await borrower(`/applications/${a.id}/accept`, {})).status,
    409,
  );
  const b = (
    await borrower("/applications", { ...application, invoiceNumber: "INV-2" })
  ).data;
  assert.equal(
    (
      await operator(`/applications/${b.id}/reject`, {
        note: "Missing delivery evidence.",
      })
    ).data.status,
    "Rejected",
  );
});
