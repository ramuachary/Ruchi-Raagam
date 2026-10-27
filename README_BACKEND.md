# Ruchi Raagam shared order dashboard setup

The static website currently saves a local copy of an order and opens the customer's email app. These files add an optional Supabase backend so orders can be stored online and appear in the restaurant dashboard on other devices.

## One-time setup

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In the project SQL Editor, run the migrations in filename order: `202610260001_orders_dashboard.sql`, `202610270001_delivery_coupons.sql`, `202610270002_delivery_pincode.sql`, `202610270003_newsletter_and_price_validation.sql`, `202610270004_razorpay_checkout.sql`, then `202610270005_gateway_payment_providers.sql`.
3. In Supabase Project Settings → API, copy the Project URL and the **publishable** key into `backend-config.js`.
4. In Authentication → Users, create the admin user `ruchiragam@gmail.com`. In Authentication → Providers, enable Email and Phone. For email customer accounts, enable email/password and choose whether to require email confirmation. For phone accounts, configure an SMS provider and enable phone OTP. Set the site URL and allowed redirect URLs to the deployed HTTPS website (including `/dashboard.html`).
5. Deploy the website and dashboard over HTTPS. Open `/dashboard.html` and use **Send sign-in link**. Sign in from the restaurant email account.

The SQL only allows anonymous order creation through a validating function. Reading, changing status, and clearing orders require an authenticated account whose email is `ruchiragam@gmail.com`. Never put a Supabase service-role/secret key in browser files.

## Customer accounts

`customer-auth.js` adds a sign-in gate for the customer website once Supabase is configured. Customers can create an account with email and password (then confirm by email if confirmation is enabled) or use a phone number in international format and verify an SMS code. The site stays publicly viewable while the placeholder Supabase settings remain unchanged; replace the URL and publishable key in `backend-config.js` to activate the gate. Use only the Supabase publishable/anon key in browser code, never a service-role/secret key. Phone OTP requires a configured SMS provider and may incur provider charges.

Migration `202610270003_newsletter_and_price_validation.sql` creates `newsletter_subscribers` and a public subscribe function that only inserts/updates an email; public clients cannot read the list. Newsletter signups are stored but are not automatically emailed marketing campaigns. The order RPC recomputes item prices, coupon discounts, delivery charges and totals on the database using the menu SKU order in `index.html`. The entered distance still comes from the customer; use verified delivery zones or a trusted distance service before relying on it for final delivery eligibility. Migration `202610270004_razorpay_checkout.sql` stores Razorpay payment states and private checkout sessions.

Migration `202610270006_customer_order_tracking.sql` enables the customer order-tracking section. It only returns an order's reference, status, fulfilment type and timestamps after both its UUID and checkout phone number match. Apply this migration to Supabase to enable tracking on another device; without Supabase, the site can only show an order saved in the same browser.

## Razorpay online checkout

The website uses Razorpay Standard Checkout. It creates each gateway order server-side, checks the item prices and total again, verifies the callback signature and captured payment on the server, and stores a paid order for the dashboard. A webhook also records a captured payment if the customer closes the page before returning. Do not put `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, or a Supabase secret/service-role key in browser files or GitHub.

1. Create/activate the restaurant's Razorpay merchant account and use **Test Mode** keys first.
2. Deploy `supabase/functions/razorpay-checkout` with the Supabase CLI or Dashboard.
3. In Supabase Edge Function Secrets, set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. The Supabase secret key is provided to the function by Supabase.
4. In Razorpay Dashboard → Webhooks, add `https://<project-ref>.supabase.co/functions/v1/razorpay-checkout` and subscribe to `payment.captured`; use the same webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
5. Run the migrations above, configure `backend-config.js`, and test successful, failed, dismissed, and webhook payment flows in Razorpay Test Mode before using Live Mode.

Razorpay requires an order to be created by the server and requires signature/payment-state checks before fulfilment. See the [Razorpay web integration steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) and [Supabase Edge Function secrets guide](https://supabase.com/docs/guides/functions/secrets).

## What becomes shared

- Website orders are written to Supabase when the customer chooses the order email action, and kept in browser storage as a fallback.
- The signed-in dashboard reads orders from Supabase and listens for Realtime database changes.
- Dashboard status and fulfilment changes are written back to Supabase.
- The dashboard can show browser notifications after the restaurant enables notifications in that browser.

Email sending is still performed by the customer's email app; this backend stores orders submitted by the website. Browser notifications require the dashboard to remain open and browser notification permission to be granted.
