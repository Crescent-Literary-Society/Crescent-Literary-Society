/* about-carousel.js — Auto-advancing image carousel for the About section */
(function () {
  const slides = document.querySelectorAll('#about-carousel .about-slide');
  const dots   = document.querySelectorAll('#about-dots .about-dot');
  if (!slides.length) return;

  let current  = 0;
  let timer    = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, 4000);
  }

  // Dot click navigation
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index, 10));
      startTimer(); // reset timer on manual nav
    });
  });

  startTimer();
})();
