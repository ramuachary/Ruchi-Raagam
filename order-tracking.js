(() => {
  const section = document.createElement('section');
  section.className = 'tracking-section support-section';
  section.id = 'help';
  section.hidden = true;
  section.innerHTML = '<div class="wrap"><div class="tracking-card support-card"><div class="eyebrow" data-en="Customer help" data-te="కస్టమర్ సహాయం">Customer help</div><h2 id="helpTitle" data-en="How can we help?" data-te="మేమెలా సహాయపడగలం?">How can we help?</h2><p id="helpIntro" data-en="Find quick answers about ordering, delivery, payments and tracking." data-te="ఆర్డర్, డెలివరీ, చెల్లింపులు, ట్రాకింగ్ గురించి సమాధానాలు ఇక్కడ చూడండి.">Find quick answers about ordering, delivery, payments and tracking.</p><div class="support-faqs"><details><summary data-en="How do I place an order?" data-te="ఆర్డర్ ఎలా చేయాలి?">How do I place an order?</summary><p data-en="Choose dishes and quantities, open View order, fill in delivery details, then confirm." data-te="వంటకాలు, పరిమాణాలు ఎంచుకుని View order నొక్కండి. డెలివరీ వివరాలు నింపి Confirm order చేయండి.">Choose dishes and quantities, open View order, fill in delivery details, then confirm.</p></details><details><summary data-en="What are the delivery charges?" data-te="డెలివరీ ఛార్జీలు ఎంత?">What are the delivery charges?</summary><p data-en="Delivery is free for orders of ₹199 or more. Below ₹199, it is ₹12 for each started kilometre." data-te="₹199 లేదా అంతకంటే ఎక్కువ subtotal‌కు డెలివరీ ఉచితం; ₹199 లోపు ప్రారంభమైన ప్రతి km‌కు ₹12.">Free delivery at ₹199+ subtotal; below ₹199, ₹12 per started km.</p></details><details><summary data-en="Need help with payment or cancellation?" data-te="చెల్లింపు లేదా రద్దుకు సహాయం కావాలా?">Need help with payment or cancellation?</summary><p data-en="Call us and share your order reference. Cancellation is available only while the cancel option is shown." data-te="మాకు కాల్ చేసి ఆర్డర్ రిఫరెన్స్ చెప్పండి. Cancel order ఎంపిక కనిపిస్తున్నప్పుడే రద్దు చేయవచ్చు.">Call us and share your order reference. Cancellation is available only while the cancel option is shown.</p></details></div><details class="support-track-details" id="trackOrderDetails"><summary data-en="Track your order" data-te="మీ ఆర్డర్‌ను ట్రాక్ చేయండి">Track your order</summary><p id="trackOrderIntro" data-en="Enter the order reference and the phone number used at checkout to see the latest status." data-te="తాజా స్థితి చూడటానికి ఆర్డర్ రిఫరెన్స్, చెక్‌అవుట్‌లో ఇచ్చిన ఫోన్ నంబర్ నమోదు చేయండి.">Enter the order reference and the phone number used at checkout to see the latest status.</p><form class="tracking-form" id="trackOrderForm"><label><span class="field-label" id="trackOrderIdLabel">Order reference</span><input id="trackOrderId" name="orderId" required autocomplete="off" placeholder="Order reference from your confirmation"></label><label><span class="field-label" id="trackPhoneLabel">Phone number</span><input id="trackOrderPhone" name="phone" type="tel" autocomplete="tel" required placeholder="Phone number used for the order"></label><button class="button" id="trackOrderSubmit" type="submit">Find my order</button></form><p id="trackOrderMessage" class="tracking-message" role="status" aria-live="polite"></p><div id="trackOrderResult" class="tracking-result" hidden aria-live="polite"></div></details><div class="help-contact-actions"><a href="tel:+919876543210" data-en="☎ Call restaurant" data-te="☎ రెస్టారెంట్‌కు కాల్">☎ Call restaurant</a><a href="mailto:ruchiragam@gmail.com" data-en="✉ Email us" data-te="✉ ఈమెయిల్ చేయండి">✉ Email us</a></div></div></div></section>';
  const trackDetails = section.querySelector('#trackOrderDetails');
  const supportCard = section.querySelector('.support-card');
  supportCard.setAttribute('role', 'dialog');
  supportCard.setAttribute('aria-modal', 'true');
  supportCard.setAttribute('aria-labelledby', 'helpTitle');
  const closeHelp = document.createElement('button');
  closeHelp.className = 'help-close';
  closeHelp.type = 'button';
  closeHelp.setAttribute('aria-label', 'Close help');
  closeHelp.textContent = '×';
  supportCard.prepend(closeHelp);
  const trackingSection = document.createElement('section');
  trackingSection.className = 'tracking-section checkout-tracking';
  trackingSection.id = 'track-order';
  trackingSection.innerHTML = '<div class="wrap"><div class="tracking-card"><div class="eyebrow">ORDER UPDATES</div><h2 id="trackOrderTitle">Track your order</h2></div></div>';
  const trackingCard = trackingSection.querySelector('.tracking-card');
  trackDetails.querySelector('summary')?.remove();
  while (trackDetails.firstChild) trackingCard.appendChild(trackDetails.firstChild);
  trackDetails.remove();
  const reviews = document.getElementById('reviews');
  const visit = document.getElementById('visit');
  const checkoutPanel = document.getElementById('checkoutPanel');
  const orderConfirmationPanel = document.getElementById('orderConfirmation');
  if (checkoutPanel && orderConfirmationPanel) orderConfirmationPanel.after(trackingSection);
  if (visit) visit.after(section);
  else if (reviews) reviews.after(section);
  const social = document.querySelector('.social');
  if (social && !social.querySelector('a[href="#help"]')) {
    const link = document.createElement('a');
    link.href = '#help';
    link.textContent = 'Help';
    social.insertBefore(link, document.getElementById('openDashboard'));
  }
  social?.querySelectorAll('a[href="#help"]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    section.hidden = false;
    document.body.classList.add('help-open');
    closeHelp.focus();
  }));
  const dismissHelp = () => { section.hidden = true; document.body.classList.remove('help-open'); };
  closeHelp.addEventListener('click', dismissHelp);
  section.addEventListener('click', event => { if (event.target === section) dismissHelp(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !section.hidden) dismissHelp(); });

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
    const trackingMarkup = `<div class="tracking-order-ref"><span>${t('Order reference', 'ఆర్డర్ రిఫరెన్స్')}</span><strong>${escapeHtml(order.id)}</strong></div><div class="tracking-current">${current[document.documentElement.lang === 'te' ? 1 : 0]}</div>${order.deliveryPerson && order.fulfillment !== 'pickup' ? `<p class="tracking-delivery-person"><span>${t('Your delivery partner', 'మీ డెలివరీ భాగస్వామి')}</span><strong>${escapeHtml(order.deliveryPerson)}</strong></p>` : ''}<ol class="tracking-timeline">${timeline}</ol><small class="tracking-updated">${updated ? `${t('Last updated', 'చివరిగా అప్‌డేట్ అయిన సమయం')}: ${escapeHtml(updated)}` : ''}</small>`;
    result.innerHTML = trackingMarkup;
    if (order.status === 'delivered' && Array.isArray(order.items) && order.items.length) {
      const invoiceActions = document.createElement('div');
      invoiceActions.className = 'invoice-actions';
      const previewButton = document.createElement('button');
      previewButton.type = 'button';
      previewButton.className = 'button invoice-preview-toggle';
      previewButton.textContent = t('Preview invoice', 'ఇన్వాయిస్ ప్రివ్యూ');
      previewButton.setAttribute('aria-expanded', 'false');
      const downloadButton = document.createElement('button');
      downloadButton.type = 'button';
      downloadButton.className = 'button invoice-download';
      downloadButton.textContent = t('Download PDF', 'PDF డౌన్‌లోడ్');
      downloadButton.addEventListener('click', () => downloadInvoicePdf(order));
      const previewPanel = document.createElement('div');
      previewPanel.className = 'invoice-preview-panel';
      previewPanel.hidden = true;
      const previewFrame = document.createElement('iframe');
      previewFrame.className = 'invoice-preview-frame';
      previewFrame.title = t('Invoice preview', 'ఇన్వాయిస్ ప్రివ్యూ');
      previewPanel.append(previewFrame);
      previewButton.addEventListener('click', () => {
        const open = previewPanel.hidden;
        previewPanel.hidden = !open;
        previewButton.setAttribute('aria-expanded', String(open));
        previewButton.textContent = t(open ? 'Hide preview' : 'Preview invoice', open ? 'ప్రివ్యూ మూసివేయి' : 'ఇన్వాయిస్ ప్రివ్యూ');
        if (open && !previewFrame.srcdoc) previewFrame.srcdoc = buildInvoiceMarkup(order);
      });
      invoiceActions.append(previewButton, downloadButton);
      result.append(invoiceActions, previewPanel);
    }
    if (order.status !== 'delivered') {
      const eta = document.createElement('div');
      eta.className = 'tracking-eta';
      const created = new Date(order.createdAt || order.created_at || Date.now());
      const startMinutes = order.fulfillment === 'pickup' ? 20 : 35;
      const endMinutes = order.fulfillment === 'pickup' ? 30 : 50;
      const locale = document.documentElement.lang === 'te' ? 'te-IN' : 'en-IN';
      const startTime = new Date(created.getTime() + startMinutes * 60_000).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
      const endTime = new Date(created.getTime() + endMinutes * 60_000).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
      eta.innerHTML = `<span>${t(order.fulfillment === 'pickup' ? 'Estimated pickup' : 'Estimated delivery', order.fulfillment === 'pickup' ? 'అంచనా పికప్ సమయం' : 'అంచనా డెలివరీ సమయం')}</span><strong>${t(`${startTime}–${endTime} (about ${startMinutes}–${endMinutes} min after order)`, `ఆర్డర్ తర్వాత సుమారు ${startMinutes}–${endMinutes} నిమిషాలు · ${startTime}–${endTime}`)}</strong>`;
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
  const buildInvoiceMarkup = order => {
    const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    const rows = order.items.map(item => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      return `<tr><td>${escapeHtml(item.name || 'Menu item')}<small>${escapeHtml(item.portion || item.variant || '')}</small></td><td>${quantity}</td><td>${money(price)}</td><td>${money(price * quantity)}</td></tr>`;
    }).join('');
    const subtotal = Number(order.subtotal ?? order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
    const amountRow = (label, value) => Number(value || 0) ? `<tr><th colspan="3">${label}</th><td>${money(value)}</td></tr>` : '';
    const date = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const address = [order.address, order.pincode].filter(Boolean).map(escapeHtml).join(', ');
    const markup = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Invoice ${escapeHtml(order.id)}</title><style>body{font:15px Arial,sans-serif;color:#30231c;max-width:760px;margin:40px auto;padding:0 24px;min-height:1000px;display:flex;flex-direction:column}header{display:flex;justify-content:space-between;border-bottom:2px solid #bb4e25;padding-bottom:18px}h1{font:700 30px Georgia,serif;margin:0 0 6px}.muted{color:#735f52;font-size:13px;line-height:1.6}.meta{margin:20px 0}table{width:100%;border-collapse:collapse;margin:22px 0}th,td{padding:11px 8px;border-bottom:1px solid #eadfd5;text-align:right}th:first-child,td:first-child{text-align:left}td small{display:block;color:#735f52;margin-top:4px}.totals{margin-left:auto;width:min(100%,360px)}.totals td,.totals th{border:0}.grand th,.grand td{border-top:2px solid #bb4e25;font-size:18px;font-weight:bold}.note{margin:auto 0 28px;padding-top:26px;text-align:center;color:#735f52;font-size:12px}</style><body><header><div><h1>Ruchi Raagam</h1><div class="muted">Andhra Cuisine · Hyderabad</div></div><div><strong>INVOICE</strong><div class="muted">Order ${escapeHtml(order.id)}</div><div class="muted">${escapeHtml(date)}</div></div></header><section class="meta"><strong>Bill to</strong><div>${escapeHtml(order.customerName || 'Customer')}</div><div class="muted">${address || '—'}</div>${order.deliveryPerson ? `<div class="muted">Delivery partner: ${escapeHtml(order.deliveryPerson)}</div>` : ''}</section><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><table class="totals"><tbody><tr><th colspan="3">Items subtotal</th><td>${money(subtotal)}</td></tr>${amountRow('Delivery charge', order.deliveryCharge)}${amountRow('Packaging fee', order.packagingCharge)}${amountRow('Platform fee', order.platformFee)}${amountRow('Restaurant GST', order.gstCharge)}${amountRow('Delivery tip', order.tip)}${amountRow('Coupon discount', -Number(order.discount || 0))}<tr class="grand"><th colspan="3">Total paid / payable</th><td>${money(order.total)}</td></tr></tbody></table><div class="muted">Payment: ${escapeHtml(order.payment || '—')} · Status: ${escapeHtml(order.paymentStatus || 'unpaid')}</div><p class="note">Thank you for ordering from Ruchi Raagam.</p></body></html>`;
    const restaurantAddress = 'SR Nagar · Near Venkateswara Temple · Hyderabad 500038';
    const invoiceMarkup = markup
      .replace('Andhra Cuisine · Hyderabad', 'Andhra Cuisine')
      .replace('.meta{margin:20px 0}', '.meta{margin:20px 0}.address-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.address-grid>div{padding:14px;background:#f8f1e9;border-radius:10px;line-height:1.6}.address-grid strong{display:block;margin-bottom:8px;color:#b94925;font-size:12px;text-transform:uppercase;letter-spacing:1px}@media(max-width:540px){.address-grid{grid-template-columns:1fr}}')
      .replace(/<section class="meta">.*?<\/section>/, `<section class="meta address-grid"><div><strong>Bill to</strong><div>${escapeHtml(order.customerName || 'Customer')}</div><div class="muted">${address || '—'}</div>${order.deliveryPerson ? `<div class="muted">Delivery partner: ${escapeHtml(order.deliveryPerson)}</div>` : ''}</div><div><strong>Restaurant</strong><div>Ruchi Raagam</div><div class="muted">${escapeHtml(restaurantAddress)}</div><div class="muted">+91 98765 43210</div><div class="muted">ruchiragam@gmail.com</div></div></section>`)
      .replaceAll('Restaurant GST', 'GST (5%)')
      .replaceAll('Delivery charge', 'Delivery')
      .replace(/<tr><th colspan="3">(?:Packaging fee|Platform fee|Delivery tip)<\/th><td>.*?<\/td><\/tr>/g, '');
    return invoiceMarkup;
  };

  const downloadInvoicePdf = order => {
    const canvas = document.createElement('canvas');
    canvas.width = 1275;
    canvas.height = 1804;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(1.5, 1.5);
    const pageWidth = 850;
    const pageHeight = 1202;
    const margin = 54;
    const right = pageWidth - margin;
    const restaurantAddress = 'SR Nagar · Near Venkateswara Temple · Hyderabad 500038';
    const address = [order.address, order.pincode].filter(Boolean).join(', ');
    const date = new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    const color = { ink: '#30231c', muted: '#735f52', line: '#eadfd5', accent: '#bd4f28', pale: '#f8f1e9', white: '#fffdfa' };
    context.fillStyle = color.white;
    context.fillRect(0, 0, pageWidth, pageHeight);
    context.fillStyle = color.accent;
    context.fillRect(0, 0, pageWidth, 8);
    context.fillStyle = color.ink;
    context.font = 'bold 31px Georgia, serif';
    context.fillText('Ruchi Raagam', margin, 67);
    context.font = '12px Arial, sans-serif';
    context.fillStyle = color.muted;
    context.fillText('AUTHENTIC ANDHRA CUISINE', margin, 92);
    context.font = 'bold 15px Arial, sans-serif';
    context.fillStyle = color.accent;
    context.textAlign = 'right';
    context.fillText('INVOICE', right, 47);
    context.font = '13px Arial, sans-serif';
    context.fillStyle = color.ink;
    context.fillText(`Order ${order.id}`, right, 70);
    context.fillStyle = color.muted;
    context.fillText(date, right, 92);
    context.textAlign = 'left';
    context.strokeStyle = color.line;
    context.beginPath(); context.moveTo(margin, 115); context.lineTo(right, 115); context.stroke();

    const boxY = 137, boxH = 144, gutter = 20, boxW = (pageWidth - margin * 2 - gutter) / 2;
    context.fillStyle = color.pale;
    context.fillRect(margin, boxY, boxW, boxH);
    context.fillRect(margin + boxW + gutter, boxY, boxW, boxH);
    context.font = 'bold 12px Arial, sans-serif'; context.fillStyle = color.accent;
    context.fillText('BILL TO', margin + 16, boxY + 24);
    context.fillText('RESTAURANT', margin + boxW + gutter + 16, boxY + 24);
    context.font = 'bold 16px Arial, sans-serif'; context.fillStyle = color.ink;
    context.fillText(String(order.customerName || 'Customer').slice(0, 40), margin + 16, boxY + 50);
    context.fillText('Ruchi Raagam', margin + boxW + gutter + 16, boxY + 50);
    context.font = '13px Arial, sans-serif'; context.fillStyle = color.muted;
    const drawWrapped = (text, x, y, maxWidth, lineHeight = 18) => {
      let line = '';
      for (const word of String(text || '—').split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width > maxWidth && line) { context.fillText(line, x, y); y += lineHeight; line = word; }
        else line = candidate;
      }
      if (line) context.fillText(line, x, y);
      return y + lineHeight;
    };
    let leftY = drawWrapped(address, margin + 16, boxY + 76, boxW - 32);
    if (order.deliveryPerson) drawWrapped(`Delivery partner: ${order.deliveryPerson}`, margin + 16, leftY + 1, boxW - 32);
    const rx = margin + boxW + gutter + 16;
    let rightY = drawWrapped(restaurantAddress, rx, boxY + 76, boxW - 32);
    rightY = drawWrapped('+91 98765 43210', rx, rightY + 1, boxW - 32);
    drawWrapped('ruchiragam@gmail.com', rx, rightY + 1, boxW - 32);

    let y = boxY + boxH + 28;
    const rowHeight = 27;
    context.fillStyle = color.pale;
    context.fillRect(margin, y, pageWidth - margin * 2, 34);
    context.font = 'bold 11px Arial, sans-serif'; context.fillStyle = color.muted;
    context.fillText('ITEM', margin + 12, y + 22);
    context.textAlign = 'center'; context.fillText('QTY', 600, y + 22); context.fillText('PRICE', 690, y + 22);
    context.textAlign = 'right'; context.fillText('AMOUNT', right - 12, y + 22);
    y += 34;
    context.textAlign = 'left';
    for (const item of order.items) {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      context.font = 'bold 13px Arial, sans-serif'; context.fillStyle = color.ink;
      context.fillText(String(item.name || 'Menu item').slice(0, 48), margin + 12, y + 17);
      context.font = '11px Arial, sans-serif'; context.fillStyle = color.muted;
      context.fillText(String(item.portion || item.variant || '').slice(0, 36), margin + 12, y + 33);
      context.font = '13px Arial, sans-serif'; context.fillStyle = color.ink; context.textAlign = 'center';
      context.fillText(String(quantity), 600, y + 23); context.fillText(money(price), 690, y + 23);
      context.textAlign = 'right'; context.font = 'bold 13px Arial, sans-serif';
      context.fillText(money(price * quantity), right - 12, y + 23);
      context.strokeStyle = color.line; context.beginPath(); context.moveTo(margin, y + rowHeight); context.lineTo(right, y + rowHeight); context.stroke();
      y += rowHeight;
    }

    y = Math.max(y + 24, 420);
    const subtotal = Number(order.subtotal ?? order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
    const totals = [['Items subtotal', subtotal], ['Delivery', Number(order.deliveryCharge || 0)], ['GST (5%)', Number(order.gstCharge || 0)]];
    if (Number(order.discount || 0)) totals.push(['Coupon discount', -Number(order.discount)]);
    context.textAlign = 'left';
    context.font = '13px Arial, sans-serif'; context.fillStyle = color.muted;
    for (const [label, amount] of totals) {
      context.fillText(label, margin + 12, y);
      context.textAlign = 'right'; context.fillStyle = color.ink;
      context.fillText(`${Number(amount) < 0 ? '−' : ''}${money(Math.abs(Number(amount)))}`, right - 12, y);
      context.textAlign = 'left'; context.fillStyle = color.muted;
      y += 29;
    }
    context.strokeStyle = color.line; context.beginPath(); context.moveTo(margin, y - 8); context.lineTo(right, y - 8); context.stroke();
    context.font = 'bold 17px Arial, sans-serif'; context.fillStyle = color.ink;
    context.fillText('Total paid / payable', margin + 12, y + 20);
    context.font = 'bold 24px Georgia, serif'; context.fillStyle = color.accent; context.textAlign = 'right';
    context.fillText(money(order.total), right - 12, y + 22);
    context.textAlign = 'left'; context.font = '12px Arial, sans-serif'; context.fillStyle = color.muted;
    const paymentStatus = String(order.paymentStatus || 'unpaid');
    const paymentLabel = paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'unpaid' ? 'Unpaid' : paymentStatus;
    context.fillText(`Payment: ${order.payment || '—'} · Status: ${paymentLabel}`, margin + 12, y + 52);
    context.strokeStyle = color.line; context.beginPath(); context.moveTo(margin, pageHeight - 68); context.lineTo(right, pageHeight - 68); context.stroke();
    context.textAlign = 'center'; context.font = 'bold 15px Georgia, serif'; context.fillStyle = color.ink;
    context.fillText('Thank you for ordering from Ruchi Raagam.', pageWidth / 2, pageHeight - 40);
    context.textAlign = 'left';

    const jpeg = atob(canvas.toDataURL('image/jpeg', 0.94).split(',')[1]);
    const imageBytes = Uint8Array.from(jpeg, char => char.charCodeAt(0));
    const encoder = new TextEncoder();
    const encode = text => encoder.encode(text);
    const join = chunks => {
      const output = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
      return output;
    };
    const pageContent = encode('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q\n');
    const objects = [
      encode('<< /Type /Catalog /Pages 2 0 R >>'),
      encode('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
      encode('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'),
      join([encode(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`), imageBytes, encode('\nendstream')]),
      join([encode(`<< /Length ${pageContent.length} >>\nstream\n`), pageContent, encode('endstream')])
    ];
    const chunks = [encode('%PDF-1.4\n%RR\n')];
    const offsets = [0];
    let byteLength = chunks[0].length;
    objects.forEach((object, index) => {
      offsets.push(byteLength);
      const block = join([encode(`${index + 1} 0 obj\n`), object, encode('\nendobj\n')]);
      chunks.push(block); byteLength += block.length;
    });
    const xrefOffset = byteLength;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index < offsets.length; index++) xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    chunks.push(encode(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
    const blob = new Blob([join(chunks)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ruchi-Raagam-Invoice-${String(order.id).replace(/[^a-z0-9-]/gi, '')}.pdf`;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

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
      return { id: order.id, status: order.status, fulfillment: order.fulfillment, createdAt: order.created_at, updatedAt: order.updated_at, deliveryPerson: order.delivery_person || '', customerName: order.customer_name || '', address: order.address || '', pincode: order.pincode || '', items: order.items || [], subtotal: order.subtotal, deliveryCharge: order.delivery_charge, packagingCharge: order.packaging_charge, platformFee: order.platform_fee, gstCharge: order.gst_charge, tip: order.tip, discount: order.discount, couponCode: order.coupon_code || '', total: order.total, payment: order.payment_method || '', paymentStatus: order.payment_status || '' };
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
