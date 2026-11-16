(() => {
  const STORAGE_KEY = 'ruchi-raagam-orders-v1';
  const makeUuid = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      const random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 3 | 8)).toString(16);
    });
  };
  const languageIsTelugu = () => document.documentElement.lang === 'te';
  let soundContext;
  const unlockOrderSound = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      soundContext ||= new AudioContextClass();
      if (soundContext.state === 'suspended') soundContext.resume().catch(() => {});
    } catch { /* Sound is optional when the browser does not support Web Audio. */ }
  };
  document.addEventListener('pointerdown', unlockOrderSound, { once: true, passive: true });
  document.addEventListener('keydown', unlockOrderSound, { once: true });
  window.addEventListener('rr:order-added', () => {
    unlockOrderSound();
    if (!soundContext) return;
    const play = () => {
      const now = soundContext.currentTime;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const start = now + index * 0.12;
        const oscillator = soundContext.createOscillator();
        const volume = soundContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.exponentialRampToValueAtTime(0.075, start + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
        oscillator.connect(volume);
        volume.connect(soundContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.44);
      });
    };
    if (soundContext.state === 'running') play();
    else soundContext.resume().then(play).catch(() => {});
  });
  const readOrders = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const persistOrder = order => {
    const orders = readOrders();
    const index = orders.findIndex(item => item.id === order.id);
    if (index < 0) return;
    orders[index] = { ...orders[index], ...order };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { return; }
    window.dispatchEvent(new CustomEvent('rr:local-orders-changed', { detail: orders }));
  };
  const syncOrder = async order => {
    const current = readOrders().find(item => item.id === order.id) || order;
    if (!current.clientReference) current.clientReference = makeUuid();
    current.cloudStatus = 'pending';
    current.cloudSaveStarted = true;
    activeOrder = current;
    persistOrder(current);
    setCloudStatus('pending');
    try {
      const client = await window.rrSupabaseReady;
      if (!client) throw new Error('Backend is not connected.');
      const { data, error } = await client.rpc('submit_order_idempotent', {
        order_data: {
          customer: current.customer, items: current.items, total: current.total,
          subtotal: current.subtotal, distanceKm: current.distanceKm,
          deliveryCharge: current.deliveryCharge, discount: current.discount,
          couponCode: current.couponCode, payment: current.payment,
          fulfillment: current.fulfillment || 'delivery'
        },
        p_client_reference: current.clientReference
      });
      if (error) throw error;
      const latest = readOrders();
      const saved = { ...current, ...(latest.find(item => item.id === current.id) || {}), id: data, backend: true, cloudStatus: 'synced', cloudSaveStarted: false };
      activeOrder = saved;
      const merged = [saved, ...latest.filter(item => item.id !== current.id && item.id !== data)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('rr:order-cloud-saved', { detail: saved }));
      window.dispatchEvent(new CustomEvent('rr:local-orders-changed', { detail: merged }));
      setCloudStatus('synced');
      return true;
    } catch (error) {
      console.error('Could not save order to the shared dashboard:', error);
      const failed = { ...current, cloudStatus: 'failed', cloudError: error?.message || 'Network error', cloudSaveStarted: false };
      activeOrder = failed;
      persistOrder(failed);
      setCloudStatus('failed', failed.cloudError);
      window.dispatchEvent(new CustomEvent('rr:cloud-order-error', { detail: error }));
      return false;
    }
  };
  const ensureCloudStatus = () => {
    const confirmation = document.getElementById('orderConfirmation');
    if (!confirmation) return null;
    let status = confirmation.querySelector('#orderCloudStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'orderCloudStatus';
      status.className = 'order-cloud-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.id = 'retryCloudOrder';
      retry.className = 'button';
      retry.hidden = true;
      retry.addEventListener('click', async () => {
        if (!activeOrder || retry.disabled) return;
        retry.disabled = true;
        await syncOrder(activeOrder);
        retry.disabled = false;
      });
      status.append(document.createElement('span'), retry);
      confirmation.querySelector('#emailOrderStatus')?.after(status);
    }
    return status;
  };
  let activeOrder = null;
  const setCloudStatus = (state, errorMessage = '') => {
    const status = ensureCloudStatus();
    if (!status) return;
    const te = languageIsTelugu();
    const text = status.querySelector('span');
    const retry = status.querySelector('button');
    if (state === 'synced') {
      text.textContent = te ? 'ఆర్డర్ డాష్‌బోర్డ్‌కు చేరింది.' : 'Order synced to the restaurant dashboard.';
      retry.hidden = true;
      status.dataset.state = 'synced';
    } else if (state === 'pending') {
      text.textContent = te ? 'డాష్‌బోర్డ్‌కు ఆర్డర్ పంపిస్తున్నాం…' : 'Sending order to the dashboard…';
      retry.hidden = true;
      status.dataset.state = 'pending';
    } else {
      text.textContent = te ? 'ఆర్డర్ ఈ పరికరంలో సేవ్ అయింది; డాష్‌బోర్డ్‌కు పంపలేకపోయాం.' : 'Order is saved on this device, but could not reach the dashboard.';
      if (errorMessage) text.title = errorMessage;
      retry.textContent = te ? 'మళ్లీ ప్రయత్నించండి' : 'Retry sync';
      retry.hidden = false;
      status.dataset.state = 'failed';
    }
  };
  document.getElementById('languageToggle')?.addEventListener('click', () => {
    if (activeOrder) setCloudStatus(activeOrder.cloudStatus || 'pending', activeOrder.cloudError);
  });
  const saveOrder = order => {
    const orders = readOrders();
    const existingIndex = orders.findIndex(item => item.id === order.id);
    if (existingIndex !== -1) {
      const existing = orders[existingIndex];
      if (order.sentVia && order.sentVia !== 'Website' && existing.sentVia !== order.sentVia) {
        orders[existingIndex] = { ...existing, sentVia: order.sentVia };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { return; }
        window.dispatchEvent(new CustomEvent('rr:local-orders-changed', { detail: orders }));
      }
      return;
    }
    orders.unshift(order);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
    catch { return; }
    activeOrder = { ...order, clientReference: order.clientReference || makeUuid(), cloudStatus: 'pending' };
    persistOrder(activeOrder);
    window.dispatchEvent(new CustomEvent('rr:order-added', { detail: activeOrder }));
    syncOrder(activeOrder);
  };

  const form = document.getElementById('checkoutForm');
  if (!form) return;
  let draft = null;
  form.addEventListener('submit', () => {
    const customer = Object.fromEntries(new FormData(form).entries());
    const items = [...document.querySelectorAll('.dish')].map((card, index) => ({
      sku: index + 1,
      name: card.querySelector('.dish-title h3')?.textContent.trim() || 'Item',
      portion: card.querySelector('.portion-select')?.selectedOptions[0]?.textContent.split('·')[0].trim() || 'Single',
      variant: card.querySelector('.portion-select') ? (card.querySelector('.portion-select').selectedIndex === 0 ? 'half' : 'full') : 'single',
      quantity: Number(card.querySelector('.qty-value')?.textContent || 0),
      price: Number((card.querySelector('.price')?.textContent || '').replace(/[^0-9]/g, ''))
    })).filter(item => item.quantity > 0);
    if (!items.length) return;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const distanceKm = Number(customer.distanceKm || 0);
    const deliveryCharge = Math.max(0, Math.ceil(distanceKm - 7 - 1e-9)) * 5;
    const coupons = { RAGAM10: { minimum: 150, amount: Math.round(subtotal * 0.10) }, WELCOME50: { minimum: 350, amount: 50 }, FEAST15: { minimum: 500, amount: Math.round(subtotal * 0.15) } };
    const coupon = coupons[customer.couponCode];
    const discount = coupon && subtotal >= coupon.minimum ? Math.min(subtotal, coupon.amount) : 0;
    draft = {
      id: `RR-${Date.now().toString(36).toUpperCase()}`,
      clientReference: makeUuid(),
      createdAt: new Date().toISOString(),
      customer: { name: customer.name, phone: customer.phone, address: customer.address, landmark: customer.landmark, pincode: customer.pincode },
      items,
      subtotal, distanceKm, deliveryCharge, discount, couponCode: customer.couponCode || '',
      total: subtotal + deliveryCharge - discount,
      payment: customer.payment || 'cod',
      fulfillment: 'delivery',
      status: 'new'
    };
    // Save a normal order as soon as the customer confirms it. Online gateway
    // orders are saved only after Razorpay verifies the payment.
    if (draft.payment !== 'razorpay') {
      activeOrder = { ...draft, sentVia: 'Website' };
      ensureCloudStatus();
      setCloudStatus('pending');
      saveOrder(activeOrder);
    }
  });

  document.getElementById('sendWhatsApp')?.addEventListener('click', () => {
    if (draft) saveOrder({ ...draft, sentVia: 'WhatsApp' });
  });

  const emailStatus = document.getElementById('emailOrderStatus');
  if (emailStatus) {
    new MutationObserver(() => {
      if (draft && /Order email sent|ఆర్డర్ email పంపబడింది/i.test(emailStatus.textContent)) {
        saveOrder({ ...draft, sentVia: 'Email' });
      }
    }).observe(emailStatus, { childList: true, characterData: true, subtree: true });
  }
})();
