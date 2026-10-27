(() => {
  const section = document.createElement('section');
  section.className = 'tracking-section';
  section.id = 'track-order';
  section.innerHTML = '<div class="wrap"><div class="tracking-card"><div class="eyebrow">Order updates</div><h2 id="trackOrderTitle">Track your order</h2><p id="trackOrderIntro">Enter the order reference and the phone number used at checkout to see the latest status.</p><form class="tracking-form" id="trackOrderForm"><label><span class="field-label" id="trackOrderIdLabel">Order reference</span><input id="trackOrderId" name="orderId" required autocomplete="off" placeholder="Order reference from your confirmation"></label><label><span class="field-label" id="trackPhoneLabel">Phone number</span><input id="trackOrderPhone" name="phone" type="tel" autocomplete="tel" required placeholder="Phone number used for the order"></label><button class="button" id="trackOrderSubmit" type="submit">Find my order</button></form><p id="trackOrderMessage" class="tracking-message" role="status" aria-live="polite"></p><div id="trackOrderResult" class="tracking-result" hidden aria-live="polite"></div></div></div></section>';
  const visit = document.getElementById('visit');
  if (visit) visit.before(section);
  const social = document.querySelector('.social');
  if (social && !social.querySelector('a[href="#track-order"]')) {
    const link = document.createElement('a');
    link.href = '#track-order';
    link.textContent = 'Track order';
    social.insertBefore(link, document.getElementById('openDashboard'));
  }

  const form = document.getElementById('trackOrderForm');
  const idField = document.getElementById('trackOrderId');
  const phoneField = document.getElementById('trackOrderPhone');
  const message = document.getElementById('trackOrderMessage');
  const result = document.getElementById('trackOrderResult');
  const submit = document.getElementById('trackOrderSubmit');
  const confirmation = document.getElementById('orderConfirmation');
  const receipt = document.getElementById('orderReceipt');
  if (!form || !idField || !phoneField || !message || !result || !submit) return;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const localIdPattern = /^RR-[A-Z0-9-]{8,40}$/i;
  const digits = value => String(value || '').replace(/\D/g, '');
  const t = (en, te) => document.documentElement.lang === 'te' ? te : en;
  const labels = {
    new: ['Order received', 'ఆర్డర్ అందింది'],
    accepted: ['Accepted by restaurant', 'రెస్టారెంట్ ఆర్డర్ అంగీకరించింది'],
    preparing: ['Being prepared', 'తయారవుతోంది'],
    ready: ['Ready', 'సిద్ధంగా ఉంది'],
    out_for_delivery: ['Out for delivery', 'డెలివరీకి బయలుదేరింది'],
    picked_up: ['Picked up', 'పికప్ చేసుకున్నారు'],
    delivered: ['Delivered', 'డెలివరీ పూర్తయింది'],
    cancelled: ['Cancelled', 'రద్దు చేయబడింది'],
  };
  let activeLookup = null;
  let pollTimer = null;
  let lastOrder = null;

  const renderStatus = order => {
    lastOrder = order;
    const steps = order.fulfillment === 'pickup'
      ? ['new', 'accepted', 'preparing', 'ready', 'picked_up']
      : ['new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    if (order.status === 'cancelled') {
      result.innerHTML = `<div class="tracking-order-ref"><span>${t('Order reference', 'ఆర్డర్ రిఫరెన్స్')}</span><strong>${escapeHtml(order.id)}</strong></div><div class="tracking-current is-cancelled">${labels.cancelled[document.documentElement.lang === 'te' ? 1 : 0]}</div>`;
      result.hidden = false;
      return;
    }
    const currentIndex = steps.indexOf(order.status);
    const current = labels[order.status] || labels.new;
    const timeline = steps.map((step, index) => {
      const state = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '';
      const label = labels[step][document.documentElement.lang === 'te' ? 1 : 0];
      return `<li class="tracking-step ${state}"><span class="tracking-step-dot" aria-hidden="true">${index < currentIndex ? '✓' : index + 1}</span><span>${label}</span></li>`;
    }).join('');
    const updated = order.updatedAt ? new Date(order.updatedAt).toLocaleString(document.documentElement.lang === 'te' ? 'te-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    result.innerHTML = `<div class="tracking-order-ref"><span>${t('Order reference', 'ఆర్డర్ రిఫరెన్స్')}</span><strong>${escapeHtml(order.id)}</strong></div><div class="tracking-current">${current[document.documentElement.lang === 'te' ? 1 : 0]}</div><ol class="tracking-timeline">${timeline}</ol><small class="tracking-updated">${updated ? `${t('Last updated', 'చివరిగా అప్‌డేట్ అయిన సమయం')}: ${escapeHtml(updated)}` : ''}</small>`;
    result.hidden = false;
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  const lookup = async (id, phone) => {
    const client = await window.rrSupabaseReady;
    if (client && uuidPattern.test(id)) {
      const { data, error } = await client.rpc('track_customer_order', { p_order_id: id, p_phone: phone });
      if (error) throw error;
      const order = Array.isArray(data) ? data[0] : data;
      if (!order) return null;
      return { id: order.id, status: order.status, fulfillment: order.fulfillment, createdAt: order.created_at, updatedAt: order.updated_at };
    }
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('ruchi-raagam-orders-v1') || '[]'); } catch { /* ignore invalid local storage */ }
    const local = orders.find(order => order.id === id && digits(order.customer?.phone) === digits(phone));
    return local || null;
  };

  const track = async (id, phone, quiet = false) => {
    if (!id || !phone) return;
    if (!uuidPattern.test(id) && !localIdPattern.test(id)) {
      message.textContent = t('Enter the order reference shown after you place the order.', 'ఆర్డర్ చేసిన తర్వాత కనిపించే రిఫరెన్స్‌ను నమోదు చేయండి.');
      result.hidden = true;
      return;
    }
    if (!quiet) {
      message.textContent = t('Looking up your order…', 'మీ ఆర్డర్ వివరాలు చూస్తున్నాం…');
      result.hidden = true;
    }
    try {
      const order = await lookup(id, phone);
      if (!order) {
        if (!quiet) message.textContent = t('No order matched that reference and phone number.', 'ఆ రిఫరెన్స్, ఫోన్ నంబర్‌తో ఆర్డర్ కనబడలేదు. వివరాలు సరిచూసి మళ్లీ ప్రయత్నించండి.');
        return;
      }
      message.textContent = order.backend || uuidPattern.test(id)
        ? t('Status refreshes automatically while this page is open.', 'ఈ పేజీ తెరిచి ఉన్నప్పుడు స్థితి ఆటోమేటిక్‌గా అప్‌డేట్ అవుతుంది.')
        : t('Showing this browser’s saved status. Connect the shared backend to track on other devices.', 'ఈ బ్రౌజర్‌లో సేవ్ అయిన స్థితిని చూపిస్తున్నాం. ఇతర పరికరాల్లో ట్రాక్ చేయడానికి shared backend కనెక్ట్ చేయండి.');
      renderStatus(order);
    } catch (error) {
      if (!quiet) message.textContent = t(`Could not check the order: ${error.message || 'Try again.'}`, `ఆర్డర్‌ను చూడలేకపోయాం: ${error.message || 'మళ్లీ ప్రయత్నించండి.'}`);
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = idField.value.trim();
    const phone = phoneField.value.trim();
    activeLookup = { id, phone };
    submit.disabled = true;
    clearInterval(pollTimer);
    try { await track(id, phone); }
    finally {
      submit.disabled = false;
      pollTimer = setInterval(() => {
        if (activeLookup && !document.hidden && !['delivered', 'picked_up', 'cancelled'].includes(lastOrder?.status)) track(activeLookup.id, activeLookup.phone, true);
      }, 20000);
    }
  });

  const trackLink = document.createElement('a');
  trackLink.className = 'text-link tracking-confirmation-link';
  trackLink.href = '#track-order';
  trackLink.hidden = true;
  trackLink.textContent = 'Track this order ↗';
  receipt?.after(trackLink);

  const setOrderReference = async order => {
    const id = String(order?.id || '');
    if (!uuidPattern.test(id) && !localIdPattern.test(id)) return;
    idField.value = id;
    phoneField.value = order.customer?.phone || phoneField.value;
    trackLink.hidden = false;
    trackLink.textContent = t(`Track this order · ${id} ↗`, `ఈ ఆర్డర్‌ను ట్రాక్ చేయండి · ${id} ↗`);
    if (receipt) {
      const receiptLines = receipt.textContent.split('\n').filter(line => !/^(Tracking reference|ట్రాకింగ్ రిఫరెన్స్):/.test(line));
      receiptLines.push(`${t('Tracking reference', 'ట్రాకింగ్ రిఫరెన్స్')}: ${id}`);
      receipt.textContent = receiptLines.join('\n');
    }
    if (confirmation && !confirmation.hidden) confirmation.dataset.trackingOrderId = id;
    activeLookup = { id, phone: phoneField.value };
    await track(activeLookup.id, activeLookup.phone);
    clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (activeLookup && !document.hidden && !['delivered', 'picked_up', 'cancelled'].includes(lastOrder?.status)) track(activeLookup.id, activeLookup.phone, true);
    }, 20000);
  };

  window.addEventListener('rr:order-added', event => setOrderReference(event.detail));
  window.addEventListener('rr:order-cloud-saved', event => setOrderReference(event.detail));
  window.addEventListener('rr:local-orders-changed', () => {
    if (activeLookup && !uuidPattern.test(activeLookup.id)) track(activeLookup.id, activeLookup.phone, true);
  });
  const syncTrackingLanguage = () => {
    if (!lastOrder) return;
    renderStatus(lastOrder);
    if (!trackLink.hidden) trackLink.textContent = t(`Track this order · ${idField.value} ↗`, `ఈ ఆర్డర్‌ను ట్రాక్ చేయండి · ${idField.value} ↗`);
  };
  const languageObserver = new MutationObserver(() => {
    const telugu = document.documentElement.lang === 'te';
    idField.placeholder = telugu ? 'ఆర్డర్ రిఫరెన్స్ నమోదు చేయండి' : 'Order reference from your confirmation';
    phoneField.placeholder = telugu ? 'ఆర్డర్‌లో ఇచ్చిన ఫోన్ నంబర్' : 'Phone number used for the order';
    syncTrackingLanguage();
  });
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
