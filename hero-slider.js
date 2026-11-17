(() => {
  const hero = document.querySelector('.hero');
  const slideRoot = hero?.querySelector('.hero-slides');
  const pagination = hero?.querySelector('.hero-pagination');
  if (!hero || !slideRoot || !pagination || slideRoot.querySelector('.hero-slide')) return;

  const photos = [
    './andra-pulav-hero.png',
    './full-joint-biryani.jpg',
    './fried-piece-biryani.jpg',
    './chicken-dum-biryani.jpg'
  ];
  const slides = photos.map((src, index) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.setAttribute('aria-hidden', 'true');
    slideRoot.append(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-dot';
    dot.setAttribute('aria-label', 'Show food photo ' + (index + 1));
    dot.setAttribute('aria-current', 'false');
    pagination.append(dot);
    return { slide, dot, src, loaded: false, loading: false };
  });

  let activeSlide = 0;
  const loadSlide = item => {
    if (item.loaded || item.loading) return;
    item.loading = true;
    const image = new Image();
    image.onload = () => {
      item.slide.style.backgroundImage = 'url("' + image.src + '")';
      item.loaded = true;
      item.loading = false;
    };
    image.onerror = () => {
      if (!image.dataset.fallback) {
        image.dataset.fallback = 'true';
        image.src = './assets/' + item.src.split('/').pop();
      } else {
        item.loading = false;
      }
    };
    image.src = item.src;
  };

  const showSlide = index => {
    activeSlide = index;
    slides.forEach((item, i) => {
      const active = i === index;
      item.slide.classList.toggle('is-active', active);
      item.slide.setAttribute('aria-hidden', String(!active));
      item.dot.setAttribute('aria-current', String(active));
    });
    loadSlide(slides[index]);
    loadSlide(slides[(index + 1) % slides.length]);
  };

  slides.forEach((item, index) => item.dot.addEventListener('click', () => showSlide(index)));
  showSlide(0);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {
      if (!document.hidden) showSlide((activeSlide + 1) % slides.length);
    }, 4000);
  }
})();
