# Predictive Engine

Python-served local website for the Predictive Engine dashboard. This project
does not require Node, npm, Vite, or a build step.

## Run Locally

1. Add Supabase configuration to `.env`:
   `SUPABASE_URL="https://your-project-ref.supabase.co"`
   `SUPABASE_ANON_KEY="your-public-anon-key"`
   `SUPABASE_DATA_API="https://your-project-ref.supabase.co/rest/v1/your_table"`
2. Start the Python server:
   `py server.py`
3. Open:
   `http://localhost:3000`

The app redirects to the login page unless a Supabase session is already saved
in browser localStorage.

## Supabase Variables

`SUPABASE_URL` is available in Supabase under Project Settings > API > Project URL.

`SUPABASE_ANON_KEY` is available in Supabase under Project Settings > API > Project API keys > anon public.

`SUPABASE_DATA_API` should point to the REST endpoint you want the dashboard to
fetch after login. For example:
`https://your-project-ref.supabase.co/rest/v1/matches?select=*`

The browser sends the logged-in Supabase access token as `Authorization: Bearer ...`
when fetching `SUPABASE_DATA_API`.
