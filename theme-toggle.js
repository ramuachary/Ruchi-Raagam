(() => {
  const button = document.getElementById('themeToggle');
  if (!button) return;
  const key = 'ruchi-raagam-site-theme';
  const apply = theme => {
    const dark = theme === 'dark';
    document.body.dataset.theme = dark ? 'dark' : 'light';
    button.textContent = dark ? '☀' : '☾';
    const telugu = document.documentElement.lang === 'te';
    button.setAttribute('aria-label', telugu ? (dark ? 'లైట్ థీమ్‌కు మార్చండి' : 'డార్క్ థీమ్‌కు మార్చండి') : (dark ? 'Switch to light theme' : 'Switch to dark theme'));
    button.title = telugu ? (dark ? 'లైట్ థీమ్' : 'డార్క్ థీమ్') : (dark ? 'Light theme' : 'Dark theme');
    button.setAttribute('aria-pressed', String(dark));
    try { localStorage.setItem(key, dark ? 'dark' : 'light'); } catch { /* Theme choice can be temporary if storage is unavailable. */ }
  };
  let saved = 'light';
  try { saved = localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; } catch { /* Use light theme by default. */ }
  apply(saved);
  button.addEventListener('click', () => apply(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
  document.getElementById('languageToggle')?.addEventListener('click', () => setTimeout(() => apply(document.body.dataset.theme), 0));
})();
