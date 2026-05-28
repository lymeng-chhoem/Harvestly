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

Harvestly uses Supabase Auth for email/password accounts, Google login, Facebook login, and password recovery. Email/password signup requires email confirmation. Copy the placeholder structure from `.env.local.example` into your private `.env.local` for local development. Configure the public values in Vercel for deployed environments:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=support@example.com
```

`HARVESTLY_MODEL_ENDPOINT` and `HARVESTLY_MODEL_API_KEY` must remain server-only. They are used only by the analysis route. Never move these values into `NEXT_PUBLIC_` variables.

For localhost, use `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. In Vercel, set `NEXT_PUBLIC_SITE_URL` to that deployment's canonical public origin, such as `https://your-production-domain.example`, without a trailing path.

### Supabase setup

1. Create a hosted Supabase project, then copy its project URL and anon key into the environment variables above.
2. In **Authentication > Providers**, enable Email and keep **Confirm email** enabled. Supabase's built-in email sender is sufficient while developing.
3. Registered usernames are claimed through the `profiles.username` unique index and mirrored to Supabase Auth metadata for the app greeting. Scan allowance and result history are still stored in the signed-in user's Supabase Auth metadata.
4. In **Authentication > URL Configuration**, set **Site URL** to the final production site URL once known.
5. Add redirect URLs for every environment that can initiate authentication:

```text
http://localhost:3000/auth/callback
https://your-production-domain.example/auth/callback
https://*-your-vercel-team-slug.vercel.app/auth/callback
```

Use the exact production URL when deploying. Replace the Vercel team/account slug after Vercel creates the project; the preview wildcard allows authentication from preview deployments.

Password reset emails redirect through `/auth/callback` and then to `/update-password`, where the user selects the new password. If you customize Supabase confirmation or recovery email templates, make sure they use the redirect target supplied by the application (`{{ .RedirectTo }}`) rather than always sending users to the Site URL.

### Google login setup

1. Create a Web OAuth client in Google Auth Platform / Google Cloud Console.
2. Add the Supabase provider callback URL as an authorized redirect URI in Google:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

3. Copy the Google Client ID and Client Secret into **Authentication > Providers > Google** in Supabase and enable the provider.
4. Keep the Harvestly app callback URLs listed in Supabase URL Configuration as described above.

The Google flow uses two redirects: Google returns to Supabase at `/auth/v1/callback`, and Supabase returns the signed-in user to Harvestly at `/auth/callback`.

### Facebook login setup

1. Create a Meta app with Facebook Login and request `public_profile` and `email`.
2. Add the Supabase provider callback URL as a valid OAuth redirect URI in Meta:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

3. Copy the Meta App ID and App Secret into **Authentication > Providers > Facebook** in Supabase and enable the provider.
4. While the Meta app is in development mode, test with an administrator, developer, or tester account assigned to that app.
5. Before allowing ordinary Facebook users, deploy the public legal routes and configure Meta with:

```text
Privacy Policy URL: https://your-production-domain.example/privacy
Data Deletion Instructions URL: https://your-production-domain.example/data-deletion
```

Set the app domain and complete any Meta live-mode requirements before public release.

### Authentication checks

After configuration, test locally:

1. Create an email/password account, open the confirmation email, and sign in. Confirm that `/complete-profile` requests a lowercase username before continuing.
2. Try an invalid username, then save a valid username. Try the same username on a second account and confirm the second account sees a "username already taken" message.
3. Visit the homepage after setup and confirm its top-right greeting includes that username and opens the structured account panel in Settings.
4. Use **Continue with Google** and confirm that a new or existing incomplete profile is sent through the same username setup flow.
5. Use **Continue with Facebook** with an assigned Meta tester account and confirm that a new or existing incomplete profile is sent through the same username setup flow.
6. From `/login`, choose **Forgot password?**, open the recovery email, choose a new password, and sign in with the new password.
7. Open an expired recovery link and confirm it offers a new reset email rather than showing an ordinary login error.
8. Visit `/privacy` and `/data-deletion` on the deployed origin before entering those URLs in Meta.

Access rules:

- Anonymous visitors receive one successful crop scan on their current browser. Usage and history are stored in `localStorage`, so clearing browser storage resets this MVP convenience limit.
- Signed-in users receive five successful scans each week. Weeks reset Monday at `00:00` in `Asia/Phnom_Penh`.
- Each signed-in account chooses a unique display username. Usernames use 3-24 lowercase letters, numbers, or underscores.
- Only successful registered analyses spend a weekly scan. Successful registered result metadata is saved in Supabase Auth metadata and available across devices; uploaded photos are never saved.
- The community page requires a signed-in account. `community_posts` is prepared for future use, but posting is not included in this MVP.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
