/* ================================================
   pillnav.js | CLS Website

   Vanilla port of the React Bits "PillNav" component
   (https://reactbits.dev/components/pill-nav, JS-CSS variant).

   The hover-circle geometry, GSAP timelines, logo spin, initial
   load animation and mobile popover motion are ported 1:1 from
   PillNav.jsx. React, react-router-dom and JSX are dropped —
   the markup is authored directly in each page instead.

   Added on top of upstream, because the CLS nav needs them:
     - dropdown panels (hover on desktop, tap-to-expand on mobile)
     - a right-hand slot holding the mobile menu button

   Requires: gsap 3.13 (loaded from cdnjs before this file).
   ================================================ */

(function () {
  'use strict';

  const container = document.querySelector('.pill-nav-container');
  if (!container || typeof gsap === 'undefined') return;

  /* --- Upstream props, as module constants --- */
  const ease = 'power3.easeOut';
  const initialLoadAnimation = true;
  const MOBILE_BREAKPOINT = 960;

  const navItemsEl = container.querySelector('.pill-nav-items');
  const logoEl     = container.querySelector('.pill-logo');
  const logoImgEl  = container.querySelector('.pill-logo img');
  const hamburger  = container.querySelector('.mobile-menu-button');
  const mobileMenu = container.querySelector('.mobile-menu-popover');
  const circles    = Array.from(container.querySelectorAll('.pill .hover-circle'));

  const tls = [];
  const activeTweens = [];
  let logoTween = null;
  let isMobileMenuOpen = false;

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  /* --- Layout: size each hover circle and build its timeline ---
     Ported verbatim from PillNav.jsx `layout()`. */
  const layout = () => {
    circles.forEach((circle) => {
      if (!circle || !circle.parentElement) return;

      const pill = circle.parentElement;
      const rect = pill.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (!w || !h) return;

      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${originY}px`
      });

      const label = pill.querySelector('.pill-label');
      const white = pill.querySelector('.pill-label-hover');

      if (label) gsap.set(label, { y: 0 });
      if (white) gsap.set(white, { y: h + 12, opacity: 0 });

      const index = circles.indexOf(circle);
      if (index === -1) return;

      if (tls[index]) tls[index].kill();
      const tl = gsap.timeline({ paused: true });

      tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

      if (label) {
        tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
      }

      if (white) {
        gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
        tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
      }

      tls[index] = tl;
    });
  };

  const handleEnter = (i) => {
    const tl = tls[i];
    if (!tl) return;
    if (activeTweens[i]) activeTweens[i].kill();
    activeTweens[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' });
  };

  const handleLeave = (i) => {
    const tl = tls[i];
    if (!tl) return;
    if (activeTweens[i]) activeTweens[i].kill();
    activeTweens[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' });
  };

  const handleLogoEnter = () => {
    if (!logoImgEl) return;
    if (logoTween) logoTween.kill();
    gsap.set(logoImgEl, { rotate: 0 });
    logoTween = gsap.to(logoImgEl, { rotate: 360, duration: 0.2, ease, overwrite: 'auto' });
  };

  /* --- Bind pill hovers --- */
  circles.forEach((circle, i) => {
    const pill = circle.parentElement;
    if (!pill) return;
    pill.addEventListener('mouseenter', () => handleEnter(i));
    pill.addEventListener('mouseleave', () => handleLeave(i));
  });

  if (logoEl) {
    logoEl.addEventListener('mouseenter', handleLogoEnter);
  }

  /* --- Mobile popover ---------------------------------- */
  const setMobileMenu = (open) => {
    isMobileMenuOpen = open;

    if (hamburger) {
      hamburger.setAttribute('aria-expanded', String(open));
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (lines.length >= 2) {
        if (open) {
          gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
          gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
        } else {
          gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
          gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
        }
      }
    }

    if (mobileMenu) {
      if (open) {
        gsap.set(mobileMenu, { visibility: 'visible' });
        gsap.fromTo(
          mobileMenu,
          { opacity: 0, y: 10, scaleY: 1 },
          { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: 'top center' }
        );
      } else {
        gsap.to(mobileMenu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => gsap.set(mobileMenu, { visibility: 'hidden' })
        });
      }
    }

    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      setMobileMenu(!isMobileMenuOpen);
    });
  }

  /* Leaf links close the menu; group toggles expand in place.
     Upstream has no nested groups, so this part is CLS-specific. */
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMobileMenu(false));
    });

    mobileMenu.querySelectorAll('.mobile-menu-group > .mobile-menu-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.parentElement;
        const open = group.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  document.addEventListener('click', (e) => {
    if (!isMobileMenuOpen) return;
    if (mobileMenu && mobileMenu.contains(e.target)) return;
    if (hamburger && hamburger.contains(e.target)) return;
    setMobileMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isMobileMenuOpen) setMobileMenu(false);
    container.querySelectorAll('.has-dropdown.is-open')
      .forEach((d) => d.classList.remove('is-open'));
  });

  /* --- Desktop dropdowns ------------------------------- */
  /* CSS drives the hover state; JS only handles keyboard opening
     and makes sure a parent pill is not followed while its panel
     is being opened by keyboard. */
  container.querySelectorAll('.has-dropdown').forEach((group) => {
    const trigger = group.querySelector(':scope > .pill');
    if (!trigger) return;

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        group.classList.add('is-open');
        const first = group.querySelector('.pill-dropdown a');
        if (first) first.focus();
      }
    });

    group.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!group.contains(document.activeElement)) {
          group.classList.remove('is-open');
        }
      }, 0);
    });
  });

  /* --- Initial layout + load animation ------------------ */
  layout();

  window.addEventListener('resize', layout);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layout).catch(() => {});
  }

  if (mobileMenu) {
    gsap.set(mobileMenu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
  }

  if (initialLoadAnimation) {
    if (logoEl) {
      gsap.set(logoEl, { scale: 0 });
      gsap.to(logoEl, { scale: 1, duration: 0.6, ease });
    }

    if (navItemsEl && !isMobile()) {
      gsap.set(navItemsEl, { width: 0, overflow: 'hidden' });
      gsap.to(navItemsEl, {
        width: 'auto',
        duration: 0.6,
        ease,
        onComplete: () => gsap.set(navItemsEl, { clearProps: 'width,overflow' })
      });
    }
  }
})();
