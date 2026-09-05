/* ================================================
   gallery.js | CLS Website
   Turns vertical scroll into horizontal card travel.
   Sticky positioning is CSS — this only drives the x
   transform, so no ScrollTrigger pinning is involved.
   Requires: gsap 3.13 + ScrollTrigger, loaded before this file.
   ================================================ */

/**
 * Binds the gallery track to the scroll position of its container.
 * @returns {void}
 */
window.initGallery = () => {
  const container = document.getElementById('gallery-scroll');
  const track = document.getElementById('gallery-track');
  if (!container || !track) return;

  const wrapper = track.parentElement;

  /* CSS handles the reduced-motion layout; the tween has to be
     skipped separately, since a media query cannot stop GSAP. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* Same value as the reference's (items - 1) * (width + gap),
     but measured, so the 600px breakpoint needs no constants here. */
  const distance = () => track.scrollWidth - wrapper.offsetWidth;

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      invalidateOnRefresh: true
    }
  });

  /* Browsers restore the previous scroll offset after a reload, and
     that can land after ScrollTrigger has taken its measurements —
     leaving start/end shifted by the restored amount. Re-measure once
     everything has settled. */
  window.addEventListener('load', () => ScrollTrigger.refresh());
};

document.addEventListener('DOMContentLoaded', window.initGallery);
