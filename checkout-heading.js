(() => {
  const heading = document.querySelector('.checkout-copy h3');
  const menu = document.querySelector('.menu-grid');
  if (!heading || !menu) return;

  const updateHeading = () => {
    const selected = [...document.querySelectorAll('.dish')].filter(card => Number(card.querySelector('.qty-value')?.textContent || 0) > 0);
    const isTelugu = document.documentElement.lang === 'te';
    if (isTelugu) {
      heading.textContent = selected.length === 1
        ? `మీ ${selected[0].querySelector('.dish-title h3').textContent.trim()} ఆర్డర్‌కు డెలివరీ వివరాలు.`
        : 'మీ ఆర్డర్‌కు డెలివరీ వివరాలు.';
      return;
    }
    heading.textContent = selected.length === 1
      ? `Get your ${selected[0].querySelector('.dish-title h3').textContent.trim()} delivered.`
      : 'Get your order delivered.';
  };

  menu.addEventListener('click', event => { if (event.target.closest('.qty-button')) updateHeading(); });
  menu.addEventListener('change', event => { if (event.target.matches('.portion-select')) updateHeading(); });
  document.getElementById('checkoutOpen')?.addEventListener('click', updateHeading);
  document.getElementById('languageToggle')?.addEventListener('click', updateHeading);
  updateHeading();
})();
