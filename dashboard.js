(() => {
  const KEY = 'ruchi-raagam-orders-v1';
  const labels = { new: 'New', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', out_for_delivery: 'Out for delivery', picked_up: 'Picked up', delivered: 'Delivered', cancelled: 'Cancelled' };
  const terminal = new Set(['delivered', 'picked_up', 'cancelled']);
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const save = orders => { try { localStorage.setItem(KEY, JSON.stringify(orders)); window.dispatchEvent(new CustomEvent('rr:local-orders-changed', { detail: orders })); } catch { toast('Could not save orders in this browser.'); } };
  const ordersEl = document.getElementById('orders');
  const toastEl = document.getElementById('toast');
  const dashboardView = document.getElementById('dashboardView');
  let filter = 'active';
  let period = 'today';
  let toastTimer;
  const toast = message => { toastEl.textContent = message; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); };
  const now = new Date();
  document.getElementById('today').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  const nextStatus = order => {
    if (order.status === 'new') return 'accepted';
    if (order.status === 'accepted') return 'preparing';
    if (order.status === 'preparing') return 'ready';
    if (order.status === 'ready') return order.fulfillment === 'pickup' ? 'picked_up' : 'out_for_delivery';
    if (order.status === 'out_for_delivery') return 'delivered';
    return '';
  };
  const actionLabel = status => ({ accepted: 'Accept order', preparing: 'Start preparing', ready: 'Mark ready', picked_up: 'Mark picked up', out_for_delivery: 'Out for delivery', delivered: 'Mark delivered' }[status] || 'Update');

  function render() {
    const allOrders = load();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const inPeriod = order => {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return false;
      if (period === 'today') return date >= start && date < new Date(start.getTime() + 86400000);
      if (period === 'week') return date >= weekStart && date < new Date(weekStart.getTime() + 7 * 86400000);
      if (period === 'month') return date >= monthStart && date < new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return true;
    };
    const orders = allOrders.filter(inPeriod);
    const active = orders.filter(order => !terminal.has(order.status));
    const todayKey = now.toDateString();
    document.getElementById('newCount').textContent = orders.filter(order => order.status === 'new').length;
    document.getElementById('activeCount').textContent = active.length;
    document.getElementById('pickupCount').textContent = active.filter(order => order.fulfillment === 'pickup').length;
    document.getElementById('deliveredCount').textContent = orders.filter(order => ['delivered', 'picked_up'].includes(order.status) && new Date(order.updatedAt || order.createdAt).toDateString() === todayKey).length;
    document.getElementById('activeBadge').textContent = active.length;
    const query = document.getElementById('search').value.trim().toLowerCase();
    const shown = orders.filter(order => {
      const isDone = terminal.has(order.status);
      if (filter === 'active' && isDone) return false;
      if (filter === 'completed' && !isDone) return false;
      const searchable = `${order.customer?.name || ''} ${order.customer?.phone || ''} ${order.id || ''}`.toLowerCase();
      return searchable.includes(query);
    });
    if (!shown.length) {
      ordersEl.innerHTML = `<div class="empty"><strong>${query ? 'No matching orders' : filter === 'active' ? 'No active orders yet' : 'No orders to show'}</strong>${query ? 'Try another name or phone number.' : 'New customer orders will appear here after they send their order.'}</div>`;
      return;
    }
    ordersEl.innerHTML = shown.map(order => {
      const status = labels[order.status] || 'New';
      const items = (order.items || []).map(item => `<div class="item"><span>${escapeHtml(item.quantity)} × ${escapeHtml(item.name)} <span class="item-portion">${escapeHtml(item.portion || '')}</span></span><strong>${money(Number(item.price || 0) * Number(item.quantity || 0))}</strong></div>`).join('');
      const address = order.fulfillment === 'pickup' ? 'Customer pickup' : [order.customer?.address, order.customer?.landmark && `Near ${order.customer.landmark}`].filter(Boolean).join(' · ');
      const paymentName = ({ cod: 'Cash on delivery', upi: 'UPI', phonepe: 'PhonePe', internetbanking: 'Internet Banking' })[order.payment] || order.payment || 'Cash on delivery';
      const next = nextStatus(order);
      return `<article class="order-card" data-id="${escapeHtml(order.id)}">
        <div class="order-head"><div><div class="order-id">${escapeHtml(order.id)} · ${escapeHtml(order.sentVia || 'Website')}</div><div class="order-time">${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div></div><span class="badge ${escapeHtml(order.status)}">${status}</span></div>
        <div class="customer"><strong>${escapeHtml(order.customer?.name || 'Customer')}</strong><a href="tel:${escapeHtml(order.customer?.phone || '')}">${escapeHtml(order.customer?.phone || '')}</a><div class="address">${escapeHtml(address || 'No address supplied')}</div></div>
        <div class="items">${items || '<div class="item">Order items unavailable</div>'}</div>
        <div class="total"><span>Total</span><strong>${money(order.total)}</strong></div>
        <div class="meta"><span>${order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}</span><span>${escapeHtml(paymentName)}</span>${order.customer?.note ? `<span>Note: ${escapeHtml(order.customer.note)}</span>` : ''}</div>
        <div class="controls"><label class="fulfillment-label"><span class="sr-only">Fulfilment type</span><select class="fulfillment" aria-label="Fulfilment type"><option value="delivery" ${order.fulfillment !== 'pickup' ? 'selected' : ''}>Delivery</option><option value="pickup" ${order.fulfillment === 'pickup' ? 'selected' : ''}>Pickup</option></select></label><label class="status-label"><span class="sr-only">Order status</span><select class="status" aria-label="Order status">${Object.entries(labels).map(([value, text]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${text}</option>`).join('')}</select></label>${next ? `<button class="btn btn-primary advance" type="button">${actionLabel(next)}</button>` : ''}</div>
      </article>`;
    }).join('');
  }

  function updateOrder(id, changes) {
    const orders = load().map(order => order.id === id ? { ...order, ...changes, updatedAt: new Date().toISOString() } : order);
    save(orders); render();
  }
  ordersEl.addEventListener('click', event => {
    const button = event.target.closest('.advance');
    if (!button) return;
    const card = button.closest('[data-id]');
    const order = load().find(item => item.id === card.dataset.id);
    if (!order) return;
    const status = nextStatus(order);
    updateOrder(order.id, { status });
    toast(`Order ${order.id}: ${labels[status]}`);
  });
  ordersEl.addEventListener('change', event => {
    const card = event.target.closest('[data-id]');
    if (!card) return;
    if (event.target.matches('.fulfillment')) updateOrder(card.dataset.id, { fulfillment: event.target.value });
    if (event.target.matches('.status')) {
      updateOrder(card.dataset.id, { status: event.target.value });
      toast(`Order status: ${labels[event.target.value]}`);
    }
  });
  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
    render();
  }));
  document.querySelectorAll('.period-tab').forEach(button => button.addEventListener('click', () => {
    period = button.dataset.period;
    document.querySelectorAll('.period-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    render();
  }));
  document.getElementById('search').addEventListener('input', render);
  const openDashboard = document.getElementById('openDashboard');
  const closeDashboard = document.getElementById('closeDashboard');
  if (openDashboard && dashboardView) openDashboard.addEventListener('click', event => { event.preventDefault(); dashboardView.hidden = false; closeDashboard?.focus(); render(); });
  if (closeDashboard && dashboardView) closeDashboard.addEventListener('click', () => { dashboardView.hidden = true; openDashboard?.focus(); });
  if (dashboardView) {
    dashboardView.addEventListener('click', event => { if (event.target === dashboardView) { dashboardView.hidden = true; openDashboard?.focus(); } });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dashboardView.hidden) { dashboardView.hidden = true; openDashboard?.focus(); } });
  }
  document.getElementById('clearCompleted').addEventListener('click', () => {
    const remaining = load().filter(order => !terminal.has(order.status));
    save(remaining); render(); toast('Completed orders cleared from this browser.');
  });
  document.getElementById('enableNotifications').addEventListener('click', async event => {
    if (!('Notification' in window)) { toast('Browser notifications are not supported here.'); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') { event.currentTarget.textContent = 'Notifications enabled'; toast('New order notifications are enabled.'); }
    else toast('Allow notifications in your browser settings.');
  });
  const notify = order => {
    render(); toast(`New order from ${order.customer?.name || 'customer'}`);
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Ruchi Raagam — New order', { body: `${order.customer?.name || 'Customer'} · ${money(order.total)} · ${order.items?.length || 0} items` });
  };
  window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  window.addEventListener('rr:order-added', event => notify(event.detail));
  render();
})();
