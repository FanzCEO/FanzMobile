## AI handoff notes

- Secrets live in `backend/.env` (Supabase Postgres URL + service role key + JWT/admin keys). Do **not** commit `.env`.
- Admin APIs now expect header `x-admin-key` set to the same `admin_api_key` (frontend uses `VITE_ADMIN_API_KEY`).
- Billing seeds a default membership plan at **$5.99/week** and platform fees are charged to **end consumers** only. AI usage has a small free allowance with overage to consumers.
- Billing/Admin endpoints: `/api/billing/*`, `/api/admin/*`. New tables: platform fees, usage_policies, user_access, feature_toggles.
- Frontend pages wired: Billing + Admin console + Platform fee tab in Settings. Set `VITE_API_BASE_URL` and `VITE_ADMIN_API_KEY` in the web app env before testing.
