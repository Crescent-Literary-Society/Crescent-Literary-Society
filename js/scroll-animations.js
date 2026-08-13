/* =========================================================
   SCROLL-ANIMATIONS.JS — Crescent Literary Society
   IntersectionObserver for .fade-up elements with stagger
   ========================================================= */

(function () {
  'use strict';

  /* ---- Check for IntersectionObserver support ---- */
  if (!('IntersectionObserver' in window)) {
    // Fallback: make everything visible immediately
    document.querySelectorAll('.fade-up').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  /* ---- Observer config ---- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  window.scrollObserver = observer;

  /* ---- Observe all .fade-up elements already in DOM ---- */
  const observeAll = () => {
    document.querySelectorAll('.fade-up').forEach((el) => {
      observer.observe(el);
    });

    /* ---- Stagger: apply delay to children of .stagger containers ---- */
    document.querySelectorAll('.stagger').forEach((container) => {
      Array.from(container.children).forEach((child, i) => {
        if (!child.classList.contains('fade-up')) {
          child.classList.add('fade-up');
        }
        child.style.transitionDelay = `${i * 80}ms`;
        observer.observe(child);
      });
    });
  };

  /* Run after DOM is fully ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAll);
  } else {
    observeAll();
  }
})();
