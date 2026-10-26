# Ruchi Raagam shared order dashboard setup

The static website currently saves a local copy of an order and opens the customer's email app. These files add an optional Supabase backend so orders can be stored online and appear in the restaurant dashboard on other devices.

## One-time setup

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In the project SQL Editor, run `supabase/migrations/202610260001_orders_dashboard.sql`.
3. In Supabase Project Settings → API, copy the Project URL and the **publishable** key into `backend-config.js`.
4. In Authentication → Users, create the admin user `ruchiragam@gmail.com`. In Authentication settings, disable public sign-ups, set the site URL and allowed redirect URLs to the deployed HTTPS website (including `/dashboard.html`), and enable email sign-in links.
5. Deploy the website and dashboard over HTTPS. Open `/dashboard.html` and use **Send sign-in link**. Sign in from the restaurant email account.

The SQL only allows anonymous order creation through a validating function. Reading, changing status, and clearing orders require an authenticated account whose email is `ruchiragam@gmail.com`. Never put a Supabase service-role/secret key in browser files.

## What becomes shared

- Website orders are written to Supabase when the customer chooses the order email action, and kept in browser storage as a fallback.
- The signed-in dashboard reads orders from Supabase and listens for Realtime database changes.
- Dashboard status and fulfilment changes are written back to Supabase.
- The dashboard can show browser notifications after the restaurant enables notifications in that browser.

Email sending is still performed by the customer's email app; this backend stores orders submitted by the website. Browser notifications require the dashboard to remain open and browser notification permission to be granted.
