(() => {
  const ORDERS_KEY = 'ruchi-raagam-orders-v1';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reorder-last-button';
  button.hidden = true;
  button.setAttribute('aria-label', 'Add your last order to the menu selection');

  const menu = document.getElementById('menu');
  const categories = document.getElementById('menuCategories');
  const grid = menu?.querySelector('.menu-grid');
  if (!menu || !categories || !grid) return;
  categories.insertAdjacentElement('afterend', button);

  const latestOrder = () => {
    try {
      return (JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]') || [])
        .filter(order => Array.isArray(order.items) && order.items.length && order.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
    } catch { return null; }
  };

  const language = () => document.documentElement.lang === 'te' ? 'te' : 'en';
  const refresh = () => {
    const order = latestOrder();
    button.hidden = !order;
    if (!order) return;
    const count = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    button.textContent = language() === 'te'
      ? `↻ గత ఆర్డర్ మళ్లీ చేయండి · ${count} వంటకాలు`
      : `↻ Order last items again · ${count} items`;
  };

  button.addEventListener('click', () => {
    const order = latestOrder();
    if (!order) return;
    const cards = [...grid.querySelectorAll('.dish')];

    // Clear the current selection first so this is a true reorder, not a merge.
    cards.forEach(card => {
      const quantity = card.querySelector('.qty-value');
      const minus = card.querySelector('.qty-button[data-step="-1"]');
      while (Number(quantity?.textContent || 0) > 0) minus?.click();
    });

    document.querySelector('.menu-see-all')?.click();
    order.items.forEach(item => {
      const index = Number(item.sku) - 1;
      const card = Number.isInteger(index) && index >= 0 ? cards[index] : cards.find(candidate => candidate.querySelector('.dish-title h3')?.textContent.trim() === item.name);
      if (!card) return;
      const portion = card.querySelector('.portion-select');
      if (portion && portion.options.length > 1) {
        portion.selectedIndex = item.variant === 'full' ? 1 : 0;
        portion.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const plus = card.querySelector('.qty-button[data-step="1"]');
      for (let quantity = 0; quantity < Math.min(99, Number(item.quantity) || 0); quantity++) plus?.click();
    });
    document.getElementById('orderSummary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('languageToggle')?.addEventListener('click', refresh);
  window.addEventListener('rr:order-added', refresh);
  window.addEventListener('rr:order-cloud-saved', refresh);
  window.addEventListener('rr:local-orders-changed', refresh);
  window.addEventListener('storage', event => { if (event.key === ORDERS_KEY) refresh(); });
  refresh();
})();
