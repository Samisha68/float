import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordMatches(password, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(passwordHash(password, salt).split(":")[1], "hex"),
  );
}
export function openStore(
  path = process.env.FLOAT_DB || resolve("data/float.sqlite"),
) {
  if (path !== ":memory:")
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('borrower','operator')));
    CREATE TABLE IF NOT EXISTS privy_identities (subject TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES users(id), wallet TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS invites (hash TEXT PRIMARY KEY, remaining INTEGER NOT NULL CHECK(remaining>=0), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS documents (application_id TEXT PRIMARY KEY REFERENCES applications(id), name TEXT NOT NULL, mime TEXT NOT NULL, content BLOB NOT NULL);
  `);
  return db;
}
