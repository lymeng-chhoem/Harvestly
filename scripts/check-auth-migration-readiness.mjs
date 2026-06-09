import "./load-next-env.mjs";

const env = process.env;

const groups = {
  "Firebase web": [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ],
  "Firebase Admin": [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ],
  "Supabase data": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ],
  "Supabase SQL runner": [
    "SUPABASE_DB_URL",
  ],
  "App": [
    "NEXT_PUBLIC_SITE_URL",
  ],
};

const result = {};
let missingCount = 0;

for (const [group, keys] of Object.entries(groups)) {
  const missing = keys.filter((key) => !env[key] || env[key].includes("your-"));
  missingCount += missing.length;
  result[group] = {
    ready: missing.length === 0,
    missing,
  };
}

console.log(JSON.stringify(result, null, 2));
if (missingCount > 0) process.exitCode = 1;
