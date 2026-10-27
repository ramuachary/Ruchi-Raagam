(() => {
  const form = document.getElementById('checkoutForm');
  const confirmation = document.getElementById('orderConfirmation');
  const options = document.getElementById('paymentOptions');
  if (!form || !confirmation || !options) return;

  const option = document.createElement('label');
  option.className = 'payment-option razorpay-option';
  option.innerHTML = '<input type="radio" name="payment" value="razorpay"><span class="razorpay-mark" aria-hidden="true">RZ</span><span class="payment-option-copy"><span class="razorpay-option-title" data-en="Pay online securely" data-te="ఆన్‌లైన్‌లో సురక్షితంగా చెల్లించండి">Pay online securely</span><small class="payment-option-hint" data-en="UPI, cards, netbanking and wallets" data-te="UPI, కార్డులు, నెట్ బ్యాంకింగ్, వాలెట్లు">UPI, cards, netbanking and wallets</small></span>';
  const paymentNote = document.getElementById('paymentNote');
  const payButton = document.createElement('button');
  payButton.type = 'button';
  payButton.className = 'button razorpay-pay-button';
  payButton.textContent = 'Pay securely online';
  payButton.hidden = true;
  const status = document.createElement('p');
  status.className = 'payment-note razorpay-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  confirmation.querySelector('#orderReceipt')?.after(status, payButton);
  const emailButton = document.getElementById('sendEmailOrder');
  const messageLink = document.getElementById('sendWhatsApp');
  const copyButton = document.getElementById('copyOrder');

  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const getDraft = () => {
    const values = Object.fromEntries(new FormData(form).entries());
    const items = [...document.querySelectorAll('.dish')].map((card, index) => {
      const select = card.querySelector('.portion-select');
      return {
        sku: index + 1,
        name: card.querySelector('.dish-title h3')?.textContent.trim() || '',
        portion: select?.selectedOptions[0]?.textContent.split('·')[0].trim() || 'Single',
        variant: select ? (select.selectedIndex === 0 ? 'half' : 'full') : 'single',
        quantity: Number(card.querySelector('.qty-value')?.textContent || 0),
        price: Number((card.querySelector('.price')?.textContent || '').replace(/[^0-9]/g, '')),
      };
    }).filter(item => item.quantity > 0);
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const distanceKm = Number(values.distanceKm);
    const deliveryCharge = Math.max(0, Math.ceil(distanceKm - 7 - 1e-9)) * 5;
    const code = values.couponCode || '';
    const discount = code === 'RAGAM10' && subtotal >= 150 ? Math.round(subtotal * .10)
      : code === 'WELCOME50' && subtotal >= 350 ? 50
      : code === 'FEAST15' && subtotal >= 500 ? Math.round(subtotal * .15) : 0;
    return {
      customer: { name: values.name, phone: values.phone, address: values.address, landmark: values.landmark, pincode: values.pincode },
      items, subtotal, distanceKm, deliveryCharge, discount, couponCode: code,
      total: subtotal + deliveryCharge - discount, payment: 'razorpay', fulfillment: 'delivery',
    };
  };
  const setStatus = (text, success = false) => {
    status.textContent = text;
    status.classList.toggle('is-success', success);
  };
  const updateLanguage = () => {
    const te = document.documentElement.lang === 'te';
    const title = option.querySelector('.razorpay-option-title');
    if (title) title.textContent = title.dataset[te ? 'te' : 'en'];
    if (payButton && !payButton.disabled) payButton.textContent = te ? 'సురక్షితంగా చెల్లించండి' : 'Pay securely online';
    if (!payButton.hidden) setStatus(te
      ? 'Razorpay ద్వారా UPI, కార్డులు, నెట్ బ్యాంకింగ్ లేదా వాలెట్లతో చెల్లించండి.'
      : 'Razorpay checkout accepts UPI, cards, netbanking and wallets.');
  };
  const chooseGateway = () => {
    const selected = form.elements.namedItem('payment')?.value === 'razorpay';
    payButton.hidden = !selected;
    if (emailButton) emailButton.hidden = selected;
    if (messageLink) messageLink.hidden = selected;
    if (copyButton) copyButton.hidden = selected;
    if (selected) {
      const te = document.documentElement.lang === 'te';
      setStatus(te ? 'Razorpay ద్వారా UPI, కార్డులు, నెట్ బ్యాంకింగ్ లేదా వాలెట్లతో చెల్లించండి.' : 'Razorpay checkout accepts UPI, cards, netbanking and wallets.');
      if (paymentNote) paymentNote.textContent = te ? 'Razorpay Checkout‌లో సురక్షితంగా చెల్లించండి. చెల్లింపు నిర్ధారణ తర్వాత ఆర్డర్ పంపబడుతుంది.' : 'Pay securely in Razorpay checkout. Your order is sent to the restaurant after payment is verified.';
    }
  };

  (async () => {
    const client = await window.rrSupabaseReady;
    if (!client) return;
    options.append(option);
    form.querySelectorAll('input[name="payment"]').forEach(radio => radio.addEventListener('change', () => {
      chooseGateway();
    }));
    document.getElementById('languageToggle')?.addEventListener('click', updateLanguage);
    form.addEventListener('submit', () => {
      if (form.elements.namedItem('payment')?.value !== 'razorpay') return;
      queueMicrotask(() => {
        chooseGateway();
        const order = getDraft();
        const summary = order.items.map(item => `${item.quantity} × ${item.name} (${item.portion}) — ${money(item.quantity * item.price)}`);
        const te = document.documentElement.lang === 'te';
        document.getElementById('orderReceipt').textContent = [
          te ? 'రుచి రాగం — కొత్త ఆర్డర్' : 'RUCHI RAAGAM — NEW ORDER',
          `${te ? 'పేరు' : 'Name'}: ${order.customer.name}`,
          `${te ? 'ఫోన్' : 'Phone'}: ${order.customer.phone}`,
          `${te ? 'చెల్లింపు' : 'Payment'}: Razorpay`,
          te ? 'వంటకాలు:' : 'Items:', ...summary,
          `${te ? 'వంటకాల మొత్తం' : 'Items subtotal'}: ${money(order.subtotal)}`,
          `${te ? 'డెలివరీ ఛార్జీ' : 'Delivery charge'}: ${money(order.deliveryCharge)}`,
          `${te ? 'కూపన్ తగ్గింపు' : 'Coupon discount'}: ${money(order.discount)}`,
          `${te ? 'చెల్లించాల్సిన మొత్తం' : 'Total to pay'}: ${money(order.total)}`,
          `${te ? 'చిరునామా' : 'Address'}: ${order.customer.address}`,
          `${te ? 'పిన్‌కోడ్' : 'Pincode'}: ${order.customer.pincode}`,
        ].join('\n');
      });
    });

    let pendingPaymentResponse = null;
    let pendingOrderForTracking = null;
    const verifyPayment = async response => {
      pendingPaymentResponse = response;
      payButton.disabled = true;
      setStatus(document.documentElement.lang === 'te' ? 'చెల్లింపును సురక్షితంగా నిర్ధారిస్తున్నాం…' : 'Verifying payment securely…');
      try {
        const { data, error } = await client.functions.invoke('razorpay-checkout', {
          body: { action: 'verify', razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature },
        });
        if (error) throw error;
        if (!data?.success || !data.orderId) throw new Error('The payment is not confirmed yet. Please contact the restaurant before retrying.');
        pendingPaymentResponse = null;
        window.dispatchEvent(new CustomEvent('rr:order-cloud-saved', { detail: {
          id: data.orderId,
          customer: { phone: pendingOrderForTracking?.customer?.phone || '' },
          status: 'new',
          fulfillment: pendingOrderForTracking?.fulfillment || 'delivery',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          backend: true,
        }}));
        pendingOrderForTracking = null;
        setStatus(document.documentElement.lang === 'te' ? `చెల్లింపు నిర్ధారించబడింది. ఆర్డర్ ${data.orderId} రెస్టారెంట్‌కు పంపబడింది.` : `Payment confirmed. Order ${data.orderId} has been sent to the restaurant.`, true);
        payButton.hidden = true;
        form.hidden = true;
        const receipt = document.getElementById('orderReceipt').textContent + `\nRazorpay payment ID: ${response.razorpay_payment_id}`;
        fetch('https://formsubmit.co/ajax/ruchiragam@gmail.com', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ _subject: `Paid Ruchi Raagam order ${data.orderId}`, name: 'Ruchi Raagam website order', message: receipt }),
        }).catch(() => {});
      } catch (error) {
        setStatus(`${error.message || 'Payment verification failed.'} Keep the payment ID: ${response.razorpay_payment_id}`);
        payButton.disabled = false;
        payButton.textContent = 'Retry verification';
      }
    };

    payButton.addEventListener('click', async () => {
      payButton.disabled = true;
      if (pendingPaymentResponse) {
        await verifyPayment(pendingPaymentResponse);
        return;
      }
      payButton.textContent = 'Opening secure checkout…';
      setStatus('Preparing your secure payment…');
      try {
        if (!window.Razorpay) throw new Error('Payment checkout is not ready. Please try again later.');
        const orderData = getDraft();
        pendingOrderForTracking = orderData;
        const { data: checkout, error } = await client.functions.invoke('razorpay-checkout', { body: { action: 'create', order_data: orderData } });
        if (error) throw error;
        if (!checkout?.orderId || !checkout?.keyId) throw new Error('Payment checkout is not ready. Please try again later.');
        const checkoutUi = new window.Razorpay({
          key: checkout.keyId,
          amount: checkout.amount,
          currency: checkout.currency,
          name: checkout.name,
          description: checkout.description,
          order_id: checkout.orderId,
          prefill: { name: orderData.customer.name, contact: orderData.customer.phone },
          theme: { color: '#bd552d' },
          modal: { ondismiss: () => { setStatus('Payment was not completed. You can try again.'); payButton.disabled = false; payButton.textContent = 'Pay securely online'; } },
          handler: response => verifyPayment(response),
        });
        checkoutUi.on('payment.failed', event => {
          setStatus(event.error?.description || 'Payment failed. You can try again.');
          payButton.disabled = false;
          payButton.textContent = 'Retry payment';
        });
        checkoutUi.open();
      } catch (error) {
        setStatus(error.message || 'Could not start the payment. Please try again.');
        payButton.disabled = false;
        payButton.textContent = 'Pay securely online';
      }
    });
  })().catch(error => {
    console.error('Razorpay checkout setup failed:', error);
  });
})();
