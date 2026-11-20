(() => {
  const TABLE = 'menu_item_availability';
  const rows = new Map();
  const listeners = new Set();
  let ready;

  const publish = data => {
    (data || []).forEach(row => rows.set(Number(row.sku), { available: row.is_available !== false, name: row.item_name || `Item ${row.sku}` }));
    listeners.forEach(listener => listener(new Map(rows)));
  };
  const load = () => {
    if (!ready) ready = (async () => {
      const client = await window.rrSupabaseReady;
      if (!client) return false;
      const { data, error } = await client.from(TABLE).select('sku,item_name,is_available');
      if (error) { console.warn('Menu availability is not set up yet:', error.message); return false; }
      publish(data);
      return true;
    })();
    return ready;
  };
  const set = async (sku, available) => {
    const client = await window.rrSupabaseReady;
    if (!client) throw new Error('Supabase connection is unavailable.');
    const current = rows.get(Number(sku));
    if (!current) throw new Error('Menu item was not found. Run the menu availability SQL first.');
    const { data, error } = await client.from(TABLE).upsert({ sku: Number(sku), item_name: current.name, is_available: Boolean(available), updated_at: new Date().toISOString() }, { onConflict: 'sku' }).select('sku,item_name,is_available').single();
    if (error) throw error;
    publish([data]);
    return data;
  };
  const subscribe = listener => { listeners.add(listener); listener(new Map(rows)); return () => listeners.delete(listener); };

  window.rrMenuAvailability = { load, set, subscribe, get: sku => rows.get(Number(sku)) };

  const updateWebsiteCards = () => {
    document.querySelectorAll('#menu .dish').forEach((card, index) => {
      const sku = index + 1;
      const status = rows.get(sku);
      if (!status) return;
      const soldOut = !status.available;
      card.classList.toggle('is-out-of-stock', soldOut);
      const image = card.querySelector('.dish-img');
      let badge = image.querySelector('.stock-status');
      if (!badge) { badge = document.createElement('span'); badge.className = 'stock-status'; image.append(badge); }
      badge.textContent = soldOut ? (document.documentElement.lang === 'te' ? 'స్టాక్ లేదు' : 'Out of stock') : '';
      badge.hidden = !soldOut;
      if (soldOut) {
        const count = Number(card.querySelector('.qty-value')?.textContent || 0);
        const remove = card.querySelector('.qty-button[data-step="-1"]');
        for (let n = 0; n < count && remove; n += 1) remove.click();
      }
      card.querySelectorAll('.qty-button,.portion-select').forEach(control => { control.disabled = soldOut; });
    });
  };

  if (document.getElementById('menu')) {
    load().then(() => updateWebsiteCards());
    subscribe(updateWebsiteCards);
    const clientReady = window.rrSupabaseReady;
    clientReady?.then(client => {
      if (!client) return;
      client.channel('menu-availability-live').on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, payload => {
        if (payload.new?.sku) publish([payload.new]);
        else { ready = null; load(); }
      }).subscribe();
    });
    document.getElementById('languageToggle')?.addEventListener('click', () => setTimeout(updateWebsiteCards, 0));
  }
})();
