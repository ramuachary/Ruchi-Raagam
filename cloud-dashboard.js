(() => {
  const KEY = 'ruchi-raagam-orders-v1';
  const REVIEWS_KEY = 'ruchi-raagam-reviews-v1';
  const ADMIN = 'ramuachary8763@gmail.com';
  const recoveryParams = new URLSearchParams(location.search);
  const recoveryHash = new URLSearchParams(location.hash.slice(1));
  let passwordRecoveryPending = recoveryParams.get('type') === 'recovery' || recoveryParams.has('code') || recoveryHash.get('type') === 'recovery';
  const config = window.RUCHI_RAAGAM_SUPABASE;
  const configured = config?.url && !config.url.includes('YOUR_PROJECT_REF') && config.publishableKey && !config.publishableKey.includes('YOUR_SUPABASE_');
  const shell = document.querySelector('.shell');
  if (!shell) return;
  const style = document.createElement('style');
  style.textContent = `.rr-cloud-gate[hidden]{display:none!important}.rr-cloud-gate{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:20px;background:rgba(31,24,19,.62);font:14px Arial,sans-serif}.rr-gate-card{width:min(100%,440px);padding:30px;border:1px solid #e8ded4;border-radius:16px;background:#fff;box-shadow:0 24px 70px #0003}.rr-gate-card h2{margin:10px 0;font:700 30px/1.1 Georgia,serif;color:#2b211b}.rr-gate-card p{color:#76685d;line-height:1.55}.rr-gate-card label{display:block;margin:18px 0 6px;font-weight:700}.rr-gate-card input{width:100%;padding:12px;border:1px solid #e8ded4;border-radius:7px}.rr-gate-card button{margin-top:14px}.rr-gate-card .rr-reset-button{margin-left:10px;background:transparent;color:#a84427;border:0;text-decoration:underline;cursor:pointer}.rr-gate-card #rrAuthStatus{min-height:20px;margin-bottom:0}`;
  document.head.append(style);

  const addSignOut = () => {
    const actions = document.querySelector('.top-actions');
    if (!actions || document.getElementById('rrSignOut')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn'; button.id = 'rrSignOut'; button.textContent = 'Sign out';
    button.addEventListener('click', async () => { const client = await window.rrSupabaseReady; await client.auth.signOut(); location.reload(); });
    actions.prepend(button);
  };

  const makeGate = () => {
    const gate = document.createElement('section');
    gate.className = 'rr-cloud-gate';
    gate.innerHTML = `<form class="rr-gate-card" id="rrAdminLogin"><div class="eyebrow">Private restaurant dashboard</div><h2>Sign in to view orders</h2><p>Use your restaurant admin email and password.</p><label for="rrAdminEmail">Admin email</label><input id="rrAdminEmail" type="email" value="${ADMIN}" autocomplete="username" required><label for="rrAdminPassword">Password</label><input id="rrAdminPassword" type="password" autocomplete="current-password" required><button id="rrSendLogin" class="btn btn-primary" type="submit">Sign in</button><button id="rrResetPassword" class="rr-reset-button" type="button">Forgot password?</button><p id="rrAuthStatus" role="status" aria-live="polite"></p></form>`;
    shell.prepend(gate);
    const status = gate.querySelector('#rrAuthStatus');
    const loginForm = gate.querySelector('#rrAdminLogin');
    let recoveryMode = passwordRecoveryPending;
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const submitButton = gate.querySelector('#rrSendLogin');
      const email = gate.querySelector('#rrAdminEmail').value.trim();
      const password = gate.querySelector('#rrAdminPassword').value;
      submitButton.disabled = true;
      status.textContent = recoveryMode ? 'Updating password…' : 'Signing in…';
      try {
        const client = await window.rrSupabaseReady;
        const { error } = recoveryMode
          ? await client.auth.updateUser({ password })
          : await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (recoveryMode) {
          recoveryMode = false;
          passwordRecoveryPending = false;
          status.textContent = 'Password updated. Opening dashboard…';
          const { data } = await client.auth.getUser();
          await startDashboard(data.user);
        } else status.textContent = 'Signed in. Opening dashboard…';
      } catch (error) {
        status.textContent = error.message || 'Could not sign in.';
        submitButton.disabled = false;
      }
    });
    gate.querySelector('#rrResetPassword').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      status.textContent = `Sending a password reset link to ${ADMIN}…`;
      try {
        const client = await window.rrSupabaseReady;
        const { error } = await client.auth.resetPasswordForEmail(ADMIN, { redirectTo: location.href.split('#')[0] });
        if (error) throw error;
        status.textContent = `Check ${ADMIN} for the password reset link.`;
      } catch (error) {
        status.textContent = error.message || 'Could not send the reset link.';
        button.disabled = false;
      }
    });
    gate.showPasswordRecovery = () => {
      recoveryMode = true;
      passwordRecoveryPending = true;
      gate.hidden = false;
      gate.querySelector('label[for="rrAdminPassword"]').textContent = 'New password';
      gate.querySelector('#rrAdminPassword').autocomplete = 'new-password';
      gate.querySelector('#rrAdminPassword').minLength = 8;
      gate.querySelector('#rrResetPassword').hidden = true;
      gate.querySelector('#rrSendLogin').textContent = 'Save new password';
      status.textContent = 'Choose a new password with at least 8 characters.';
    };
    if (recoveryMode) gate.showPasswordRecovery();
    return gate;
  };

  const toOrder = row => ({
    id: row.id, createdAt: row.created_at, updatedAt: row.updated_at,
    customer: { name: row.customer_name, phone: row.phone, address: row.address, landmark: row.landmark, pincode: row.pincode, note: row.customer_note },
    items: row.items, total: row.total, subtotal: row.subtotal,
    distanceKm: row.distance_km, deliveryCharge: row.delivery_charge,
    packagingCharge: row.packaging_charge, platformFee: row.platform_fee,
    gstCharge: row.gst_charge, tip: row.tip,
    discount: row.discount, couponCode: row.coupon_code,
    payment: row.payment_method, paymentProvider: row.payment_provider, paymentStatus: row.payment_status, paymentId: row.razorpay_payment_id, fulfillment: row.fulfillment,
    status: row.status, sentVia: row.sent_via, acceptedBy: row.accepted_by || '', deliveryPerson: row.delivery_person || '', backend: true
  });
  const toReview = row => ({ id: row.id, name: row.reviewer_name || 'Guest', rating: row.rating, message: row.message, createdAt: row.created_at, backend: true });

  window.rrSupabaseReady?.then(async client => {
    if (!configured || !client) return;
    const gate = makeGate();
    const status = gate.querySelector('#rrAuthStatus');
    let syncing = false;
    let lastOrders = [];
    let activeUserId = '';
    let refreshTimer = null;
    let refreshInFlight = false;
    const dashboardNotice = document.querySelector('.notice');
    const readyNotice = dashboardNotice?.textContent || '';
    const publish = orders => {
      lastOrders = orders;
      localStorage.setItem(KEY, JSON.stringify(orders));
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    };
    const fetchOrders = async () => {
      const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      publish((data || []).map(toOrder));
      if (dashboardNotice) dashboardNotice.textContent = readyNotice;
    };
    const refreshOrdersSafely = async () => {
      if (refreshInFlight || document.hidden || !activeUserId) return;
      refreshInFlight = true;
      try { await fetchOrders(); }
      catch (error) { console.warn('Dashboard refresh failed; it will retry automatically:', error); }
      finally { refreshInFlight = false; }
    };
    const fetchReviews = async () => {
      const { data, error } = await client.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const localOnly = (() => { try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]').filter(review => !review.backend); } catch { return []; } })();
      localStorage.setItem(REVIEWS_KEY, JSON.stringify([...localOnly, ...(data || []).map(toReview)]));
      window.dispatchEvent(new StorageEvent('storage', { key: REVIEWS_KEY }));
    };
    const syncLocal = async event => {
      if (syncing || !Array.isArray(event.detail)) return;
      const latest = event.detail;
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const order of latest.filter(item => item.backend && uuid.test(item.id))) {
        const previous = lastOrders.find(item => item.id === order.id);
        if (!previous || previous.status !== order.status || previous.fulfillment !== order.fulfillment || previous.paymentStatus !== order.paymentStatus || previous.acceptedBy !== order.acceptedBy || previous.deliveryPerson !== order.deliveryPerson) {
          const { error } = await client.from('orders').update({ status: order.status, fulfillment: order.fulfillment, payment_status: order.paymentStatus || 'unpaid', accepted_by: order.acceptedBy || '', delivery_person: order.deliveryPerson || '' }).eq('id', order.id);
          if (error) console.error('Could not sync order status:', error);
        }
      }
      const remaining = new Set(latest.map(item => item.id));
      const removed = lastOrders.filter(item => item.backend && !remaining.has(item.id));
      for (const order of removed) {
        const { error } = await client.from('orders').delete().eq('id', order.id);
        if (error) console.error('Could not delete completed order:', error);
      }
      lastOrders = latest;
    };
    const startDashboard = async user => {
      if (passwordRecoveryPending) {
        gate.showPasswordRecovery();
        return;
      }
      if (!user) return;
      if (user?.email?.toLowerCase() !== ADMIN) {
        await client.auth.signOut();
        gate.hidden = false;
        status.textContent = `Only ${ADMIN} can open this dashboard.`;
        return;
      }
      if (activeUserId === user.id) return;
      activeUserId = user.id;
      gate.hidden = true;
      addSignOut();
      try {
        syncing = true;
        await fetchOrders();
        await fetchReviews().catch(error => console.error('Could not load customer reviews yet:', error));
      } catch (error) {
        console.error('Signed in, but could not load shared orders:', error);
        if (dashboardNotice) dashboardNotice.textContent = `Signed in, but shared orders could not load: ${error.message}. The dashboard will retry automatically.`;
      } finally { syncing = false; }
      client.channel('ruchi-raagam-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async payload => {
        try {
          await fetchOrders();
          if (payload.eventType === 'INSERT') {
            const fresh = lastOrders.find(order => order.id === payload.new.id);
            if (fresh) window.dispatchEvent(new CustomEvent('rr:order-added', { detail: fresh }));
          }
        } catch (error) { console.error('Could not refresh live orders:', error); }
      }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, async payload => {
        try {
          await fetchReviews();
          const fresh = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]').find(review => review.id === payload.new.id);
          if (fresh) window.dispatchEvent(new CustomEvent('rr:review-added', { detail: fresh }));
        } catch (error) { console.error('Could not refresh customer reviews:', error); }
      }).subscribe((channelStatus, channelError) => {
        if (channelStatus === 'SUBSCRIBED') refreshOrdersSafely();
        if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT' || channelStatus === 'CLOSED') {
          console.warn('Dashboard live updates disconnected; automatic refresh remains active.', channelError || channelStatus);
          refreshOrdersSafely();
        }
      });
      if (!refreshTimer) refreshTimer = window.setInterval(refreshOrdersSafely, 15000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshOrdersSafely();
      });
      window.addEventListener('rr:local-orders-changed', syncLocal);
    };
    const { data: { user }, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError') status.textContent = error.message;
    await startDashboard(user);
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') gate.showPasswordRecovery();
      else if (session?.user) startDashboard(session.user);
    });
  });
})();
