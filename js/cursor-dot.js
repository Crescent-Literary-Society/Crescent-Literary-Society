/* ================================================
   cursor-dot.js | CLS Website
   A red dot that trails the cursor across the hero,
   standing in for the native cursor while it's there.
   Vanilla port of Skiper 61's "Mouse follow with spring";
   the reference's spring is overdamped (ratio ~1.38), so
   gsap.quickTo with a power3 ease reads the same and
   costs three lines instead of an integrator.
   Requires: gsap 3.13 (loaded from cdnjs before this file).
   ================================================ */

/**
 * Starts the hero cursor dot, or leaves the native cursor
 * alone when the effect would be unwanted or unusable.
 * @returns {void}
 */
window.initHeroCursorDot = () => {
  const hero = document.getElementById('hero');
  const dot = document.getElementById('hero-cursor-dot');
  if (!hero || !dot) return;

  /* Needs a fine pointer to follow. Below that the dot stays
     hidden, .has-cursor-dot is never set, and no listeners or
     tweens are ever bound. */
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (coarse || reduced || typeof gsap === 'undefined') return;

  hero.classList.add('has-cursor-dot');

  const SPRING = { duration: 0.5, ease: 'power3' };
  const xTo = gsap.quickTo(dot, 'x', SPRING);
  const yTo = gsap.quickTo(dot, 'y', SPRING);

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    xTo(e.clientX - rect.left);
    yTo(e.clientY - rect.top);
  });

  hero.addEventListener('pointerenter', (e) => {
    /* Land on the entry point rather than sweeping in from 0,0. */
    const rect = hero.getBoundingClientRect();
    gsap.set(dot, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    gsap.to(dot, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
  });

  hero.addEventListener('pointerleave', () => {
    gsap.to(dot, { opacity: 0, scale: 0, duration: 0.3, ease: 'power2.out' });
  });

  /* The real cursor is hidden and can't show its pointer state,
     so the dot swells over the CTA instead. */
  const cta = hero.querySelector('.hero-cta a');
  if (cta) {
    cta.addEventListener('pointerenter', () => {
      gsap.to(dot, { scale: 2.4, opacity: 0.7, duration: 0.3, ease: 'power2.out' });
    });
    cta.addEventListener('pointerleave', () => {
      gsap.to(dot, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' });
    });
  }
};

document.addEventListener('DOMContentLoaded', window.initHeroCursorDot);
