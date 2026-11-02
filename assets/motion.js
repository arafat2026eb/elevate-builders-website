/**
 * Elevate Builders — Precision Architectural Motion Engine
 * Delivers institutional smoothness, scroll-linked progress, number ticker animations,
 * subtle photography parallax, back-to-top navigation, staggered reveals, and kinetic mobile menu.
 */

(function () {
  'use strict';

  // 1. Inject or initialize Top Reading Progress Bar
  function initProgressBar() {
    let bar = document.getElementById('scroll-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scroll-progress-bar';
      document.body.prepend(bar);
    }

    let ticking = false;
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
            bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // 2. Floating Back-to-Top Action Button
  function initBackToTop() {
    let btn = document.getElementById('back-to-top-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'back-to-top-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Return to top of page');
      btn.className = 'group';
      btn.innerHTML = '<svg class="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
      document.body.appendChild(btn);
    }

    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 380) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      },
      { passive: true }
    );

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 3. Scroll Reveal Intersection Observer with Stagger Support
  function initScrollReveal() {
    // Automatically prepare "What We Do" rows if on Home page
    const whatWeDoRows = document.querySelectorAll('.what-we-do-row');
    whatWeDoRows.forEach((row, i) => {
      if (!row.classList.contains('reveal')) {
        row.classList.add('reveal', `stagger-${i + 1}`);
      }
    });

    // Automatically attach .reveal to architectural cards, section headers, and grid items if not already added
    const candidates = document.querySelectorAll(
      'main section, article.project-card, .grid > div, .spec-card, .prose p, dl > div'
    );

    candidates.forEach((el) => {
      if (
        !el.classList.contains('reveal') &&
        !el.classList.contains('reveal-left') &&
        !el.classList.contains('reveal-right') &&
        !el.classList.contains('reveal-scale') &&
        !el.classList.contains('reveal-fade')
      ) {
        if (
          el.tagName === 'SECTION' ||
          el.classList.contains('project-card') ||
          el.classList.contains('architectural-card') ||
          el.classList.contains('border')
        ) {
          el.classList.add('reveal');
          const parent = el.parentElement;
          if (parent && parent.classList.contains('grid')) {
            const siblingIndex = Array.prototype.indexOf.call(parent.children, el);
            const staggerNum = (siblingIndex % 6) + 1;
            el.classList.add(`stagger-${staggerNum}`);
          }
        }
      }
    });

    const revealElements = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade, .what-we-do-row'
    );

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '0px 0px -50px 0px',
          threshold: 0.08
        }
      );

      revealElements.forEach(el => observer.observe(el));
    } else {
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  }

  // 4. Subtle Parallax for Large Architectural Photography Plates
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const plates = document.querySelectorAll('.image-plate img, [data-parallax]');
    if (plates.length === 0) return;

    let ticking = false;
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            const winH = window.innerHeight;
            plates.forEach(img => {
              const rect = img.parentElement.getBoundingClientRect();
              if (rect.top < winH && rect.bottom > 0) {
                const center = (rect.top + rect.height / 2) - winH / 2;
                const offset = (center / winH) * 14; // subtle 14px shift
                img.style.transform = `scale(1.04) translateY(${offset.toFixed(1)}px)`;
              }
            });
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // 5. Smooth Numerical Metric Counters
  function initStatCounters() {
    const statElements = document.querySelectorAll(
      '.font-headline-md, .font-headline-lg, .font-headline-sm, [data-counter]'
    );

    const eligible = [];
    statElements.forEach(el => {
      const text = el.textContent.trim();
      const match = text.match(/^([0-9,]+)(\+?)$/);
      if (match && !el.dataset.counterInitialized) {
        const rawNum = parseInt(match[1].replace(/,/g, ''), 10);
        if (!isNaN(rawNum) && rawNum > 5 && rawNum < 1000000000) {
          el.dataset.counterInitialized = 'true';
          el.dataset.targetValue = rawNum;
          el.dataset.suffix = match[2] || '';
          eligible.push(el);
        }
      }
    });

    if (eligible.length === 0 || !('IntersectionObserver' in window)) return;

    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    eligible.forEach(el => counterObserver.observe(el));

    function animateCount(el) {
      const target = parseInt(el.dataset.targetValue, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1500;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
        const currentVal = Math.floor(ease * target);

        el.textContent = currentVal.toLocaleString('en-US') + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target.toLocaleString('en-US') + suffix;
        }
      }

      requestAnimationFrame(update);
    }
  }

  // 6. Dynamic Header Elevation on Scroll
  function initHeaderElevation() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 20) {
          header.classList.add('shadow-sm');
          header.style.borderBottomColor = 'rgba(108, 92, 62, 0.35)'; // Desert Sand hairline
        } else {
          header.classList.remove('shadow-sm');
          header.style.borderBottomColor = '';
        }
      },
      { passive: true }
    );
  }

  // 7. Button & Interactive Micro-Kinetics
  function initKineticDetails() {
    const buttons = document.querySelectorAll(
      'a[href="/contact"], button[type="submit"], .filter-btn'
    );
    buttons.forEach(b => {
      if (!b.classList.contains('header-cta-btn') && !b.classList.contains('btn-elevate')) {
        b.classList.add('btn-elevate');
      }
    });

    const imgHolders = document.querySelectorAll('.aspect-\\[16\\/10\\], .aspect-\\[4\\/3\\], .h-\\[360px\\]');
    imgHolders.forEach(h => {
      if (!h.classList.contains('image-plate')) {
        h.classList.add('image-plate');
      }
    });
  }

  // 8. Mobile Navigation Toggle & Drawer Controller
  function initMobileNavigation() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    // Ensure initial state: strictly hidden by default
    menu.classList.add('hidden');
    btn.classList.remove('is-active');
    btn.setAttribute('aria-expanded', 'false');

    // Inject 3-bar hamburger architecture if not already present
    if (!btn.querySelector('.nav-icon-bar')) {
      btn.innerHTML = `
        <span class="nav-icon-bar"></span>
        <span class="nav-icon-bar"></span>
        <span class="nav-icon-bar"></span>
      `;
    }

    function closeMenu() {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.add('hidden');
    }

    function openMenu() {
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
      menu.classList.remove('hidden');
    }

    function toggleMenu(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (menu.classList.contains('hidden')) {
        openMenu();
      } else {
        closeMenu();
      }
    }

    // Attach click and touch handling
    btn.onclick = toggleMenu;

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('hidden') && !btn.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
        closeMenu();
        btn.focus();
      }
    });

    // Close when tapping any link inside
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Close on window resize to desktop breakpoint
    window.addEventListener(
      'resize',
      function () {
        if (window.innerWidth >= 768 && !menu.classList.contains('hidden')) {
          closeMenu();
        }
      },
      { passive: true }
    );
  }

  // Non-critical background kinetic modules deferred to idle time
  function scheduleNonCritical() {
    initProgressBar();
    initBackToTop();
    initScrollReveal();
    initParallax();
    initStatCounters();
    initHeaderElevation();
    initKineticDetails();
  }

  // Initialize critical modules immediately, defer heavy observers to idle
  function initAll() {
    initMobileNavigation();
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(scheduleNonCritical, { timeout: 1200 });
    } else {
      setTimeout(scheduleNonCritical, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
