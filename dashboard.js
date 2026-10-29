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
  let filter = 'all';
  let period = 'today';
  let currentPage = 'orders';
  let toastTimer;
  const toast = message => { toastEl.textContent = message; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); };
  const now = new Date();
  document.getElementById('today').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  const buildAdminLayout = () => {
    const shell = document.querySelector('.shell');
    const main = document.createElement('div');
    main.className = 'admin-main';
    [...shell.children].forEach(child => main.append(child));
    const pageTitle = main.querySelector('.topbar .brand');
    if (pageTitle) { pageTitle.textContent = '☰  Order List'; pageTitle.classList.add('dashboard-page-title'); }
    const sidebar = document.createElement('aside');
    sidebar.className = 'admin-sidebar';
    sidebar.innerHTML = `<a class="admin-side-brand" href="index.html"><span class="admin-brand-mark">✦</span><span>Ruchi <b>Raagam</b><small>RESTAURANT ADMIN</small></span></a><nav class="admin-nav" aria-label="Dashboard navigation"><button type="button" data-page="dashboard"><span>⌂</span>Dashboard</button><button type="button" data-page="orders" class="active"><span>▤</span>Orders</button><button type="button" data-page="menus"><span>♨</span>Menus</button><button type="button" data-page="customers"><span>♙</span>Customers</button><button type="button" data-page="analytics"><span>▥</span>Analytics</button></nav><div class="sidebar-note quick-actions"><span>QUICK ACTIONS</span><strong>Jump right in</strong><small>Open a view directly.</small><button type="button" data-page="orders">▤ &nbsp; View orders <b>↗</b></button><button type="button" data-page="analytics">▥ &nbsp; Sales insights <b>↗</b></button></div><div class="sidebar-footer">Ruchi Raagam Admin<br>Hyderabad · SR Nagar</div>`;
    const module = document.createElement('section');
    module.id = 'adminModuleView';
    module.className = 'admin-module-view';
    module.hidden = true;
    main.querySelector('#orders').after(module);
    shell.replaceChildren(sidebar, main);
    const tabs = main.querySelector('.tabs');
    tabs.innerHTML = '<button class="tab active" data-filter="all" type="button">All status <span id="activeBadge">0</span></button><button class="tab" data-filter="out_for_delivery" type="button">On delivery</button><button class="tab" data-filter="delivered" type="button">Delivered</button><button class="tab" data-filter="cancelled" type="button">Cancelled</button>';
    return { shell, main, sidebar, module };
  };
  const adminLayout = buildAdminLayout();
  const moduleView = adminLayout.module;
  const setPage = page => {
    currentPage = page;
    adminLayout.sidebar.querySelectorAll('[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === page));
    const heading = adminLayout.main.querySelector('.heading h1');
    heading.textContent = ({dashboard:'Dashboard overview',orders:'Order list',menus:'Menu performance',customers:'Customers',analytics:'Analytics'})[page];
    const showOrders = page === 'orders';
    const toolbar = adminLayout.main.querySelector('.toolbar');
    toolbar.hidden = false;
    toolbar.classList.toggle('module-toolbar', !showOrders);
    toolbar.querySelector('.tabs').hidden = !showOrders;
    toolbar.querySelector('label').hidden = !showOrders;
    ordersEl.hidden = !showOrders;
    adminLayout.main.querySelector('.metrics').hidden = page === 'menus' || page === 'customers';
    moduleView.hidden = showOrders;
    render();
  };
  adminLayout.sidebar.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button) setPage(button.dataset.page);
  });

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
    document.getElementById('activeBadge').textContent = orders.length;
    const query = document.getElementById('search').value.trim().toLowerCase();
    const shown = orders.filter(order => {
      if (filter !== 'all' && order.status !== filter) return false;
      const searchable = `${order.customer?.name || ''} ${order.customer?.phone || ''} ${order.id || ''}`.toLowerCase();
      return searchable.includes(query);
    });
    if (!shown.length) {
      ordersEl.innerHTML = `<div class="empty"><strong>${query ? 'No matching orders' : filter === 'all' ? 'No orders yet' : `No ${labels[filter]?.toLowerCase() || ''} orders`}</strong>${query ? 'Try another name or phone number.' : 'New customer orders will appear here after they send their order.'}</div>`;
      if (!moduleView.hidden) renderModule(orders);
      return;
    }
    const rows = shown.map(order => {
      const status = labels[order.status] || 'New';
      const items = (order.items || []).map(item => `<div class="item"><span>${escapeHtml(item.quantity)} × ${escapeHtml(item.name)} <span class="item-portion">${escapeHtml(item.portion || '')}</span></span><strong>${money(Number(item.price || 0) * Number(item.quantity || 0))}</strong></div>`).join('');
      const address = order.fulfillment === 'pickup' ? 'Customer pickup' : [order.customer?.address, order.customer?.landmark && `Near ${order.customer.landmark}`, order.customer?.pincode && `PIN ${order.customer.pincode}`].filter(Boolean).join(' · ');
      const paymentProviders = { razorpay: 'Razorpay', paytm: 'Paytm UPI', gpay: 'Google Pay', icici: 'ICICI Netbanking', hdfc: 'HDFC Netbanking' };
      const basePaymentName = order.payment === 'razorpay' ? (paymentProviders[order.paymentProvider] || 'Razorpay') : ({ cod: 'Cash on delivery', upi: 'UPI', phonepe: 'PhonePe', internetbanking: 'Internet Banking' })[order.payment] || order.payment || 'Cash on delivery';
      const paymentName = order.payment === 'razorpay' ? `${basePaymentName} · ${order.paymentStatus === 'paid' ? 'Paid' : 'Payment pending'}` : basePaymentName;
      const next = nextStatus(order);
      const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return `<tr data-id="${escapeHtml(order.id)}"><td data-label="Order ID"><strong class="table-order-id">${escapeHtml(order.id)}</strong><small>${escapeHtml(order.sentVia || 'Website')}</small></td><td data-label="Date"><span>${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></td><td data-label="Customer"><strong class="table-customer-name">${escapeHtml(order.customer?.name || 'Customer')}</strong><a class="table-phone" href="tel:${escapeHtml(order.customer?.phone || '')}">${escapeHtml(order.customer?.phone || '')}</a><details class="order-details"><summary>${itemCount} item${itemCount === 1 ? '' : 's'} · Details</summary><div class="details-address">${escapeHtml(address || 'No address supplied')}</div><div class="details-items">${items || '<div class="item">Order items unavailable</div>'}</div><div class="details-payment">${escapeHtml(paymentName)}${order.customer?.note ? ` · Note: ${escapeHtml(order.customer.note)}` : ''}</div></details></td><td data-label="Location"><span class="table-location">${escapeHtml(address || 'No address supplied')}</span></td><td data-label="Amount"><strong class="table-amount">${money(order.total)}</strong></td><td data-label="Status"><span class="badge ${escapeHtml(order.status)}">${status}</span></td><td data-label="Action"><div class="table-actions"><label class="sr-only" for="status-${escapeHtml(order.id)}">Update status</label><select class="status" id="status-${escapeHtml(order.id)}" aria-label="Order status">${Object.entries(labels).map(([value, text]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${text}</option>`).join('')}</select>${next ? `<button class="btn btn-primary advance" type="button">${actionLabel(next)}</button>` : ''}<label class="sr-only" for="fulfillment-${escapeHtml(order.id)}">Fulfilment type</label><select class="fulfillment" id="fulfillment-${escapeHtml(order.id)}" aria-label="Fulfilment type"><option value="delivery" ${order.fulfillment !== 'pickup' ? 'selected' : ''}>Delivery</option><option value="pickup" ${order.fulfillment === 'pickup' ? 'selected' : ''}>Pickup</option></select></div></td></tr>`;
    }).join('');
    ordersEl.innerHTML = `<div class="orders-table-wrap"><table class="orders-table"><thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Location</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if (!moduleView.hidden) renderModule(orders);
  }

  function renderModule(orders) {
    if (!moduleView || !['dashboard','menus','customers','analytics'].includes(currentPage)) return;
    const revenue = orders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemTotals = new Map();
    const customers = new Map();
    orders.forEach(order => {
      const key = `${order.customer?.phone || ''}` || order.customer?.name || 'Customer';
      const entry = customers.get(key) || { name: order.customer?.name || 'Customer', phone: order.customer?.phone || '', count: 0, spend: 0 };
      entry.count += 1; entry.spend += Number(order.total || 0); customers.set(key, entry);
      (order.items || []).forEach(item => {
        const name = item.name || 'Menu item';
        const sold = itemTotals.get(name) || { name, quantity: 0, sales: 0 };
        sold.quantity += Number(item.quantity || 0); sold.sales += Number(item.quantity || 0) * Number(item.price || 0); itemTotals.set(name, sold);
      });
    });
    const topItems = [...itemTotals.values()].sort((a,b) => b.quantity-a.quantity).slice(0,6);
    if (currentPage === 'customers') {
      const rows = [...customers.values()].sort((a,b)=>b.spend-a.spend).map(customer=>`<tr><td><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.phone)}</small></td><td>${customer.count}</td><td>${money(customer.spend)}</td></tr>`).join('');
      moduleView.innerHTML = `<div class="module-heading"><span class="eyebrow">CUSTOMER BOOK</span><h2>People who order from us</h2><p>Customer details are summarized from orders in the selected date range.</p></div><div class="module-table-wrap"><table class="module-table"><thead><tr><th>Customer</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="module-empty">Customer details will appear after orders arrive.</td></tr>'}</tbody></table></div>`;
    } else if (currentPage === 'menus') {
      const rows = topItems.map(item=>`<tr><td><strong>${escapeHtml(item.name)}</strong></td><td>${item.quantity}</td><td>${money(item.sales)}</td></tr>`).join('');
      moduleView.innerHTML = `<div class="module-heading"><span class="eyebrow">MENU PERFORMANCE</span><h2>Popular dishes</h2><p>Items are ranked by quantity sold in the selected date range.</p></div><div class="module-table-wrap"><table class="module-table"><thead><tr><th>Menu item</th><th>Quantity sold</th><th>Item sales</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="module-empty">Popular items will appear after orders arrive.</td></tr>'}</tbody></table></div>`;
    } else {
      const isAnalytics = currentPage === 'analytics';
      const bars = topItems.slice(0,5).map((item,index)=>`<div class="top-item"><div><span>${escapeHtml(item.name)}</span><strong>${item.quantity} sold</strong></div><div class="bar-track"><i style="width:${Math.max(8, Math.round(item.quantity/(topItems[0]?.quantity || 1)*100))}%"></i></div></div>`).join('');
      moduleView.innerHTML = `<div class="module-heading"><span class="eyebrow">${isAnalytics?'PERFORMANCE':'TODAY AT A GLANCE'}</span><h2>${isAnalytics?'Sales analytics':'Service overview'}</h2><p>${isAnalytics?'A quick view of order value and the dishes customers choose most.':'Keep an eye on sales and customer favourites.'}</p></div><div class="overview-stats"><article><span>Orders in period</span><strong>${orders.length}</strong></article><article><span>Sales in period</span><strong>${money(revenue)}</strong></article><article><span>Average order</span><strong>${money(orders.length ? revenue/orders.length : 0)}</strong></article></div><div class="top-items-panel"><h3>Top ordered dishes</h3>${bars || '<p class="module-empty">Sales insights will appear after orders arrive.</p>'}</div>`;
    }
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
