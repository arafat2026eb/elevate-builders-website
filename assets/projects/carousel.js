/**
 * Elevate Builders — Project Card Swipeable Image Carousel
 * Lightweight, accessible, native CSS scroll-snap carousel controller.
 */
document.addEventListener('DOMContentLoaded', () => {
  const data = window.PROJECTS_DATA || {};
  const carousels = document.querySelectorAll('.project-carousel');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  carousels.forEach((container, cardIdx) => {
    const projectId = container.getAttribute('data-project-id');
    const project = data[projectId];
    if (!project || !project.images || project.images.length === 0) return;

    const images = project.images;
    const isSingle = images.length <= 1;
    const isFirstViewport = cardIdx < 3; // Eager load cards 1, 2, 3 in first viewport

    // 1. Build Track & Slides
    const track = document.createElement('div');
    track.className = 'carousel-track flex w-full h-full overflow-x-auto snap-x snap-mandatory focus:outline-none';
    track.style.scrollSnapType = 'x mandatory';
    track.style.scrollbarWidth = 'none';
    track.style.msOverflowStyle = 'none';
    track.setAttribute('tabindex', '0');
    track.setAttribute('role', 'region');
    track.setAttribute('aria-label', 'Photos of ' + project.name);

    images.forEach((imgData, imgIdx) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide min-w-full w-full h-full flex-shrink-0 snap-start snap-always relative overflow-hidden bg-surface-container-highest';
      
      const img = document.createElement('img');
      img.src = imgData.src;
      img.alt = imgData.alt || (project.name + ' photo ' + (imgIdx + 1));
      img.width = imgData.width || 800;
      img.height = imgData.height || 600;
      img.className = 'w-full h-full object-cover object-center select-none';
      
      // Loading strategy
      if (isFirstViewport && imgIdx === 0) {
        img.loading = 'eager';
        img.decoding = 'sync';
      } else {
        img.loading = 'lazy';
        img.decoding = 'async';
      }

      slide.appendChild(img);
      track.appendChild(slide);
    });

    container.appendChild(track);

    // If single image, skip arrows and counter as specified
    if (isSingle) return;

    // 2. Position Indicator Counter
    const counter = document.createElement('div');
    counter.className = 'carousel-counter absolute top-3 right-3 pointer-events-none z-10 px-2 py-0.5 bg-surface/90 text-primary-container border border-tertiary-fixed font-mono text-label-sm uppercase tracking-wider backdrop-blur-sm';
    counter.textContent = '1 / ' + images.length;
    container.appendChild(counter);

    // 3. Navigation Arrows
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'carousel-btn prev-btn absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-surface/90 text-primary-container border border-tertiary-fixed rounded-none hover:bg-primary-container hover:text-on-primary transition-all duration-200 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-20 disabled:pointer-events-none cursor-pointer';
    prevBtn.setAttribute('aria-label', 'Previous photo of ' + project.name);
    prevBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] pointer-events-none">chevron_left</span>';
    prevBtn.disabled = true;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'carousel-btn next-btn absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-surface/90 text-primary-container border border-tertiary-fixed rounded-none hover:bg-primary-container hover:text-on-primary transition-all duration-200 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-20 disabled:pointer-events-none cursor-pointer';
    nextBtn.setAttribute('aria-label', 'Next photo of ' + project.name);
    nextBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] pointer-events-none">chevron_right</span>';

    container.appendChild(prevBtn);
    container.appendChild(nextBtn);

    // 4. Scroll Logic
    function getSlideIndex() {
      const scrollPos = track.scrollLeft;
      const slideWidth = track.clientWidth || 1;
      return Math.round(scrollPos / slideWidth);
    }

    function updateState() {
      const idx = Math.max(0, Math.min(getSlideIndex(), images.length - 1));
      counter.textContent = (idx + 1) + ' / ' + images.length;
      prevBtn.disabled = (idx === 0);
      nextBtn.disabled = (idx === images.length - 1);
    }

    function scrollToIndex(targetIdx) {
      const clamped = Math.max(0, Math.min(targetIdx, images.length - 1));
      const targetLeft = clamped * track.clientWidth;
      track.scrollTo({ left: targetLeft, behavior: scrollBehavior });
    }

    // Scroll listener with RAF debouncing
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateState();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Click handlers
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = getSlideIndex();
      scrollToIndex(current - 1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = getSlideIndex();
      scrollToIndex(current + 1);
    });

    // Keyboard navigation on focused track
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const current = getSlideIndex();
        scrollToIndex(current - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const current = getSlideIndex();
        scrollToIndex(current + 1);
      }
    });

    // Initial state check
    updateState();
  });
});

