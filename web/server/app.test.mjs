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
async function setup(t, path = ":memory:", getTransaction) {
  const db = openStore(path);
  const server = createApp({ db, origin, allowLegacyAuth: true, getTransaction });
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

test("pricing comes from the server, and a repayment record lowers it", async (t) => {
  const { borrower, operator, stranger, client } = await setup(t);

  // A signed-out caller cannot price anything.
  assert.equal((await client()("/quote?amount=2500&days=30")).status, 401);

  const first = await borrower("/quote?amount=2500&days=30");
  assert.equal(first.status, 200);
  assert.equal(first.data.repayments, 0);
  assert.equal(first.data.rate, 1.8);
  assert.equal(first.data.fee, 45);
  assert.equal(first.data.total, 2545);
  assert.equal(first.data.marginRequired, 150);
  assert.equal(first.data.provisional, true);

  // Bad inputs are refused rather than guessed at.
  assert.equal((await borrower("/quote?amount=0&days=30")).status, 400);
  assert.equal((await borrower("/quote?amount=2500&days=90")).status, 400);
  assert.equal((await borrower("/quote?amount=2500")).status, 400);

  // Take an advance all the way through repayment.
  const id = (await borrower("/applications", application)).data.id;
  await operator(`/applications/${id}/offer`, { feeBps: 180, note: "Reviewed" });
  await borrower(`/applications/${id}/accept`, {});
  await operator(`/applications/${id}/fund`, {});
  assert.equal((await borrower(`/applications/${id}/repay`, {})).data.status, "Repaid");

  const second = await borrower("/quote?amount=2500&days=30");
  assert.equal(second.data.repayments, 1);
  assert.equal(second.data.rate, 1.7, "one repayment earns 0.1 points");
  assert.equal(second.data.marginRequired, 145);

  // One borrower's record never prices another's advance.
  assert.equal((await stranger("/quote?amount=2500&days=30")).data.repayments, 0);
});

test("the operator queue carries the borrower's record and a suggested fee", async (t) => {
  const { borrower, operator } = await setup(t);
  const id = (await borrower("/applications", application)).data.id;

  const queued = (await operator("/applications")).data.find((a) => a.id === id);
  assert.equal(queued.borrowerRecord, 0);
  assert.equal(queued.suggestedFeeBps, 180);
  assert.ok(queued.suggestedFeeBps <= 1000, "never suggests a fee the program would reject");

  // The borrower's own view stays free of operator-side hints.
  const own = (await borrower("/applications")).data.find((a) => a.id === id);
  assert.equal(own.borrowerRecord, undefined);
  assert.equal(own.suggestedFeeBps, undefined);
});

/* Reconciliation: an application is only marked paid when the chain agrees. */
import { createHash } from "node:crypto";
import { Keypair, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, businessPda } from "./chain.mjs";

const SIGNATURE = "4".repeat(88);
const OTHER_SIGNATURE = "5".repeat(88);

function repaidTransaction({ wallet, totalDue, advance = Keypair.generate().publicKey.toBase58() }) {
  const body = Buffer.alloc(85);
  new PublicKey(advance).toBuffer().copy(body, 0);
  new PublicKey(businessPda(wallet)).toBuffer().copy(body, 32);
  body.writeBigUInt64LE(BigInt(Math.round(totalDue * 1e6)), 64);
  body.writeUInt32LE(1, 73);
  const discriminator = createHash("sha256").update("event:AdvanceRepaid").digest().subarray(0, 8);
  return {
    slot: 999,
    meta: {
      err: null,
      logMessages: [
        `Program ${PROGRAM_ID} invoke [1]`,
        `Program data: ${Buffer.concat([discriminator, body]).toString("base64")}`,
      ],
    },
    transaction: { message: { accountKeys: [{ pubkey: wallet, signer: true }] } },
  };
}

async function fundedAdvance(t, { wallet, chain, bindAfter = false } = {}) {
  const context = await setup(t, ":memory:", chain);
  const { db, borrower, operator } = context;
  const bind = () =>
    db.prepare("INSERT INTO privy_identities VALUES(?,?,?)").run(
      `did:privy:${wallet.slice(0, 8)}`,
      db.prepare("SELECT id FROM users WHERE email='borrower@example.com'").get().id,
      wallet,
    );
  if (wallet && !bindAfter) bind();
  const id = (await borrower("/applications", application)).data.id;
  if (wallet && bindAfter) bind();
  await operator(`/applications/${id}/offer`, { feeBps: 180, note: "Reviewed" });
  await borrower(`/applications/${id}/accept`, {});
  await operator(`/applications/${id}/fund`, {});
  return { ...context, id };
}

test("a repayment claimed with a signature is checked against the chain", async (t) => {
  const wallet = Keypair.generate().publicKey.toBase58();
  // The wallet must be bound before the application is created, as it is in the real flow.
  const context = await setup(t, ":memory:", async () => repaidTransaction({ wallet, totalDue: 2545 }));
  const { db, borrower, operator } = context;
  db.prepare("INSERT INTO privy_identities VALUES(?,?,?)").run(
    "did:privy:test",
    db.prepare("SELECT id FROM users WHERE email='borrower@example.com'").get().id,
    wallet,
  );
  const id = (await borrower("/applications", application)).data.id;
  assert.equal((await borrower("/applications")).data[0].wallet, wallet, "the application is bound to the wallet");

  await operator(`/applications/${id}/offer`, { feeBps: 180, note: "Reviewed" });
  await borrower(`/applications/${id}/accept`, {});
  await operator(`/applications/${id}/fund`, {});

  const repaid = await borrower(`/applications/${id}/repay`, { signature: SIGNATURE });
  assert.equal(repaid.status, 200);
  assert.equal(repaid.data.status, "Repaid");
  assert.equal(repaid.data.settlement, "onchain");
  assert.equal(repaid.data.chain.signature, SIGNATURE);
  assert.equal(repaid.data.chain.slot, 999);
  assert.match(repaid.data.events.at(-1).message, /confirmed on Solana/);
});

test("one transaction cannot settle two advances", async (t) => {
  const wallet = Keypair.generate().publicKey.toBase58();
  const context = await setup(t, ":memory:", async () => repaidTransaction({ wallet, totalDue: 2545 }));
  const { db, borrower, operator } = context;
  db.prepare("INSERT INTO privy_identities VALUES(?,?,?)").run(
    "did:privy:test",
    db.prepare("SELECT id FROM users WHERE email='borrower@example.com'").get().id,
    wallet,
  );
  const ids = [];
  for (const invoiceNumber of ["INV-A", "INV-B"]) {
    const id = (await borrower("/applications", { ...application, invoiceNumber })).data.id;
    await operator(`/applications/${id}/offer`, { feeBps: 180, note: "Reviewed" });
    await borrower(`/applications/${id}/accept`, {});
    await operator(`/applications/${id}/fund`, {});
    ids.push(id);
  }
  assert.equal((await borrower(`/applications/${ids[0]}/repay`, { signature: SIGNATURE })).status, 200);
  const replay = await borrower(`/applications/${ids[1]}/repay`, { signature: SIGNATURE });
  assert.equal(replay.status, 409);
  assert.match(replay.data.error, /already been used/);
  assert.equal((await borrower("/applications")).data.find((a) => a.id === ids[1]).status, "Active");
});

test("an unverifiable claim leaves the advance outstanding", async (t) => {
  const wallet = Keypair.generate().publicKey.toBase58();
  const stranger = Keypair.generate().publicKey.toBase58();
  for (const [label, chain, expected] of [
    ["no such transaction", async () => null, /could not find that transaction/],
    ["someone else's repayment", async () => repaidTransaction({ wallet: stranger, totalDue: 2545 }), /not signed by the wallet/],
    ["the wrong amount", async () => repaidTransaction({ wallet, totalDue: 10 }), /does not match what this advance owes/],
  ]) {
    const { borrower, id } = await fundedAdvance(t, { wallet, chain });
    const attempt = await borrower(`/applications/${id}/repay`, { signature: OTHER_SIGNATURE });
    assert.equal(attempt.status, 400, label);
    assert.match(attempt.data.error, expected, label);
    assert.equal((await borrower("/applications")).data[0].status, "Active", `${label}: still owed`);
  }
});

test("a malformed signature never reaches the chain, and an unbound wallet is refused", async (t) => {
  let called = 0;
  const { borrower, id } = await fundedAdvance(t, {
    chain: async () => {
      called++;
      return null;
    },
  });
  const bad = await borrower(`/applications/${id}/repay`, { signature: "nope" });
  assert.equal(bad.status, 400);
  assert.match(bad.data.error, /does not look like a Solana transaction signature/);
  assert.equal(called, 0, "a malformed signature is rejected before any RPC call");

  const unbound = await borrower(`/applications/${id}/repay`, { signature: SIGNATURE });
  assert.equal(unbound.status, 400);
  assert.match(unbound.data.error, /Link a Solana wallet/, "no wallet anywhere on the account, so nothing can be checked");
});

test("a browser cannot bind its own wallet to an application", async (t) => {
  const { borrower } = await setup(t);
  const claimed = Keypair.generate().publicKey.toBase58();
  const created = await borrower("/applications", { ...application, wallet: claimed });
  assert.equal(created.status, 201);
  assert.equal(created.data.wallet, null, "a wallet supplied by the browser is ignored");
});

test("an advance applied for before a wallet was linked can still settle", async (t) => {
  const wallet = Keypair.generate().publicKey.toBase58();
  const { borrower, id } = await fundedAdvance(t, {
    wallet,
    bindAfter: true,
    chain: async () => repaidTransaction({ wallet, totalDue: 2545 }),
  });
  const before = (await borrower("/applications")).data[0];
  assert.equal(before.wallet, null, "nothing was bound when this application was created");

  const repaid = await borrower(`/applications/${id}/repay`, { signature: SIGNATURE });
  assert.equal(repaid.status, 200);
  assert.equal(repaid.data.settlement, "onchain");
  assert.equal(repaid.data.wallet, wallet, "the verified wallet is kept on the application");
});
