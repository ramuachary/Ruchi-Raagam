# Ruchi Raagam live orders and payments

The website code supports shared Supabase orders, a live restaurant dashboard, customer order tracking, and Razorpay Standard Checkout. `backend-config.js` is connected to the Ruchi Raagam Supabase project. Razorpay still requires merchant credentials and server-side setup before online gateway payments can work.

## 1. Connect Supabase

1. Open the restaurant's Supabase project.
2. `backend-config.js` already contains its Project URL and browser-safe **publishable** key. Never put a Supabase secret/service-role key in this file.

3. In Supabase Dashboard → SQL Editor, paste and run these migrations once, in order:
   - `supabase/migrations/202611160001_current_menu_order_validation.sql` updates current menu price/name checks and adds a safe retry RPC so a network timeout followed by retry cannot create duplicate orders.
   - `supabase/migrations/202611160002_order_staff_and_delivery_assignment.sql` adds the accepted-by and delivery-person fields and returns the assigned delivery person's name in phone-verified order tracking.

4. In Supabase Authentication, create the restaurant admin `ramuachary8763@gmail.com`, configure Email sign-in, and set the deployed HTTPS website and `/dashboard.html` as allowed redirect URLs. Customer accounts are enabled by the website; phone OTP additionally needs an SMS provider.
5. Deploy the updated site over HTTPS. Confirmed ordinary orders are submitted to Supabase; the dashboard listens for Realtime and refreshes every 15 seconds as a fallback. If syncing fails, the customer sees the problem and can safely retry.

The database validates menu SKUs, prices, coupon math, and delivery charges. Anonymous customers can submit only through the validating `submit_order` function. Order reads and admin workflow changes are restricted to the authenticated restaurant email `ramuachary8763@gmail.com`. Browser storage is only a local fallback and does not share orders between devices.

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
- The authenticated dashboard listens for database Realtime updates, refreshes every 15 seconds as a fallback, and writes order, fulfillment, payment status, accepted-by, and delivery-person changes back to Supabase.
- Browser notifications require the dashboard to remain open and notification permission to be granted.
- Email order notifications use the website's configured email submission flow; they are separate from saving a shared order.
- The 30-second cancel/automatic-accept status rule works in the tracking page and dashboard while one of those pages is open. Exact scheduled updates when every browser is closed require a server-side scheduled job.

See the [Supabase Edge Function secrets guide](https://supabase.com/docs/guides/functions/secrets), [Supabase function deployment guide](https://supabase.com/docs/guides/functions/deploy), and [Razorpay Standard Checkout integration steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).
