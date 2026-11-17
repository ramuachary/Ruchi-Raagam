(() => {
  const reviews = document.querySelector('#reviews');
  if (!reviews || document.querySelector('#kitchenStory')) return;

  const section = document.createElement('section');
  section.className = 'kitchen-story';
  section.id = 'kitchenStory';
  section.setAttribute('aria-labelledby', 'kitchenStoryTitle');
  section.innerHTML = `
    <div class="wrap kitchen-story-grid">
      <div class="kitchen-story-art">
        <img src="./chef-cartoon.png" alt="Cartoon chef presenting a bowl of Andhra biryani in a warm kitchen" loading="lazy">
      </div>
      <div class="kitchen-story-copy">
        <div class="eyebrow" data-en="From our kitchen" data-te="మా వంటగది నుంచి">From our kitchen</div>
        <h2 id="kitchenStoryTitle" data-en="Andhra warmth, served fresh." data-te="ఆంధ్రా ఆత్మీయత, తాజాగా మీకోసం.">Andhra warmth, served fresh.</h2>
        <p data-en="Every plate is prepared with fragrant spices, fresh ingredients and the care of a home-cooked meal." data-te="ప్రతి వంటకాన్ని సువాసనగల మసాలాలు, తాజా పదార్థాలతో ఇంటి భోజనం లాంటి ఆప్యాయతతో తయారు చేస్తాం.">Every plate is prepared with fragrant spices, fresh ingredients and the care of a home-cooked meal.</p>
        <div class="kitchen-story-points">
          <span data-en="Freshly prepared" data-te="తాజాగా తయారీ">Freshly prepared</span>
          <span data-en="Andhra spices" data-te="ఆంధ్రా మసాలాలు">Andhra spices</span>
          <span data-en="Made with care" data-te="ఆప్యాయంగా వంట">Made with care</span>
        </div>
      </div>
    </div>`;
  reviews.before(section);

  const chefImage = section.querySelector('.kitchen-story-art img');
  chefImage.addEventListener('error', () => {
    if (chefImage.dataset.fallbackTried) return;
    chefImage.dataset.fallbackTried = 'true';
    chefImage.src = './assets/chef-cartoon.png';
  });

  const updateCopy = () => {
    const telugu = document.documentElement.lang === 'te';
    section.querySelectorAll('[data-en][data-te]').forEach((node) => {
      node.textContent = node.dataset[telugu ? 'te' : 'en'];
    });
  };
  updateCopy();
  new MutationObserver(updateCopy).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
