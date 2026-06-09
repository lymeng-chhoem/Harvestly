This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Crop Analysis Service

Harvestly forwards selected JPG or PNG photos through the server-side `POST /api/analyze` endpoint. Configure the hosted model in `.env.local`:

```bash
HARVESTLY_MODEL_ENDPOINT=https://your-model-host.example/analyze
HARVESTLY_MODEL_API_KEY=your-server-only-api-key
```

`HARVESTLY_MODEL_API_KEY` is optional and is sent as a Bearer token only by the server route. The hosted endpoint must accept multipart form data in the `image` field and return JSON:

```json
{
  "cropId": "rice",
  "conditionCode": "rice_brown_spot",
  "confidence": 0.91,
  "risk": "high"
}
```

Supported `conditionCode` values currently include `rice_brown_spot`, `rice_blast`, and `cassava_bacterial_blight`. Other valid codes display cautious fallback guidance. Guest completed results are stored in browser storage on the current device, capped at the latest 30 entries; uploaded photos are never saved to history.

## Authentication and scan limits

Harvestly uses Firebase Authentication for email/password accounts, Google login, Facebook login, and password recovery. Email/password signup requires email confirmation. Supabase remains the server-side database and image storage backend. Copy the placeholder structure from `.env.local.example` into your private `.env.local` for local development. Configure the same values in Vercel for deployed environments:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-web-app-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres.your-project-ref:your-db-password@aws-0-region.pooler.supabase.com:6543/postgres
```

`FIREBASE_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HARVESTLY_MODEL_ENDPOINT`, and `HARVESTLY_MODEL_API_KEY` must remain server-only. Never move these values into `NEXT_PUBLIC_` variables.

For localhost, use `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. In Vercel, set `NEXT_PUBLIC_SITE_URL` to that deployment's canonical public origin, such as `https://your-production-domain.example`, without a trailing path.

### Firebase and Supabase setup

1. Create a Firebase project and web app, then copy the web config into the `NEXT_PUBLIC_FIREBASE_*` variables.
2. Create a Firebase service account and copy its project ID, client email, and private key into the server-only Firebase variables.
3. In Firebase Authentication, enable Email/Password, Google, and Facebook providers. Add your localhost and deployed domains under authorized domains.
4. Configure Firebase email action links to route to Harvestly's handler:

```text
http://localhost:3000/auth/action
https://your-production-domain.example/auth/action
```

5. Create a hosted Supabase project, then copy its project URL and service-role key into the environment variables above.
6. Apply the SQL files in `supabase/migrations`, including `202606020001_firebase_auth_app_users.sql`, before testing login and profile editing. With `SUPABASE_DB_URL` configured, run:

```bash
node scripts/apply-supabase-firebase-migration.mjs
```
7. Registered usernames are claimed through the `profiles.username` unique index. Scan allowance and result history are stored in `scan_usage`.

### Importing existing users

Run the one-time import after applying the Firebase migration:

```bash
node scripts/import-supabase-users-to-firebase.mjs
```

If you have a JSON export of Supabase `auth.users` that includes `encrypted_password`, set `SUPABASE_AUTH_USERS_EXPORT=/path/to/users.json` first so the script can import bcrypt password hashes. Without that export, users are imported without passwords and must use Forgot password.

Before allowing ordinary Facebook users, deploy the public legal routes and configure Meta with:

```text
Privacy Policy URL: https://your-production-domain.example/privacy
Data Deletion Instructions URL: https://your-production-domain.example/data-deletion
```

Set the app domain and complete any Meta live-mode requirements before public release. Google and Facebook OAuth redirect configuration is managed in Firebase Authentication.

### Authentication checks

After configuration, test locally:

1. Create an email/password account, open the confirmation email, and sign in. Confirm that `/complete-profile` requests a lowercase username before continuing.
2. Try an invalid username, then save a valid username. Try the same username on a second account and confirm the second account sees a "username already taken" message.
3. Visit the homepage after setup and confirm its top-right greeting includes that username and opens the structured profile page in Settings.
4. Use **Continue with Google** and confirm that a new or existing incomplete profile is sent through the same username setup flow.
5. Use **Continue with Facebook** with an assigned Meta tester account and confirm that a new or existing incomplete profile is sent through the same username setup flow.
6. From `/login`, choose **Forgot password?**, open the recovery email, choose a new password, and sign in with the new password.
7. Open an expired recovery link and confirm it offers a new reset email rather than showing an ordinary login error.
8. Visit `/privacy` and `/data-deletion` on the deployed origin before entering those URLs in Meta.

### Profile photo checks

After applying `supabase/migrations/202605310001_profile_avatars.sql`, run `supabase/profile_avatars_verify.sql` in the Supabase SQL Editor. Every returned row should have `passed = true`.

Then test locally while signed in:

1. Open `/settings` and confirm the page shows the username, email, Free plan, weekly scan usage, reset time, language controls, readability controls, and sign out.
2. Change the username to a valid unused value and confirm it saves without leaving `/settings`.
3. Try an invalid username and a taken username and confirm each shows a clear inline error.
4. Upload a JPG, PNG, or WebP profile photo under 2MB and confirm it appears on `/settings` and wherever the user appears in community UI.
5. Try an unsupported or oversized image and confirm it shows a clear inline error without replacing the current profile photo.
6. Remove the profile photo and confirm the initials avatar returns.

Access rules:

- Anonymous visitors receive one successful crop scan on their current browser. Usage and history are stored in `localStorage`, so clearing browser storage resets this MVP convenience limit.
- Signed-in users receive five successful scans each week. Weeks reset Monday at `00:00` in `Asia/Phnom_Penh`.
- Each signed-in account chooses a unique display username. Usernames use 3-24 lowercase letters, numbers, or underscores.
- Only successful registered analyses spend a weekly scan. Successful registered result metadata is saved in `scan_usage` and available across devices; uploaded photos are never saved.
- The community page requires a signed-in account. `community_posts` is prepared for future use, but posting is not included in this MVP.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
