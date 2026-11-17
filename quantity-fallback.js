// Keep menu quantity controls usable if the main app script fails to initialize.
document.addEventListener('click', event => {
  const checkoutButton = event.target.closest('#checkoutOpen');
  if (checkoutButton && !window.rrCheckoutHandlerReady) {
    const panel = document.getElementById('checkoutPanel');
    if (panel) {
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  const button = event.target.closest('.qty-button');
  if (!button || event.rrQuantityHandled || window.rrQuantityHandlerReady) return;

  const card = button.closest('.dish');
  const picker = button.closest('.quantity-picker');
  const value = card?.querySelector('.qty-value');
  if (!card || !picker || !value) return;

  value.textContent = Math.max(0, Math.min(99, Number(value.textContent) + Number(button.dataset.step || 0)));
  picker.classList.toggle('is-empty', Number(value.textContent) === 0);

  const confirmation = document.getElementById('orderConfirmation');
  const checkoutForm = document.getElementById('checkoutForm');
  if (confirmation) confirmation.hidden = true;
  if (checkoutForm) checkoutForm.hidden = false;

  if (typeof window.rrUpdateOrderSummary === 'function') {
    window.rrUpdateOrderSummary();
    return;
  }

  // Basic summary fallback for a partially initialized page.
  const cards = [...document.querySelectorAll('.dish')];
  const itemCount = cards.reduce((sum, item) => sum + Number(item.querySelector('.qty-value')?.textContent || 0), 0);
  const subtotal = cards.reduce((sum, item) => {
    const quantity = Number(item.querySelector('.qty-value')?.textContent || 0);
    const price = Number(item.querySelector('.price')?.textContent.replace(/[^0-9]/g, '') || 0);
    return sum + quantity * price;
  }, 0);
  const summary = document.getElementById('orderSummary');
  if (summary) summary.hidden = itemCount === 0;
  document.body.classList.toggle('has-cart', itemCount > 0);
  const count = document.getElementById('orderCount');
  if (count) count.textContent = `${itemCount} items`;
  const total = document.getElementById('orderTotal');
  if (total) total.textContent = `₹${subtotal}`;
});
