(() => {
  const section = document.createElement('section');
  section.className = 'tracking-section support-section';
  section.id = 'track-order';
  section.innerHTML = '<div class="wrap"><div class="tracking-card support-card"><div class="eyebrow" data-en="Customer help" data-te="కస్టమర్ సహాయం">Customer help</div><h2 id="helpTitle" data-en="How can we help?" data-te="మేమెలా సహాయపడగలం?">How can we help?</h2><p id="helpIntro" data-en="Find quick answers about ordering, delivery, payments and tracking." data-te="ఆర్డర్, డెలివరీ, చెల్లింపులు, ట్రాకింగ్ గురించి సమాధానాలు ఇక్కడ చూడండి.">Find quick answers about ordering, delivery, payments and tracking.</p><div class="support-faqs"><details><summary data-en="How do I place an order?" data-te="ఆర్డర్ ఎలా చేయాలి?">How do I place an order?</summary><p data-en="Choose dishes and quantities, open View order, fill in delivery details, then confirm." data-te="వంటకాలు, పరిమాణాలు ఎంచుకుని View order నొక్కండి. డెలివరీ వివరాలు నింపి Confirm order చేయండి.">Choose dishes and quantities, open View order, fill in delivery details, then confirm.</p></details><details><summary data-en="What are the delivery charges?" data-te="డెలివరీ ఛార్జీలు ఎంత?">What are the delivery charges?</summary><p data-en="Delivery is free within 7 km. Beyond that, it is ₹5 for each started extra kilometre." data-te="7 కి.మీ. వరకు డెలివరీ ఉచితం. ఆపై ప్రారంభమైన ప్రతి అదనపు కి.మీ.కు ₹5 ఛార్జీ.">Delivery is free within 7 km. Beyond that, it is ₹5 for each started extra kilometre.</p></details><details><summary data-en="Need help with payment or cancellation?" data-te="చెల్లింపు లేదా రద్దుకు సహాయం కావాలా?">Need help with payment or cancellation?</summary><p data-en="Call us and share your order reference. Cancellation is available only while the cancel option is shown." data-te="మాకు కాల్ చేసి ఆర్డర్ రిఫరెన్స్ చెప్పండి. Cancel order ఎంపిక కనిపిస్తున్నప్పుడే రద్దు చేయవచ్చు.">Call us and share your order reference. Cancellation is available only while the cancel option is shown.</p></details></div><details class="support-track-details" id="trackOrderDetails"><summary data-en="Track your order" data-te="మీ ఆర్డర్‌ను ట్రాక్ చేయండి">Track your order</summary><p id="trackOrderIntro" data-en="Enter the order reference and the phone number used at checkout to see the latest status." data-te="తాజా స్థితి చూడటానికి ఆర్డర్ రిఫరెన్స్, చెక్‌అవుట్‌లో ఇచ్చిన ఫోన్ నంబర్ నమోదు చేయండి.">Enter the order reference and the phone number used at checkout to see the latest status.</p><form class="tracking-form" id="trackOrderForm"><label><span class="field-label" id="trackOrderIdLabel">Order reference</span><input id="trackOrderId" name="orderId" required autocomplete="off" placeholder="Order reference from your confirmation"></label><label><span class="field-label" id="trackPhoneLabel">Phone number</span><input id="trackOrderPhone" name="phone" type="tel" autocomplete="tel" required placeholder="Phone number used for the order"></label><button class="button" id="trackOrderSubmit" type="submit">Find my order</button></form><p id="trackOrderMessage" class="tracking-message" role="status" aria-live="polite"></p><div id="trackOrderResult" class="tracking-result" hidden aria-live="polite"></div></details><div class="help-contact-actions"><a href="tel:+919876543210" data-en="☎ Call restaurant" data-te="☎ రెస్టారెంట్‌కు కాల్">☎ Call restaurant</a><a href="mailto:ruchiragam@gmail.com" data-en="✉ Email us" data-te="✉ ఈమెయిల్ చేయండి">✉ Email us</a></div></div></div></section>';
  const reviews = document.getElementById('reviews');
  const visit = document.getElementById('visit');
  if (visit) visit.after(section);
  else if (reviews) reviews.after(section);
  const social = document.querySelector('.social');
  if (social && !social.querySelector('a[href="#track-order"]')) {
    const link = document.createElement('a');
    link.href = '#track-order';
    link.textContent = 'Help';
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
  const quickCancel = document.createElement('div');
  quickCancel.className = 'tracking-cancel-window tracking-quick-cancel';
  quickCancel.hidden = true;
  receipt?.after(quickCancel);

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
  let countdownTimer = null;
  let statusBusy = false;
  const CANCEL_WINDOW_MS = 30_000;

  const renderStatus = order => {
    lastOrder = order;
    clearInterval(countdownTimer);
    quickCancel.hidden = true;
    const steps = order.fulfillment === 'pickup'
      ? ['new', 'accepted', 'preparing', 'ready', 'picked_up']
      : ['new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    if (order.status === 'cancelled') {
      result.innerHTML = `<div class="tracking-order-ref"><span>${t('Order reference', 'ఆర్డర్ రిఫరెన్స్')}</span><strong>${escapeHtml(order.id)}</strong></div><div class="tracking-current is-cancelled">${labels.cancelled[document.documentElement.lang === 'te' ? 1 : 0]}</div>`;
      result.hidden = false;
      quickCancel.hidden = true;
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
    const trackingMarkup = `<div class="tracking-order-ref"><span>${t('Order reference', 'ఆర్డర్ రిఫరెన్స్')}</span><strong>${escapeHtml(order.id)}</strong></div><div class="tracking-current">${current[document.documentElement.lang === 'te' ? 1 : 0]}</div><ol class="tracking-timeline">${timeline}</ol><small class="tracking-updated">${updated ? `${t('Last updated', 'చివరిగా అప్‌డేట్ అయిన సమయం')}: ${escapeHtml(updated)}` : ''}</small>`;
    result.innerHTML = trackingMarkup;
    if (order.status !== 'delivered') {
      const eta = document.createElement('div');
      eta.className = 'tracking-eta';
      eta.innerHTML = `<span>${t('Estimated delivery', 'అంచనా డెలివరీ సమయం')}</span><strong>${t('Around 35–50 minutes after placing the order', 'ఆర్డర్ చేసిన తర్వాత సుమారు 35–50 నిమిషాలు')}</strong>`;
      result.querySelector('.tracking-current')?.after(eta);
    }
    result.hidden = false;
    if (order.status === 'new') {
      quickCancel.innerHTML = `<strong class="tracking-countdown" aria-live="polite"></strong><button class="tracking-cancel-button" type="button">${t('Cancel order', 'ఆర్డర్ రద్దు చేయండి')}</button>`;
      if (confirmation && !confirmation.hidden) {
        receipt?.after(quickCancel);
        quickCancel.after(trackLink);
      } else result.append(quickCancel);
      const updateCountdown = async () => {
        const createdAt = new Date(order.createdAt || order.created_at).getTime();
        const remaining = Math.max(0, CANCEL_WINDOW_MS - (Date.now() - createdAt));
        const seconds = Math.ceil(remaining / 1000);
        quickCancel.hidden = remaining <= 0;
        const text = remaining > 0
          ? t(`Cancel available for 00:${String(seconds).padStart(2, '0')}`, `రద్దు చేయడానికి 00:${String(seconds).padStart(2, '0')} సమయం`)
          : t('Confirming your order…', 'మీ ఆర్డర్‌ను అంగీకరిస్తున్నాం…');
        document.querySelectorAll('.tracking-countdown').forEach(node => { node.textContent = text; });
        document.querySelectorAll('.tracking-cancel-button').forEach(button => { button.disabled = remaining <= 0 || statusBusy; });
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          await updateCustomerStatus(order, 'accepted');
        }
      };
      updateCountdown();
      if (Date.now() - new Date(order.createdAt || order.created_at).getTime() < CANCEL_WINDOW_MS) {
        countdownTimer = setInterval(updateCountdown, 250);
      }
    }
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  const updateCustomerStatus = async (order, status) => {
    if (statusBusy || order.status !== 'new') return;
    statusBusy = true;
    try {
      if (uuidPattern.test(order.id)) {
        const client = await window.rrSupabaseReady;
        if (!client) throw new Error('Shared order service is not connected.');
        const { data, error } = await client.rpc('update_customer_order_status', {
          p_order_id: order.id,
          p_phone: activeLookup?.phone || phoneField.value,
          p_status: status
        });
        if (error) throw error;
        if (!data) {
          if (activeLookup) await track(activeLookup.id, activeLookup.phone, true);
          return;
        }
      } else {
        const orders = JSON.parse(localStorage.getItem('ruchi-raagam-orders-v1') || '[]');
        const index = orders.findIndex(item => item.id === order.id && digits(item.customer?.phone) === digits(activeLookup?.phone || phoneField.value));
        if (index < 0) return;
        orders[index] = { ...orders[index], status, updatedAt: new Date().toISOString() };
        localStorage.setItem('ruchi-raagam-orders-v1', JSON.stringify(orders));
        window.dispatchEvent(new CustomEvent('rr:local-orders-changed', { detail: orders }));
      }
      const refreshed = await lookup(order.id, activeLookup?.phone || phoneField.value);
      if (refreshed) renderStatus(refreshed);
    } catch (error) {
      message.textContent = t(`Could not update order status: ${error.message || 'Try again.'}`, `ఆర్డర్ స్థితిని మార్చలేకపోయాం: ${error.message || 'మళ్లీ ప్రయత్నించండి.'}`);
    } finally { statusBusy = false; }
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('.tracking-cancel-button');
    if (!button || !lastOrder || lastOrder.status !== 'new') return;
    const age = Date.now() - new Date(lastOrder.createdAt || lastOrder.created_at).getTime();
    if (age >= CANCEL_WINDOW_MS) return;
    if (!window.confirm(t('Cancel this order?', 'ఈ ఆర్డర్‌ను రద్దు చేయాలా?'))) return;
    updateCustomerStatus(lastOrder, 'cancelled');
  });

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
        if (!quiet) {
          message.textContent = t('No order matched that reference and phone number.', 'ఆ రిఫరెన్స్, ఫోన్ నంబర్‌తో ఆర్డర్ కనబడలేదు. వివరాలు సరిచూసి మళ్లీ ప్రయత్నించండి.');
        }
        return;
      }
      message.textContent = order.backend || uuidPattern.test(id)
        ? t('Status refreshes automatically while this page is open.', 'ఈ పేజీ తెరిచి ఉన్నప్పుడు స్థితి ఆటోమేటిక్‌గా అప్‌డేట్ అవుతుంది.')
        : t('Showing this browser’s saved status. Connect the shared backend to track on other devices.', 'ఈ బ్రౌజర్‌లో సేవ్ అయిన స్థితిని చూపిస్తున్నాం. ఇతర పరికరాల్లో ట్రాక్ చేయడానికి shared backend కనెక్ట్ చేయండి.');
      renderStatus(order);
    } catch (error) {
      if (!quiet) {
        message.textContent = t(`Could not check the order: ${error.message || 'Try again.'}`, `ఆర్డర్‌ను చూడలేకపోయాం: ${error.message || 'మళ్లీ ప్రయత్నించండి.'}`);
      }
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
  trackLink.addEventListener('click', () => { document.getElementById('trackOrderDetails').open = true; });
  quickCancel.after(trackLink);

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
    section.querySelectorAll('[data-en][data-te]').forEach(element => { element.textContent = element.dataset[telugu ? 'te' : 'en']; });
    idField.placeholder = telugu ? 'ఆర్డర్ రిఫరెన్స్ నమోదు చేయండి' : 'Order reference from your confirmation';
    phoneField.placeholder = telugu ? 'ఆర్డర్‌లో ఇచ్చిన ఫోన్ నంబర్' : 'Phone number used for the order';
    document.querySelectorAll('.tracking-cancel-button').forEach(button => { button.textContent = telugu ? 'ఆర్డర్ రద్దు చేయండి' : 'Cancel order'; });
    syncTrackingLanguage();
  });
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
