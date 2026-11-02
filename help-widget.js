(() => {
  const launcher = document.getElementById('helpLauncher');
  const panel = document.getElementById('helpPanel');
  const close = document.getElementById('helpClose');
  if (!launcher || !panel) return;

  const setOpen = open => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('summary')?.focus({ preventScroll: true });
    else launcher.focus({ preventScroll: true });
  };
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close?.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (!panel.hidden && !event.target.closest('#helpWidget')) setOpen(false);
  });

  const refreshLanguage = () => {
    const key = document.documentElement.lang === 'te' ? 'te' : 'en';
    panel.querySelectorAll('[data-en][data-te]').forEach(element => {
      element.textContent = element.dataset[key];
    });
    launcher.querySelector('[data-en][data-te]').textContent = launcher.querySelector('[data-en][data-te]').dataset[key];
  };
  new MutationObserver(refreshLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
