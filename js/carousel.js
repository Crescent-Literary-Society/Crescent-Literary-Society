/* ================================================
   carousel.js | CLS Website
   Accessible infinite slide timer with dot navigations
   ================================================ */

/* --- Configuration & Initialization --- */

/**
 * Initializes the homepage / wing hero carousel.
 * Sets up accessibility properties, dynamic dot indicators, and automatic timers.
 * @returns {void}
 */
window.initHeroCarousel = () => {
  const carousel = document.getElementById("hero-carousel");
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".main-hero-bg");
  if (slides.length <= 1) return;

  // Clear existing timer if any
  if (window.heroCarouselInterval) {
    clearInterval(window.heroCarouselInterval);
  }

  // Clear existing dots if any to prevent duplicates during re-renders
  const existingDots = carousel.querySelector(".hero-carousel-dots");
  if (existingDots) {
    existingDots.remove();
  }

  let currentSlide = 0;
  const slideInterval = 5000;
  let timer = null;

  // Set accessibility parameters
  carousel.setAttribute("aria-live", "polite");

  // Create dot indicators container
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "hero-carousel-dots";
  dotsContainer.setAttribute("role", "tablist");
  dotsContainer.setAttribute("aria-label", "Slide Navigation");

  const dots = [];

  /**
   * Transitions to a specific slide index.
   * @param {number} nextIndex - The destination slide index
   * @returns {void}
   */
  const goToSlide = (nextIndex) => {
    slides[currentSlide].classList.remove("active");
    dots[currentSlide].classList.remove("active");
    dots[currentSlide].setAttribute("aria-selected", "false");

    currentSlide = (nextIndex + slides.length) % slides.length;

    slides[currentSlide].classList.add("active");
    dots[currentSlide].classList.add("active");
    dots[currentSlide].setAttribute("aria-selected", "true");
  };

  /**
   * Advances the carousel to the next slide.
   * @returns {void}
   */
  const nextSlide = () => {
    goToSlide(currentSlide + 1);
  };

  /**
   * Starts the slide-advancing timer.
   * @returns {void}
   */
  const startTimer = () => {
    clearInterval(timer);
    timer = setInterval(nextSlide, slideInterval);
    window.heroCarouselInterval = timer;
  };

  /**
   * Pauses the active timer.
   * @returns {void}
   */
  const pauseTimer = () => {
    clearInterval(timer);
  };

  // Build dots dynamically based on slide count
  slides.forEach((_, idx) => {
    const dotBtn = document.createElement("button");
    dotBtn.className = idx === 0 ? "hero-carousel-dot active" : "hero-carousel-dot";
    dotBtn.setAttribute("role", "tab");
    dotBtn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    dotBtn.setAttribute("aria-label", `Slide ${idx + 1}`);
    dotBtn.setAttribute("type", "button");

    dotBtn.addEventListener("click", () => {
      goToSlide(idx);
      startTimer(); // Reset interval timer upon manual user selection
    });

    dotsContainer.appendChild(dotBtn);
    dots.push(dotBtn);
  });

  carousel.appendChild(dotsContainer);

  // Set up hover-to-pause listeners
  carousel.addEventListener("mouseenter", pauseTimer);
  carousel.addEventListener("mouseleave", startTimer);

  // Clean up timers on unload to prevent browser memory leaks
  window.addEventListener("beforeunload", () => {
    clearInterval(timer);
  });

  // Launch initial slide timer
  startTimer();
};

// Auto-run if DOM loaded and not loaded dynamically via cms-loader
document.addEventListener("DOMContentLoaded", () => {
  // If carousel is hardcoded (i.e. already has multiple slides in the raw markup on load)
  // or is not being populated via API, execute immediately.
  const carousel = document.getElementById("hero-carousel");
  if (carousel && carousel.querySelectorAll(".main-hero-bg").length > 1) {
    window.initHeroCarousel();
  }
});
