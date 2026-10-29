(() => {
  const KEY = 'ruchi-raagam-orders-v1';
  const ADMIN = 'ramuachary8763@gmail.com';
  const config = window.RUCHI_RAAGAM_SUPABASE;
  const configured = config?.url && !config.url.includes('YOUR_PROJECT_REF') && config.publishableKey && !config.publishableKey.includes('YOUR_SUPABASE_');
  const shell = document.querySelector('.shell');
  if (!shell) return;
  const style = document.createElement('style');
  style.textContent = `.rr-cloud-gate[hidden]{display:none!important}.rr-cloud-gate{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:20px;background:rgba(31,24,19,.62);font:14px Arial,sans-serif}.rr-gate-card{width:min(100%,440px);padding:30px;border:1px solid #e8ded4;border-radius:16px;background:#fff;box-shadow:0 24px 70px #0003}.rr-gate-card h2{margin:10px 0;font:700 30px/1.1 Georgia,serif;color:#2b211b}.rr-gate-card p{color:#76685d;line-height:1.55}.rr-gate-card label{display:block;margin:18px 0 6px;font-weight:700}.rr-gate-card input{width:100%;padding:12px;border:1px solid #e8ded4;border-radius:7px}.rr-gate-card button{margin-top:14px}.rr-gate-card #rrAuthStatus{min-height:20px;margin-bottom:0}`;
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
    gate.innerHTML = `<div class="rr-gate-card"><div class="eyebrow">Private restaurant dashboard</div><h2>Sign in to view orders</h2><p>We’ll email a secure sign-in link to the restaurant account.</p><label for="rrAdminEmail">Admin email</label><input id="rrAdminEmail" type="email" value="${ADMIN}" readonly><button id="rrSendLogin" class="btn btn-primary" type="button">Send sign-in link</button><p id="rrAuthStatus" role="status" aria-live="polite"></p></div>`;
    shell.prepend(gate);
    const status = gate.querySelector('#rrAuthStatus');
    gate.querySelector('#rrSendLogin').addEventListener('click', async event => {
      event.currentTarget.disabled = true;
      status.textContent = 'Sending secure sign-in link…';
      try {
        const client = await window.rrSupabaseReady;
        const { error } = await client.auth.signInWithOtp({ email: ADMIN, options: { shouldCreateUser: false, emailRedirectTo: location.href.split('#')[0] } });
        if (error) throw error;
        status.textContent = `Check ${ADMIN} for the sign-in link.`;
      } catch (error) {
        status.textContent = error.message || 'Could not send the sign-in link.';
        event.currentTarget.disabled = false;
      }
    });
    return gate;
  };

  const toOrder = row => ({
    id: row.id, createdAt: row.created_at, updatedAt: row.updated_at,
    customer: { name: row.customer_name, phone: row.phone, address: row.address, landmark: row.landmark, pincode: row.pincode, note: row.customer_note },
    items: row.items, total: row.total, subtotal: row.subtotal,
    distanceKm: row.distance_km, deliveryCharge: row.delivery_charge,
    discount: row.discount, couponCode: row.coupon_code,
    payment: row.payment_method, paymentProvider: row.payment_provider, paymentStatus: row.payment_status, paymentId: row.razorpay_payment_id, fulfillment: row.fulfillment,
    status: row.status, sentVia: row.sent_via, backend: true
  });

  window.rrSupabaseReady?.then(async client => {
    if (!configured || !client) return;
    const gate = makeGate();
    const status = gate.querySelector('#rrAuthStatus');
    let syncing = false;
    let lastOrders = [];
    let activeUserId = '';
    const publish = orders => {
      lastOrders = orders;
      localStorage.setItem(KEY, JSON.stringify(orders));
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    };
    const fetchOrders = async () => {
      const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      publish((data || []).map(toOrder));
    };
    const syncLocal = async event => {
      if (syncing || !Array.isArray(event.detail)) return;
      const latest = event.detail;
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const order of latest.filter(item => item.backend && uuid.test(item.id))) {
        const previous = lastOrders.find(item => item.id === order.id);
        if (!previous || previous.status !== order.status || previous.fulfillment !== order.fulfillment || previous.paymentStatus !== order.paymentStatus) {
          const { error } = await client.from('orders').update({ status: order.status, fulfillment: order.fulfillment, payment_status: order.paymentStatus || 'unpaid' }).eq('id', order.id);
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
      } catch (error) {
        gate.hidden = false;
        status.textContent = `Could not load shared orders: ${error.message}`;
      } finally { syncing = false; }
      client.channel('ruchi-raagam-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async payload => {
        try {
          await fetchOrders();
          if (payload.eventType === 'INSERT') {
            const fresh = lastOrders.find(order => order.id === payload.new.id);
            if (fresh) window.dispatchEvent(new CustomEvent('rr:order-added', { detail: fresh }));
          }
        } catch (error) { console.error('Could not refresh live orders:', error); }
      }).subscribe();
      window.addEventListener('rr:local-orders-changed', syncLocal);
    };
    const { data: { user }, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError') status.textContent = error.message;
    await startDashboard(user);
    client.auth.onAuthStateChange((_event, session) => { if (session?.user) startDashboard(session.user); });
  });
})();
