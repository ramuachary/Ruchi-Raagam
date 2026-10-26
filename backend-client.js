(() => {
  const config = window.RUCHI_RAAGAM_SUPABASE;
  const isReady = config?.url?.startsWith('https://') &&
    !config.url.includes('YOUR_PROJECT_REF') &&
    config.publishableKey && !config.publishableKey.includes('YOUR_SUPABASE_');

  window.rrSupabaseReady = (async () => {
    if (!isReady) return null;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const client = createClient(config.url, config.publishableKey, {
      global: { fetch: (input, init = {}) => fetch(input, { ...init, keepalive: true }) },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  })().catch(error => {
    console.error('Shared order backend could not start:', error);
    return null;
  });
})();
