# Predictive Engine

Python-served local website for the Predictive Engine dashboard. This project
does not require Node, npm, Vite, or a build step.

## Run Locally

1. Add Supabase configuration to `.env`:
   `SUPABASE_URL="https://your-project-ref.supabase.co"`
   `SUPABASE_PUBLISHABLE_KEY="sb_publishable_your-public-browser-key"`
   `SUPABASE_DATA_API="https://your-project-ref.supabase.co/rest/v1/your_table"`
2. Start the Python server:
   `py server.py`
3. Open:
   `http://localhost:3000`

The app redirects to the login page unless a Supabase session is already saved
in browser localStorage.

## Account Creation

The login page supports both sign in and account creation. In Supabase, make
sure email/password auth is enabled under Authentication > Providers > Email.

If Confirm email is enabled, new users must confirm their email before they can
sign in. For local testing, you can disable Confirm email in Supabase, or create
and confirm users manually under Authentication > Users.

## Supabase Variables

`SUPABASE_URL` is available in Supabase under Project Settings > Data API > Project URL.

`SUPABASE_PUBLISHABLE_KEY` is available in Supabase under Project Settings > API Keys. Copy the publishable key for browser/client-side usage. Older Supabase projects may show a Legacy API Keys section instead; in that case, copy the `anon public` key and put it in `SUPABASE_ANON_KEY`.

Do not use `service_role`, `secret`, or `JWT signing secret` values in the browser. Those are server-side secrets and can trigger invalid-key errors or create security risk.

`SUPABASE_DATA_API` should point to the REST endpoint you want the dashboard to
fetch after login. For example:
`https://your-project-ref.supabase.co/rest/v1/matches?select=*`

The browser sends the logged-in Supabase access token as `Authorization: Bearer ...`
when fetching `SUPABASE_DATA_API`.

## Invalid API Key Checklist

If Supabase returns `Invalid API key`, confirm:

1. `SUPABASE_URL` and the key come from the same Supabase project.
2. The key is the public browser key: `sb_publishable_...` or the legacy `anon public` JWT.
3. You restarted `py server.py` after editing `.env`.
4. `SUPABASE_DATA_API` points to the same project URL as `SUPABASE_URL`.
5. `.env` does not use the JWT signing secret, service role key, or secret key as the public key.
