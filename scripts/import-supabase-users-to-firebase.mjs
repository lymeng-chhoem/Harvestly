import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createClient } from "@supabase/supabase-js";
import "./load-next-env.mjs";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}

const firebaseApp = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const firebaseAuth = getAuth(firebaseApp);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function assertMigrationReady() {
  const { error } = await supabase
    .from("app_users")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Supabase migration is not ready: public.app_users is unavailable.");
    console.error("Run npm run auth:migrate:supabase first with a reachable SUPABASE_DB_URL.");
    throw error;
  }
}

async function listSupabaseUsers() {
  const exportPath = process.env.SUPABASE_AUTH_USERS_EXPORT;
  if (exportPath) {
    const parsed = JSON.parse(await readFile(exportPath, "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.users;
  }

  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < 1000) break;
  }
  return users;
}

function firebaseUserFromSupabase(user) {
  const uid = user.id;
  const email = user.email ?? undefined;
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
  const imported = {
    uid,
    email,
    emailVerified,
    displayName: user.raw_user_meta_data?.full_name ?? user.raw_user_meta_data?.name ?? undefined,
    photoURL: user.raw_user_meta_data?.avatar_url ?? undefined,
    disabled: false,
  };

  if (typeof user.encrypted_password === "string" && user.encrypted_password) {
    imported.passwordHash = Buffer.from(user.encrypted_password);
  }

  return imported;
}

async function listFirebaseUids() {
  const uids = new Set();
  let pageToken;
  do {
    const result = await firebaseAuth.listUsers(1000, pageToken);
    for (const user of result.users) uids.add(user.uid);
    pageToken = result.pageToken;
  } while (pageToken);
  return uids;
}

function weekStartForCambodia(timestamp) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Phnom_Penh",
  }).formatToParts(new Date(timestamp));
  const part = (type) => parts.find((entry) => entry.type === type)?.value ?? "";
  const localMidnight = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00+07:00`);
  const daysSinceMonday = (localMidnight.getUTCDay() + 6) % 7;
  localMidnight.setUTCDate(localMidnight.getUTCDate() - daysSinceMonday);
  return localMidnight.toISOString().slice(0, 10);
}

function validScanRecord(record) {
  return record
    && typeof record === "object"
    && typeof record.id === "string"
    && typeof record.createdAt === "string"
    && !Number.isNaN(Date.parse(record.createdAt))
    && ["rice", "cassava", "unknown"].includes(record.cropId)
    && typeof record.conditionCode === "string"
    && typeof record.confidence === "number"
    && record.confidence >= 0
    && record.confidence <= 1
    && ["high", "medium", "low"].includes(record.risk);
}

function scanRowsFromSupabaseUser(user) {
  const metadata = user.raw_user_meta_data ?? user.user_metadata ?? {};
  const history = Array.isArray(metadata.harvestly_scan_history)
    ? metadata.harvestly_scan_history.filter(validScanRecord)
    : [];
  const usage = Array.isArray(metadata.harvestly_scan_usage)
    ? metadata.harvestly_scan_usage.filter((value) => typeof value === "string" && !Number.isNaN(Date.parse(value)))
    : [];
  const rowsByTime = new Map();

  for (const record of history) {
    rowsByTime.set(record.createdAt, {
      id: record.id,
      user_id: user.id,
      week_start: weekStartForCambodia(record.createdAt),
      status: "succeeded",
      completed_at: record.createdAt,
      crop_id: record.cropId,
      condition_code: record.conditionCode,
      confidence: record.confidence,
      risk: record.risk,
    });
  }

  for (const timestamp of usage) {
    if (rowsByTime.has(timestamp)) continue;
    rowsByTime.set(timestamp, {
      id: randomUUID(),
      user_id: user.id,
      week_start: weekStartForCambodia(timestamp),
      status: "succeeded",
      completed_at: timestamp,
      crop_id: null,
      condition_code: null,
      confidence: null,
      risk: null,
    });
  }

  return Array.from(rowsByTime.values());
}

await assertMigrationReady();
const supabaseUsers = await listSupabaseUsers();
const firebaseUsers = supabaseUsers.map(firebaseUserFromSupabase);
const existingFirebaseUids = await listFirebaseUids();
const usersToImport = firebaseUsers.filter((user) => !existingFirebaseUids.has(user.uid));
const existingFirebaseUsersMatched = firebaseUsers.length - usersToImport.length;
const usersWithHashes = usersToImport.filter((user) => user.passwordHash);
const usersWithoutHashes = usersToImport.filter((user) => !user.passwordHash);

let imported = existingFirebaseUsersMatched;
let failed = 0;

for (let i = 0; i < usersWithHashes.length; i += 1000) {
  const batch = usersWithHashes.slice(i, i + 1000);
  const result = await firebaseAuth.importUsers(batch, { hash: { algorithm: "BCRYPT" } });
  imported += result.successCount;
  failed += result.failureCount;
  for (const error of result.errors) console.error("Password import failed:", error);
}

for (let i = 0; i < usersWithoutHashes.length; i += 1000) {
  const batch = usersWithoutHashes.slice(i, i + 1000);
  const result = await firebaseAuth.importUsers(batch);
  imported += result.successCount;
  failed += result.failureCount;
  for (const error of result.errors) console.error("Passwordless import failed:", error);
}

const appUserRows = supabaseUsers.map((user) => ({
  id: user.id,
  firebase_uid: user.id,
  email: user.email ?? null,
}));
const { error: appUserError } = await supabase
  .from("app_users")
  .upsert(appUserRows, { onConflict: "firebase_uid" });
if (appUserError) throw appUserError;

const scanRows = supabaseUsers.flatMap(scanRowsFromSupabaseUser);
if (scanRows.length > 0) {
  for (let i = 0; i < scanRows.length; i += 1000) {
    const { error } = await supabase
      .from("scan_usage")
      .upsert(scanRows.slice(i, i + 1000), { onConflict: "id" });
    if (error) throw error;
  }
}

const { count: appUserCount } = await supabase
  .from("app_users")
  .select("id", { count: "exact", head: true });
const { count: profileCount } = await supabase
  .from("profiles")
  .select("id", { count: "exact", head: true });

console.log(JSON.stringify({
  totalSupabaseUsers: supabaseUsers.length,
  importedFirebaseUsers: imported,
  existingFirebaseUsersMatched,
  failedFirebaseUsers: failed,
  appUserRows: appUserCount,
  profileRows: profileCount,
  importedScanRows: scanRows.length,
  usersRequiringPasswordReset: usersWithoutHashes.length,
}, null, 2));
