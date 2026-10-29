# Ruchi Raagam live orders and payments

The website code supports shared Supabase orders, a live restaurant dashboard, customer order tracking, and Razorpay Standard Checkout. It is **not connected yet** while `backend-config.js` contains placeholders. Production activation needs the restaurant's Supabase project and Razorpay merchant credentials.

## 1. Connect Supabase

1. Create or open the restaurant's Supabase project.
2. In Project Settings → API, copy the Project URL and the **publishable** key (the legacy `anon` key also works) into `backend-config.js`:

   ```js
   window.RUCHI_RAAGAM_SUPABASE = {
     url: 'https://<project-ref>.supabase.co',
     publishableKey: '<publishable-key>'
   };
   ```

   This key is designed for browser use with Row Level Security. Never put a Supabase secret/service-role key in this file.

3. Install the Supabase CLI, link this folder to the project, and apply every migration in filename order:

   ```sh
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   The migrations are `202610260001_orders_dashboard.sql`, `202610270001_delivery_coupons.sql`, `202610270002_delivery_pincode.sql`, `202610270003_newsletter_and_price_validation.sql`, `202610270004_razorpay_checkout.sql`, `202610270005_gateway_payment_providers.sql`, `202610270006_customer_order_tracking.sql`, `202610290001_admin_payment_status.sql`, `202610290002_customer_order_cancellation_window.sql`, and `202610290003_customer_order_30_second_window.sql`.

4. In Supabase Authentication, create the restaurant admin `ruchiragam@gmail.com`, configure Email sign-in, and set the deployed HTTPS website and `/dashboard.html` as allowed redirect URLs. Customer accounts are enabled by the website; phone OTP additionally needs an SMS provider.
5. Deploy the static site over HTTPS. Once Supabase is configured, ordinary confirmed orders are submitted to Supabase and appear in the signed-in dashboard through Realtime. The customer tracking page also reads the shared order status.

The database validates menu SKUs, prices, coupon math, and delivery charges. Anonymous customers can submit only through the validating `submit_order` function. Order reads and admin workflow changes are restricted to the authenticated restaurant email. Browser storage is only a local fallback and does not share orders between devices.

## 2. Deploy Razorpay checkout

The Edge Function creates payment orders server-side, checks the item prices and total, verifies Razorpay's signature and captured payment state, and saves only verified paid orders. Its webhook handles captured payments if the customer doesn't return to the website.

1. Activate the Razorpay merchant account. Start with **Test Mode** keys and complete test orders before switching to Live Mode.
2. In Supabase Dashboard → Edge Functions → Secrets, set these values directly in the dashboard:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`

   Do not send the secret values in chat, commit them to GitHub, or put them in browser files. Supabase injects its project URL and server-side secret key into the Edge Function runtime.

3. Deploy the function:

   ```sh
   supabase functions deploy razorpay-checkout --project-ref <project-ref>
   ```

4. In Razorpay Dashboard → Webhooks, add `https://<project-ref>.supabase.co/functions/v1/razorpay-checkout`, subscribe to `payment.captured` (and `order.paid` if available), and use the same webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
5. Use Test Mode first. After successful, failed, dismissed, and webhook-recovery flows work, change the three Edge Function secrets to the Razorpay **Live Mode** values. The public Razorpay Key ID is returned by the function; the secret stays server-side.

Razorpay's merchant account must be approved and Live Mode enabled before live collections can succeed. UPI, PhonePe, and Internet Banking choices in the form are manual payment instructions; Razorpay is the actual online gateway path. Other branded gateway options are not connected payment processors.

## What is shared and what is not

- Normal website orders are saved to Supabase immediately when the customer confirms checkout; an email or WhatsApp send is not required for dashboard delivery.
- The authenticated dashboard listens for database Realtime updates and writes order, fulfillment, and payment status changes back to Supabase.
- Browser notifications require the dashboard to remain open and notification permission to be granted.
- Email order notifications use the website's configured email submission flow; they are separate from saving a shared order.
- The 30-second cancel/automatic-accept status rule works in the tracking page and dashboard while one of those pages is open. Exact scheduled updates when every browser is closed require a server-side scheduled job.

See the [Supabase Edge Function secrets guide](https://supabase.com/docs/guides/functions/secrets), [Supabase function deployment guide](https://supabase.com/docs/guides/functions/deploy), and [Razorpay Standard Checkout integration steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).
