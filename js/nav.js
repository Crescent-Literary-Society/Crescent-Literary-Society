/* =========================================================
   NAV.JS — Crescent Literary Society
   Sticky nav scroll effect, active page, hash smooth scroll.

   The hamburger, dropdown and mobile-menu behaviour moved to
   pillnav.js, which owns that markup and its GSAP motion.
   ========================================================= */

(function () {
  'use strict';

  const nav = document.getElementById('main-nav');

  /* ---- Scroll: add .scrolled class to nav ---- */
  const hero = document.querySelector('.page-hero, .hero-carousel, .main-hero');

  /* Pages with a hero let the transparent bar sit on the image, so the
     nav forces light text there. */
  if (nav && hero) {
    nav.classList.add('over-hero');
  }

  const handleScroll = () => {
    // If there's a hero element, fade in after passing most of it. Otherwise, use 100px.
    const threshold = hero ? (hero.offsetHeight - 90) : 100;

    if (window.scrollY > threshold) {
      nav && nav.classList.add('scrolled');
    } else {
      nav && nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run on load

  /* ---- Active page highlighting ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.pill-list > li > .pill').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('/').pop().split('#')[0];

    if (
      linkPage === currentPage ||
      (currentPage === '' && linkPage === 'index.html')
    ) {
      link.classList.add('is-active');
      // the active dot lives on the <li>; .pill is overflow-clipped
      if (link.parentElement) link.parentElement.classList.add('has-active');
    }
  });

  document.querySelectorAll('.mobile-menu-list a.mobile-menu-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('/').pop().split('#')[0];

    if (
      linkPage === currentPage ||
      (currentPage === '' && linkPage === 'index.html')
    ) {
      link.classList.add('is-active');
    }
  });

  /* ---- Smooth Scroll for Hash Links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return; // Skip empty hash

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();

        const headerOffset = 10;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
})();
