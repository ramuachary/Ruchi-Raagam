(() => {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  const areaInput = form.elements.namedItem('landmark');
  const areaLabel = areaInput?.closest('label')?.querySelector('.field-label');
  if (!areaInput || !areaLabel) return;

  const setAreaCopy = () => {
    const telugu = document.documentElement.lang === 'te';
    areaLabel.textContent = telugu ? 'ప్రాంతం' : 'Area';
    areaInput.placeholder = telugu ? 'ప్రాంతం / కాలనీ, హైదరాబాద్' : 'Area / locality, Hyderabad';
    areaInput.setAttribute('aria-label', areaLabel.textContent);
    areaInput.autocomplete = 'address-level2';
    areaInput.required = true;
    areaInput.closest('label')?.querySelector('.optional')?.remove();
  };

  setAreaCopy();
  document.getElementById('languageToggle')?.addEventListener('click', () => window.setTimeout(setAreaCopy, 0));
  form.addEventListener('submit', () => window.setTimeout(() => {
    const receipt = document.getElementById('orderReceipt');
    if (receipt) receipt.textContent = receipt.textContent
      .replace('Landmark: ', 'Area: ')
      .replace('దగ్గరలోని గుర్తు: ', 'ప్రాంతం: ');
  }, 0));
})();
