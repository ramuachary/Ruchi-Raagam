(() => {
  const KEY = 'ruchi-raagam-orders-v1';
  const REVIEWS_KEY = 'ruchi-raagam-reviews-v1';
  const labels = { new: 'New', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', out_for_delivery: 'Out for delivery', picked_up: 'Picked up', delivered: 'Delivered', cancelled: 'Cancelled' };
  const paymentStatusLabels = { unpaid: 'Payment pending', paid: 'Payment accepted', failed: 'Cancelled / failed', refunded: 'Refunded' };
  const terminal = new Set(['delivered', 'picked_up', 'cancelled']);
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
  let notificationAudio;
  const unlockNotificationAudio = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      notificationAudio ||= new AudioContextClass();
      if (notificationAudio.state === 'suspended') notificationAudio.resume().catch(() => {});
    } catch { /* Browser audio is optional. */ }
  };
  document.addEventListener('pointerdown', unlockNotificationAudio, { once: true, passive: true });
  document.addEventListener('keydown', unlockNotificationAudio, { once: true });
  const playNewOrderSound = () => {
    unlockNotificationAudio();
    if (!notificationAudio) return;
    const play = () => {
      const now = notificationAudio.currentTime;
      [659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const start = now + index * 0.13;
        const oscillator = notificationAudio.createOscillator();
        const volume = notificationAudio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.exponentialRampToValueAtTime(0.09, start + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
        oscillator.connect(volume);
        volume.connect(notificationAudio.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.5);
      });
    };
    if (notificationAudio.state === 'running') play();
    else notificationAudio.resume().then(play).catch(() => {});
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const loadReviews = () => { try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]'); } catch { return []; } };
  const save = orders => { try { localStorage.setItem(KEY, JSON.stringify(orders)); window.dispatchEvent(new CustomEvent('rr:local-orders-changed', { detail: orders })); } catch { toast('Could not save orders in this browser.'); } };
  const acceptExpiredOrders = () => {
    const orders = load();
    const nowMs = Date.now();
    let changed = false;
    const updated = orders.map(order => {
      if (order.status !== 'new' || !order.createdAt || nowMs - new Date(order.createdAt).getTime() < 30_000) return order;
      changed = true;
      return { ...order, status: 'accepted', acceptedBy: order.acceptedBy || 'Auto-accepted', updatedAt: new Date(nowMs).toISOString() };
    });
    if (changed) save(updated);
    return changed;
  };
  const ordersEl = document.getElementById('orders');
  const toastEl = document.getElementById('toast');
  const dashboardView = document.getElementById('dashboardView');
  let filter = 'all';
  let period = 'today';
  let currentPage = 'dashboard';
  let toastTimer;
  const toast = message => { toastEl.classList.remove('order-received-toast'); toastEl.textContent = message; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); };
  const orderReceivedToast = order => { toastEl.classList.add('order-received-toast'); toastEl.innerHTML = `<span class="order-toast-wheel" aria-hidden="true">✓</span><span class="order-toast-copy"><strong>Order received</strong><small>${escapeHtml(order.customer?.name || 'Customer')} · ${money(order.total)}</small></span>`; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000); };
  const now = new Date();
  document.getElementById('today').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  const buildAdminLayout = () => {
    const shell = document.querySelector('.shell');
    const main = document.createElement('div');
    main.className = 'admin-main';
    [...shell.children].forEach(child => main.append(child));
    const pageTitle = main.querySelector('.topbar .brand');
    if (pageTitle) { pageTitle.innerHTML = '<span class="admin-top-brand">Ruchi <b>Raagam</b></span><span class="admin-top-divider"></span><span class="admin-top-title">▥ &nbsp; Admin Dashboard</span>'; pageTitle.classList.add('dashboard-page-title'); }
    const sidebar = document.createElement('aside');
    sidebar.className = 'admin-sidebar';
    sidebar.innerHTML = `<a class="admin-side-brand" href="index.html"><span class="admin-brand-mark">♨</span><span>Ruchi <b>Raagam</b><small>ANDHRA CUISINE RESTAURANT</small></span></a><nav class="admin-nav" aria-label="Dashboard navigation"><button type="button" data-page="dashboard" class="active"><span>⌂</span>Dashboard</button><button type="button" data-page="orders"><span>🛒</span>Orders</button><button type="button" data-page="menus"><span>♨</span>Menu</button><button type="button" data-page="customers"><span>♟</span>Customers</button><button type="button" data-page="reviews"><span>★</span>Reviews</button><button type="button" data-page="analytics"><span>▥</span>Analytics</button></nav><div class="sidebar-note quick-actions"><span>QUICK ACTIONS</span><strong>Jump right in</strong><small>Open a view directly.</small><button type="button" data-page="orders">▤ &nbsp; View orders <b>↗</b></button><button type="button" data-page="menus">♨ &nbsp; Menu insights <b>↗</b></button><button type="button" data-page="customers">♟ &nbsp; Customers <b>↗</b></button><button type="button" data-page="reviews">★ &nbsp; Reviews <b>↗</b></button></div><div class="sidebar-footer"><span class="side-temple">✦</span><br>GOOD FOOD · GOOD MOOD</div>`;
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
    adminLayout.main.classList.toggle('is-dashboard-home', page === 'dashboard');
    adminLayout.sidebar.querySelectorAll('[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === page));
    const heading = adminLayout.main.querySelector('.heading h1');
    heading.textContent = ({dashboard:'Dashboard overview',orders:'Order list',menus:'Menu performance',customers:'Customers',reviews:'Customer reviews',analytics:'Analytics'})[page];
    const showOrders = page === 'orders';
    const toolbar = adminLayout.main.querySelector('.toolbar');
    toolbar.hidden = page === 'reviews' || page === 'dashboard';
    toolbar.classList.toggle('module-toolbar', !showOrders);
    toolbar.querySelector('.tabs').hidden = !showOrders;
    toolbar.querySelector('label').hidden = !showOrders;
    ordersEl.hidden = !showOrders;
    adminLayout.main.querySelector('.metrics').hidden = page === 'menus' || page === 'customers' || page === 'reviews';
    moduleView.hidden = showOrders;
    render();
  };
  adminLayout.sidebar.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button) setPage(button.dataset.page);
  });
  moduleView.addEventListener('click', event => {
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
    document.getElementById('newCount').textContent = orders.length;
    document.getElementById('activeCount').textContent = money(orders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0));
    document.getElementById('pickupCount').textContent = active.length;
    document.getElementById('deliveredCount').textContent = new Set(orders.map(order => order.customer?.phone || order.customer?.name || 'Customer')).size;
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
      const paymentStatus = order.paymentStatus || 'unpaid';
      const paymentMethodClass = ({ cod: 'method-cod', upi: 'method-upi', phonepe: 'method-phonepe', internetbanking: 'method-bank', razorpay: 'method-razorpay' })[order.payment] || 'method-other';
      const paymentName = `${basePaymentName} · ${paymentStatusLabels[paymentStatus] || paymentStatusLabels.unpaid}${order.paymentId ? ` · ID: ${order.paymentId}` : ''}`;
      const next = nextStatus(order);
      const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return `<tr data-id="${escapeHtml(order.id)}"><td data-label="Order ID"><strong class="table-order-id">${escapeHtml(order.id)}</strong><small>${escapeHtml(order.sentVia || 'Website')}</small></td><td data-label="Date"><span>${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></td><td data-label="Customer"><strong class="table-customer-name">${escapeHtml(order.customer?.name || 'Customer')}</strong><a class="table-phone" href="tel:${escapeHtml(order.customer?.phone || '')}">${escapeHtml(order.customer?.phone || '')}</a><span class="table-payment-method ${paymentMethodClass}">Payment: ${escapeHtml(basePaymentName)}</span><details class="order-details"><summary>${itemCount} item${itemCount === 1 ? '' : 's'} · Details</summary><div class="details-address"><strong>Delivery area / address</strong><br>${escapeHtml(address || 'No address supplied')}</div><div class="details-items">${items || '<div class="item">Order items unavailable</div>'}</div><div class="details-payment">${escapeHtml(paymentName)}${order.customer?.note ? ` · Note: ${escapeHtml(order.customer.note)}` : ''}</div><div class=\"order-pricing\"><div><span>Items subtotal</span><strong>${money(Number(order.subtotal || 0))}</strong></div><div><span>Delivery</span><strong>${money(Number(order.deliveryCharge || 0))}</strong></div><div><span>Packaging</span><strong>${money(Number(order.packagingCharge || 0))}</strong></div><div><span>Platform</span><strong>${money(Number(order.platformFee || 0))}</strong></div><div><span>Restaurant GST</span><strong>${money(Number(order.gstCharge || 0))}</strong></div><div><span>Delivery tip</span><strong>${money(Number(order.tip || 0))}</strong></div><div><span>Coupon discount</span><strong>−${money(Number(order.discount || 0))}</strong></div></div><label class=\"assignment-field\"><span>Accepted by</span><input class="assignment-input" data-assignment="acceptedBy" maxlength="120" value="${escapeHtml(order.acceptedBy || '')}" placeholder="Staff name"></label>${order.fulfillment !== 'pickup' ? `<label class="assignment-field"><span>Delivery person</span><input class="assignment-input" data-assignment="deliveryPerson" maxlength="120" value="${escapeHtml(order.deliveryPerson || '')}" placeholder="Assign delivery person"></label>` : ''}</details></td><td data-label="Location"><span class="table-location">${escapeHtml(address || 'No address supplied')}</span></td><td data-label="Amount"><strong class="table-amount">${money(order.total)}</strong></td><td data-label="Status"><span class="badge ${escapeHtml(order.status)}">${status}</span></td><td data-label="Action"><div class="table-actions"><label class="sr-only" for="status-${escapeHtml(order.id)}">Update status</label><select class="status status-${escapeHtml(order.status)}" id="status-${escapeHtml(order.id)}" aria-label="Order status">${Object.entries(labels).map(([value, text]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${text}</option>`).join('')}</select>${next ? `<button class="btn btn-primary advance" type="button">${actionLabel(next)}</button>` : ''}<label class="sr-only" for="fulfillment-${escapeHtml(order.id)}">Fulfilment type</label><select class="fulfillment fulfillment-${order.fulfillment === 'pickup' ? 'pickup' : 'delivery'}" id="fulfillment-${escapeHtml(order.id)}" aria-label="Fulfilment type"><option value="delivery" ${order.fulfillment !== 'pickup' ? 'selected' : ''}>Delivery</option><option value="pickup" ${order.fulfillment === 'pickup' ? 'selected' : ''}>Pickup</option></select><label class="sr-only" for="payment-${escapeHtml(order.id)}">Payment status</label><select class="payment-status payment-${escapeHtml(paymentStatus)}" id="payment-${escapeHtml(order.id)}" aria-label="Payment status">${Object.entries(paymentStatusLabels).map(([value, text]) => `<option value="${value}" ${paymentStatus === value ? 'selected' : ''}>${text}</option>`).join('')}</select></div></td></tr>`;
    }).join('');
    ordersEl.innerHTML = `<div class="orders-table-wrap"><table class="orders-table"><thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Location</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if (!moduleView.hidden) renderModule(orders);
  }

  function renderModule(orders) {
    if (!moduleView || !['dashboard','menus','customers','reviews','analytics'].includes(currentPage)) return;
    const revenue = orders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemTotals = new Map();
    const customers = new Map();
    orders.forEach(order => {
      const key = `${order.customer?.phone || ''}` || order.customer?.name || 'Customer';
      const entry = customers.get(key) || { name: order.customer?.name || 'Customer', phone: order.customer?.phone || '', count: 0, spend: 0 };
      entry.count += 1; entry.spend += Number(order.total || 0); customers.set(key, entry);
      (order.status === 'cancelled' ? [] : (order.items || [])).forEach(item => {
        const name = item.name || 'Menu item';
        const sold = itemTotals.get(name) || { name, quantity: 0, sales: 0 };
        sold.quantity += Number(item.quantity || 0); sold.sales += Number(item.quantity || 0) * Number(item.price || 0); itemTotals.set(name, sold);
      });
    });
    const allMenuItems = [...itemTotals.values()].sort((a,b) => b.quantity-a.quantity);
    const topItems = allMenuItems.slice(0,6);
    if (currentPage === 'reviews') {
      const reviews = loadReviews().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      const average = reviews.length ? (reviews.reduce((sum,review)=>sum+Number(review.rating||0),0)/reviews.length).toFixed(1) : '—';
      const cards = reviews.map(review=>`<article class="dashboard-review-card"><div class="dashboard-review-top"><strong>${escapeHtml(review.name||'Guest')}</strong><time>${new Date(review.createdAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</time></div><div class="dashboard-review-stars" aria-label="${Number(review.rating)||0} out of 5 stars">${'★'.repeat(Math.max(0,Math.min(5,Number(review.rating)||0)))}<span>${'★'.repeat(5-Math.max(0,Math.min(5,Number(review.rating)||0)))}</span></div><p>${escapeHtml(review.message)}</p></article>`).join('');
      moduleView.innerHTML = `<div class="module-heading"><span class="eyebrow">GUEST FEEDBACK</span><h2>Customer reviews</h2><p>Reviews submitted on the website appear here as they arrive.</p></div><div class="review-overview"><article><span>Total reviews</span><strong>${reviews.length}</strong></article><article><span>Average rating</span><strong>${average}${reviews.length?' / 5':''}</strong></article></div><div class="dashboard-review-list">${cards||'<div class="empty"><strong>No reviews yet</strong>Customer feedback will show here after a review is submitted.</div>'}</div>`;
    } else if (currentPage === 'customers') {
      const rows = [...customers.values()].sort((a,b)=>b.spend-a.spend).map(customer=>`<tr><td><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.phone)}</small></td><td>${customer.count}</td><td>${money(customer.spend)}</td></tr>`).join('');
      moduleView.innerHTML = `<div class="module-heading"><span class="eyebrow">CUSTOMER BOOK</span><h2>People who order from us</h2><p>Customer details are summarized from orders in the selected date range.</p></div><div class="module-table-wrap"><table class="module-table"><thead><tr><th>Customer</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="module-empty">Customer details will appear after orders arrive.</td></tr>'}</tbody></table></div>`;
    } else if (currentPage === 'menus') {
      const rows = allMenuItems.map(item=>`<tr><td><strong>${escapeHtml(item.name)}</strong></td><td>${item.quantity}</td><td>${money(item.sales)}</td></tr>`).join('');
      const totalQuantity = allMenuItems.reduce((sum,item)=>sum+item.quantity,0);
      const totalSales = allMenuItems.reduce((sum,item)=>sum+item.sales,0);
      const totalsRow = allMenuItems.length ? `<tfoot><tr><td style="font-weight:700;background:#f1f7f2;border-top:2px solid #dce8dd;color:#174b2a">Total</td><td style="font-weight:700;background:#f1f7f2;border-top:2px solid #dce8dd;color:#174b2a">${totalQuantity}</td><td style="font-weight:700;background:#f1f7f2;border-top:2px solid #dce8dd;color:#174b2a">${money(totalSales)}</td></tr></tfoot>` : '';
      moduleView.innerHTML = `<div class="module-heading"><span class="eyebrow">MENU PERFORMANCE</span><h2>Popular dishes</h2><p>Items are ranked by quantity sold in the selected date range.</p></div><div class="module-table-wrap"><table class="module-table"><thead><tr><th>Menu item</th><th>Quantity sold</th><th>Item sales</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="module-empty">Popular items will appear after orders arrive.</td></tr>'}</tbody>${totalsRow}</table></div>`;
    } else if (currentPage === 'dashboard') {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      const weekOrders = load().filter(order => order.status !== 'cancelled' && new Date(order.createdAt) >= weekStart);
      const dailySales = Array.from({length:7}, (_, index) => {
        const date = new Date(weekStart); date.setDate(weekStart.getDate() + index);
        const key = date.toDateString();
        return { date, sales: weekOrders.filter(order => new Date(order.createdAt).toDateString() === key).reduce((sum, order) => sum + Number(order.total || 0), 0) };
      });
      const maxSales = Math.max(...dailySales.map(day => day.sales), 1);
      const chartPoints = dailySales.map((day, index) => ({...day, x: 34 + index * 84, y: 166 - Math.round(day.sales / maxSales * 122)}));
      const linePath = chartPoints.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
      const areaPath = `${linePath} L${chartPoints.at(-1).x},178 L${chartPoints[0].x},178 Z`;
      const chart = `<svg class="sales-chart" viewBox="0 0 570 210" role="img" aria-label="గత ఏడు రోజుల అమ్మకాల చార్ట్"><defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#278446" stop-opacity=".24"/><stop offset="1" stop-color="#278446" stop-opacity="0"/></linearGradient></defs>${[35,75,115,155].map((y,i)=>`<line x1="34" y1="${y}" x2="538" y2="${y}" class="chart-grid"/><text x="0" y="${y+4}" class="chart-axis">₹${new Intl.NumberFormat('en-IN',{notation:'compact',maximumFractionDigits:0}).format(Math.round(maxSales*(1-i/3)))}</text>`).join('')}<path d="${areaPath}" fill="url(#salesFill)"/><path d="${linePath}" class="chart-line"/>${chartPoints.map(point=>`<circle cx="${point.x}" cy="${point.y}" r="4.5" class="chart-dot"><title>${point.date.toLocaleDateString('en-IN',{weekday:'short'})}: ${money(point.sales)}</title></circle><text x="${point.x}" y="199" text-anchor="middle" class="chart-label">${point.date.toLocaleDateString('en-IN',{weekday:'short'})}</text>`).join('')}</svg>`;
      const recent = load().slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
      const recentRows = recent.map(order => {
        const quantity = (order.items || []).reduce((sum,item)=>sum+Number(item.quantity||0),0);
        return `<tr><td><strong>#${escapeHtml(String(order.id||'').slice(-5).toUpperCase())}</strong></td><td>${escapeHtml(order.customer?.name||'Customer')}</td><td>${quantity} ${quantity===1?'item':'items'}</td><td>${money(order.total)}</td><td><span class="overview-status status-${escapeHtml(order.status||'new')}">${escapeHtml(labels[order.status]||'New')}</span></td><td>${new Date(order.createdAt).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}</td></tr>`;
      }).join('');
      const totalItems = topItems.reduce((sum,item)=>sum+item.quantity,0) || 1;
      const dishCards = topItems.slice(0,4).map((item,index)=>`<article class="dish-mini dish-tone-${index+1}"><span class="dish-mini-mark">${['✦','♨','✿','◆'][index]}</span><strong>${escapeHtml(item.name)}</strong><b>${money(item.sales)}</b><small>${Math.round(item.quantity/totalItems*100)}% · ${item.quantity} sold</small></article>`).join('');
      const delivered = orders.filter(order=>['delivered','picked_up'].includes(order.status)).length;
      const pending = orders.filter(order=>!terminal.has(order.status)).length;
      const cancelled = orders.filter(order=>order.status==='cancelled').length;
      const totalCount = Math.max(orders.length,1);
      const p1 = Math.round(pending/totalCount*100), p2 = Math.round(delivered/totalCount*100), p3 = Math.max(0,100-p1-p2);
      moduleView.innerHTML = `<div class="overview-grid"><section class="overview-panel sales-panel"><div class="panel-title"><h3>▥ &nbsp; Sales overview</h3><span class="panel-range">Last 7 days</span></div>${chart}</section><section class="overview-panel recent-panel"><div class="panel-title"><h3>🛒 &nbsp; Recent orders</h3><button class="text-action" data-page="orders">View all →</button></div><div class="recent-table-wrap"><table class="recent-table"><thead><tr><th>#Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead><tbody>${recentRows||'<tr><td colspan="6" class="recent-empty">New orders appear here when customers place them.</td></tr>'}</tbody></table></div></section><section class="overview-panel quick-panel"><div class="quick-panel-title"><h3>⚡ &nbsp; Quick actions</h3></div><div class="quick-action-grid"><button data-page="menus"><span>♨</span>Menu performance</button><button data-page="orders"><span>🛒</span>View orders</button><button data-page="customers"><span>♟</span>Customer list</button><button data-page="analytics"><span>▥</span>Sales insights</button></div></section><section class="overview-panel dishes-panel"><div class="panel-title"><h3>★ &nbsp; Top selling dishes</h3><button class="text-action" data-page="menus">View all →</button></div><div class="dish-mini-grid">${dishCards||'<p class="recent-empty">Best sellers will appear after orders arrive.</p>'}</div></section><section class="overview-panel restaurant-stats-panel"><div class="panel-title"><h3>♟ &nbsp; Restaurant stats</h3></div><div class="stats-donut-row"><div class="stats-donut" style="${orders.length?`--pending:${p1}%;--delivered:${p2}%;--cancelled:${p3}%`:'background:conic-gradient(#e5ebe5 0 100%)'}"><strong>${orders.length}</strong><small>orders</small></div><ul><li><i class="legend-pending"></i>In progress <b>${orders.length?p1:0}%</b></li><li><i class="legend-delivered"></i>Delivered <b>${orders.length?p2:0}%</b></li><li><i class="legend-cancelled"></i>Cancelled <b>${orders.length?p3:0}%</b></li></ul></div></section></div>`;
    } else {
      const validOrders = orders.filter(order=>order.status!=='cancelled');
      const validRevenue = validOrders.reduce((sum,order)=>sum+Number(order.total||0),0);
      const averageOrder = validOrders.length ? validRevenue/validOrders.length : 0;
      const itemSales = new Map();
      validOrders.forEach(order=>(order.items||[]).forEach(item=>{
        const name=item.name||'Menu item', entry=itemSales.get(name)||{name,quantity:0,sales:0};
        entry.quantity+=Number(item.quantity||0); entry.sales+=Number(item.quantity||0)*Number(item.price||0); itemSales.set(name,entry);
      }));
      const analyticsItems=[...itemSales.values()].sort((a,b)=>b.sales-a.sales).slice(0,6);
      const totalItemSales=[...itemSales.values()].reduce((sum,item)=>sum+item.sales,0)||1;
      let buckets=[];
      if(period==='today'){
        const firstHour=Math.max(0,now.getHours()-5);
        buckets=Array.from({length:now.getHours()-firstHour+1},(_,i)=>{const hour=firstHour+i;return {label:new Date(2000,0,1,hour).toLocaleTimeString('en-IN',{hour:'numeric'}),sales:validOrders.filter(order=>{const date=new Date(order.createdAt);return date.toDateString()===now.toDateString()&&date.getHours()===hour}).reduce((s,order)=>s+Number(order.total||0),0)}});
      }else if(period==='week'){
        const first=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7));
        buckets=Array.from({length:7},(_,i)=>{const date=new Date(first);date.setDate(first.getDate()+i);return {label:date.toLocaleDateString('en-IN',{weekday:'short'}),sales:validOrders.filter(order=>new Date(order.createdAt).toDateString()===date.toDateString()).reduce((s,order)=>s+Number(order.total||0),0)}});
      }else if(period==='month'){
        const weekCount=Math.ceil(now.getDate()/7);
        buckets=Array.from({length:weekCount},(_,i)=>({label:`Week ${i+1}`,sales:validOrders.filter(order=>Math.floor((new Date(order.createdAt).getDate()-1)/7)===i).reduce((s,order)=>s+Number(order.total||0),0)}));
      }else{
        buckets=Array.from({length:6},(_,i)=>{const date=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {year:date.getFullYear(),month:date.getMonth(),label:date.toLocaleDateString('en-IN',{month:'short'}),sales:validOrders.filter(order=>{const d=new Date(order.createdAt);return d.getFullYear()===date.getFullYear()&&d.getMonth()===date.getMonth()}).reduce((s,order)=>s+Number(order.total||0),0)}});
      }
      if(!buckets.length)buckets=[{label:'Now',sales:0}];
      const trendMax=Math.max(...buckets.map(b=>b.sales),1), chartWidth=690, chartXs=buckets.map((_,i)=>buckets.length===1?345:48+i*594/(buckets.length-1));
      const trendPoints=buckets.map((bucket,i)=>({x:chartXs[i],y:170-Math.round(bucket.sales/trendMax*122),...bucket}));
      const trendLine=trendPoints.map((point,i)=>`${i?'L':'M'}${point.x},${point.y}`).join(' ');
      const trendArea=`${trendLine} L${trendPoints.at(-1).x},178 L${trendPoints[0].x},178 Z`;
      const trendSvg=`<svg class="analytics-trend-chart" viewBox="0 0 720 220" role="img" aria-label="Selected period sales trend">${[40,82,124,166].map((y,i)=>`<line x1="46" y1="${y}" x2="680" y2="${y}" class="chart-grid"/><text x="0" y="${y+4}" class="chart-axis">₹${new Intl.NumberFormat('en-IN',{notation:'compact',maximumFractionDigits:0}).format(Math.round(trendMax*(1-i/3)))}</text>`).join('')}<path d="${trendArea}" class="analytics-trend-area"/><path d="${trendLine}" class="analytics-trend-line"/>${trendPoints.map(point=>`<circle cx="${point.x}" cy="${point.y}" r="4.5" class="chart-dot"><title>${escapeHtml(point.label)} · ${money(point.sales)}</title></circle><text x="${point.x}" y="205" text-anchor="middle" class="chart-label">${escapeHtml(point.label)}</text>`).join('')}</svg>`;
      const statusCounts={active:orders.filter(order=>!terminal.has(order.status)).length,done:orders.filter(order=>['delivered','picked_up'].includes(order.status)).length,cancelled:orders.filter(order=>order.status==='cancelled').length};
      const denominator=Math.max(orders.length,1), activePct=Math.round(statusCounts.active/denominator*100), donePct=Math.round(statusCounts.done/denominator*100), cancelledPct=Math.max(0,100-activePct-donePct);
      const customersInPeriod=new Map();
      validOrders.forEach(order=>{const key=order.customer?.phone||order.customer?.name||'Customer';customersInPeriod.set(key,(customersInPeriod.get(key)||0)+1)});
      const repeatCustomers=[...customersInPeriod.values()].filter(count=>count>1).length;
      const itemQuantity=[...itemSales.values()].reduce((sum,item)=>sum+item.quantity,0);
      const itemRows=analyticsItems.map((item,index)=>`<tr><td><span class="analytics-rank">${index+1}</span><strong>${escapeHtml(item.name)}</strong></td><td>${item.quantity}</td><td>${money(item.sales)}</td><td><div class="analytics-share"><i style="width:${Math.max(5,Math.round(item.sales/totalItemSales*100))}%"></i></div><small>${Math.round(item.sales/totalItemSales*100)}%</small></td></tr>`).join('');
      const deliveryCount=validOrders.filter(order=>order.fulfillment!=='pickup').length, pickupCount=validOrders.filter(order=>order.fulfillment==='pickup').length;
      moduleView.innerHTML=`<div class="analytics-page"><div class="analytics-intro"><div><span class="eyebrow">PERFORMANCE</span><h2>Sales analytics</h2><p>Track order value, outcomes and the dishes customers choose.</p></div><span class="analytics-range-label">${({today:'Today',week:'This week',month:'This month',all:'All time'})[period]}</span></div><div class="analytics-kpis"><article><span>Average order value</span><strong>${money(averageOrder)}</strong><small>Across ${validOrders.length} non-cancelled orders</small></article><article><span>Cancelled orders</span><strong>${statusCounts.cancelled}</strong><small>${orders.length?Math.round(statusCounts.cancelled/orders.length*100):0}% of orders in this period</small></article><article><span>Returning customers</span><strong>${repeatCustomers}</strong><small>Ordered more than once in this period</small></article><article><span>Items sold</span><strong>${itemQuantity}</strong><small>Total item quantity in this period</small></article></div><div class="analytics-grid"><section class="analytics-panel trend-panel"><div class="analytics-panel-heading"><div><h3>Sales trend</h3><p>${period==='all'?'Order value · recent 6 months':'Order value · excluding cancelled orders'}</p></div><strong>${money(validRevenue)}</strong></div>${trendSvg}</section><section class="analytics-panel status-panel"><div class="analytics-panel-heading"><div><h3>Order status</h3><p>${orders.length} total orders in this period</p></div></div><div class="analytics-status-body"><div class="analytics-donut" style="${orders.length?`--active:${activePct}%;--done:${donePct}%;--cancelled:${cancelledPct}%`:'background:conic-gradient(#e8ece8 0 100%)'}"><strong>${orders.length}</strong><small>orders</small></div><ul><li><i class="analytics-active-key"></i>In progress <b>${orders.length?activePct:0}%</b><span>${statusCounts.active}</span></li><li><i class="analytics-done-key"></i>Completed <b>${orders.length?donePct:0}%</b><span>${statusCounts.done}</span></li><li><i class="analytics-cancel-key"></i>Cancelled <b>${orders.length?cancelledPct:0}%</b><span>${statusCounts.cancelled}</span></li></ul></div><div class="fulfilment-summary"><span>Delivery <b>${deliveryCount}</b></span><span>Pickup <b>${pickupCount}</b></span></div></section><section class="analytics-panel item-performance-panel"><div class="analytics-panel-heading"><div><h3>Best-selling dishes</h3><p>Sorted by item sales for the selected period</p></div><button class="text-action" data-page="menus">View menu report →</button></div><div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th>Dish</th><th>Qty sold</th><th>Sales</th><th>Share</th></tr></thead><tbody>${itemRows||'<tr><td colspan="4" class="analytics-empty">Menu sales will show here after orders arrive.</td></tr>'}</tbody></table></div></section></div></div>`;
    }
  }

  function updateOrder(id, changes) {
    const orders = load().map(order => {
      if (order.id !== id) return order;
      const acceptedBy = changes.status === 'accepted' && !order.acceptedBy ? 'Restaurant admin' : order.acceptedBy;
      return { ...order, ...changes, acceptedBy: changes.acceptedBy ?? acceptedBy ?? '', updatedAt: new Date().toISOString() };
    });
    save(orders); render();
  }
  function askAcceptor(order) {
    const previous = order.acceptedBy && order.acceptedBy !== 'Restaurant admin' ? order.acceptedBy : '';
    const name = window.prompt('Who is accepting this order? Enter their name:', previous);
    if (name === null) return null;
    const cleaned = name.trim();
    if (!cleaned) {
      window.alert('Please enter the staff member name to accept this order.');
      return null;
    }
    return cleaned.slice(0, 120);
  }
  ordersEl.addEventListener('click', event => {
    const button = event.target.closest('.advance');
    if (!button) return;
    const card = button.closest('[data-id]');
    const order = load().find(item => item.id === card.dataset.id);
    if (!order) return;
    const status = nextStatus(order);
    const acceptedBy = status === 'accepted' ? askAcceptor(order) : undefined;
    if (status === 'accepted' && !acceptedBy) return;
    updateOrder(order.id, { status, ...(acceptedBy ? { acceptedBy } : {}) });
    toast(`Order ${order.id}: ${labels[status]}`);
  });
  ordersEl.addEventListener('change', event => {
    const card = event.target.closest('[data-id]');
    if (!card) return;
    if (event.target.matches('.fulfillment')) updateOrder(card.dataset.id, { fulfillment: event.target.value });
    if (event.target.matches('.status')) {
      const order = load().find(item => item.id === card.dataset.id);
      const acceptedBy = event.target.value === 'accepted' && order ? askAcceptor(order) : undefined;
      if (event.target.value === 'accepted' && !acceptedBy) { render(); return; }
      updateOrder(card.dataset.id, { status: event.target.value, ...(acceptedBy ? { acceptedBy } : {}) });
      toast(`Order status: ${labels[event.target.value]}`);
    }
    if (event.target.matches('.payment-status')) {
      updateOrder(card.dataset.id, { paymentStatus: event.target.value });
      toast(`Payment status: ${paymentStatusLabels[event.target.value] || 'Updated'}`);
    }
    if (event.target.matches('.assignment-input')) {
      updateOrder(card.dataset.id, { [event.target.dataset.assignment]: event.target.value.trim() });
      toast('Order assignment saved.');
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
    playNewOrderSound();
    render(); orderReceivedToast(order);
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Ruchi Raagam — New order', { body: `${order.customer?.name || 'Customer'} · ${money(order.total)} · ${order.items?.length || 0} items` });
  };
  window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  window.addEventListener('rr:local-orders-changed', () => render());
  window.addEventListener('rr:order-added', event => notify(event.detail));
  window.addEventListener('storage', event => { if (event.key === REVIEWS_KEY) render(); });
  window.addEventListener('rr:review-added', event => { render(); toast(`New review from ${event.detail?.name || 'guest'}`); });
  setInterval(acceptExpiredOrders, 1000);
  acceptExpiredOrders();
  setPage('dashboard');
})();
