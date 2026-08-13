/* =========================================================
   NAV.JS — Crescent Literary Society
   Sticky nav scroll effect, hamburger, dropdown, active page
   ========================================================= */

(function () {
  'use strict';

  const nav         = document.getElementById('main-nav');
  const hamburger   = document.getElementById('nav-hamburger');
  const navMenu     = document.getElementById('nav-menu');
  const dropParent  = document.querySelector('.has-dropdown');

  /* ---- Scroll: add .scrolled class to nav ---- */
  const handleScroll = () => {
    // If there's a hero element, fade in after passing most of it. Otherwise, use 100px.
    const hero = document.querySelector('.page-hero, .hero-carousel');
    const threshold = hero ? (hero.offsetHeight - 90) : 100;
    
    if (window.scrollY > threshold) {
      nav && nav.classList.add('scrolled');
    } else {
      nav && nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run on load

  /* ---- Hamburger toggle ---- */
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  /* ---- Mobile: dropdown parent click toggle ---- */
  const dropParents = document.querySelectorAll('.has-dropdown');
  dropParents.forEach(dropParent => {
    const parentLink = dropParent.querySelector(':scope > a');
    if (parentLink) {
      parentLink.addEventListener('click', (e) => {
        if (window.innerWidth <= 960) {
          e.preventDefault();
          dropParent.classList.toggle('is-open');
        }
      });
    }
  });

  /* ---- Close mobile nav on link click ---- */
  document.querySelectorAll('.nav-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 960) {
        navMenu  && navMenu.classList.remove('is-open');
        hamburger && hamburger.classList.remove('is-open');
        hamburger && hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });

  /* ---- Close mobile nav on outside click ---- */
  document.addEventListener('click', (e) => {
    if (
      navMenu &&
      navMenu.classList.contains('is-open') &&
      !navMenu.contains(e.target) &&
      e.target !== hamburger &&
      !hamburger.contains(e.target)
    ) {
      navMenu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ---- Active page highlighting ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-menu > li > a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('/').pop();

    if (
      linkPage === currentPage ||
      (currentPage === '' && linkPage === 'index.html')
    ) {
      link.classList.add('active');
    }
  });

  /* ---- Escape key closes mobile nav ---- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('is-open')) {
      navMenu.classList.remove('is-open');
      hamburger && hamburger.classList.remove('is-open');
      hamburger && hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
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
        
        // Close dropdowns if on mobile
        if (window.innerWidth <= 960) {
          document.querySelectorAll('.has-dropdown').forEach(d => d.classList.remove('is-open'));
          if (navMenu) navMenu.classList.remove('is-open');
          if (hamburger) hamburger.classList.remove('is-open');
          document.body.style.overflow = '';
        }

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
