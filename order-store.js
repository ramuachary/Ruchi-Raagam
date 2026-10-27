(() => {
  const STORAGE_KEY = 'ruchi-raagam-orders-v1';
  const readOrders = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const saveOrder = order => {
    const orders = readOrders();
    if (orders.some(item => item.id === order.id)) return;
    orders.unshift(order);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
    catch { return; }
    window.dispatchEvent(new CustomEvent('rr:order-added', { detail: order }));
    if (window.rrSupabaseReady) {
      window.rrSupabaseReady.then(async client => {
        if (!client || order.cloudSaveStarted) return;
        order.cloudSaveStarted = true;
        try {
          const { data, error } = await client.rpc('submit_order', { order_data: {
            customer: order.customer, items: order.items, total: order.total,
            subtotal: order.subtotal, distanceKm: order.distanceKm,
            deliveryCharge: order.deliveryCharge, discount: order.discount,
            couponCode: order.couponCode,
            payment: order.payment, fulfillment: order.fulfillment || 'delivery'
          }});
          if (error) throw error;
          const current = readOrders().filter(item => item.id !== order.id);
          const saved = { ...order, id: data, backend: true };
          current.unshift(saved);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          window.dispatchEvent(new CustomEvent('rr:order-cloud-saved', { detail: saved }));
        } catch (error) {
          console.error('Could not save order to the shared dashboard:', error);
          window.dispatchEvent(new CustomEvent('rr:cloud-order-error', { detail: error }));
        }
      });
    }
  };

  const form = document.getElementById('checkoutForm');
  if (!form) return;
  let draft = null;
  form.addEventListener('submit', () => {
    const customer = Object.fromEntries(new FormData(form).entries());
    const items = [...document.querySelectorAll('.dish')].map(card => ({
      name: card.querySelector('.dish-title h3')?.textContent.trim() || 'Item',
      portion: card.querySelector('.portion-select')?.selectedOptions[0]?.textContent.split('·')[0].trim() || 'Single',
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
      createdAt: new Date().toISOString(),
      customer: { name: customer.name, phone: customer.phone, address: customer.address, landmark: customer.landmark, pincode: customer.pincode },
      items,
      subtotal, distanceKm, deliveryCharge, discount, couponCode: customer.couponCode || '',
      total: subtotal + deliveryCharge - discount,
      payment: customer.payment || 'cod',
      fulfillment: 'delivery',
      status: 'new'
    };
  });

  document.getElementById('sendWhatsApp')?.addEventListener('click', () => {
    if (draft) saveOrder({ ...draft, sentVia: 'Email' });
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
