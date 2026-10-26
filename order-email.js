(() => {
  const link = document.getElementById('sendWhatsApp');
  const form = document.getElementById('checkoutForm');
  const receipt = document.getElementById('orderReceipt');
  if (!link || !form || !receipt) return;

  const email = 'ruchiragam@gmail.com';
  const setEmailAction = () => {
    if (link.textContent.trim() !== email) link.textContent = email;
    link.setAttribute('aria-label', `Email order to ${email}`);
    link.removeAttribute('target');
    link.removeAttribute('rel');
  };
  const updateMailto = () => {
    link.href = `mailto:${email}?subject=${encodeURIComponent('Ruchi Raagam order')}&body=${encodeURIComponent(receipt.textContent)}`;
  };

  setEmailAction();
  form.addEventListener('submit', updateMailto);
  new MutationObserver(setEmailAction).observe(link, { childList: true, characterData: true, subtree: true });
})();
