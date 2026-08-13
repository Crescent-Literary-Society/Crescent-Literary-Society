/* ================================================
   cms-loader.js | CLS Website
   Fetches and renders CMS JSON content dynamically
   ================================================ */

/* --- Configuration & Utilities --- */

/**
 * Escapes plain text to prevent XSS injection.
 * @param {string} str - The raw text to escape
 * @returns {string} - The escaped HTML string
 */
const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
};

/**
 * Generates a clean URL-safe slug from a title string.
 * @param {string} title - The title of the post
 * @returns {string} - The generated slug
 */
const generateSlug = (title) => {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Safely extracts plain text from markdown string using textContent extraction.
 * @param {string} markdownStr - The raw markdown body text
 * @returns {string} - The plain text extraction
 */
const getMarkdownText = (markdownStr) => {
  if (typeof marked !== 'undefined' && marked.parse) {
    const temp = document.createElement('div');
    temp.innerHTML = marked.parse(markdownStr || '');
    return temp.textContent || '';
  }
  return (markdownStr || '').replace(/[#*_\[\]>]/g, '');
};

/**
 * Injects skeleton loaders into a list container before fetches start.
 * @param {HTMLElement} container - The DOM container element
 * @returns {void}
 */
const showSkeletons = (container) => {
  if (!container) return;
  container.innerHTML = `
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  `;
};

/**
 * Renders a clean, friendly error state in a container if fetching fails.
 * @param {HTMLElement} container - The DOM container element
 * @returns {void}
 */
const showError = (container) => {
  if (!container) return;
  container.innerHTML = '<p class="load-error">Content unavailable. Please try again later.</p>';
};

/**
 * Renders an empty state message in a container if no posts are returned.
 * @param {HTMLElement} container - The DOM container element
 * @returns {void}
 */
const showEmpty = (container) => {
  if (!container) return;
  container.innerHTML = '<p class="load-empty">No content published yet.</p>';
};

/**
 * Re-observes newly injected fade-up elements using the global IntersectionObserver.
 * @returns {void}
 */
const reObserveFadeElements = () => {
  if (window.scrollObserver) {
    document.querySelectorAll('.fade-up:not(.is-visible)')
      .forEach(el => window.scrollObserver.observe(el));
  }
};

/* --- Render Functions --- */

/**
 * Renders the hero carousel slides into the container.
 * @param {HTMLElement} container - The carousel DOM element
 * @param {object} data - The validated JSON carousel schema
 * @returns {void}
 */
const renderCarousel = (container, data) => {
  if (!container) return;
  container.innerHTML = '';
  data.slides.forEach((slide, index) => {
    const div = document.createElement('div');
    div.className = index === 0 ? 'main-hero-bg active' : 'main-hero-bg';
    let imgSrc = slide.image || '';
    if (imgSrc.startsWith('/')) {
      imgSrc = imgSrc.substring(1);
    }
    div.style.backgroundImage = `url('${imgSrc}')`;
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', slide.altText || `Slide ${index + 1}`);
    container.appendChild(div);
  });

  if (window.initHeroCarousel) {
    window.initHeroCarousel();
  }
};

/**
 * Renders the blog posts grid container.
 * @param {HTMLElement} container - The blog grid element
 * @param {object} data - The validated blog database
 * @returns {void}
 */
const renderBlogGrid = (container, data) => {
  if (!container) return;
  container.innerHTML = '';
  const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  sortedPosts.forEach((post) => {
    const slug = post.slug || generateSlug(post.title);
    const postUrl = `/blog/${slug}`;
    const dateObj = new Date(post.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    let imgSrc = post.thumbnail || '';
    if (imgSrc.startsWith('/')) {
      imgSrc = imgSrc.substring(1);
    }
    const plainText = getMarkdownText(post.body || '');

    const card = document.createElement('a');
    card.className = 'card blog-card fade-up';
    card.href = postUrl;
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-img-wrap';

    const thumbImg = document.createElement('img');
    thumbImg.src = imgSrc;
    thumbImg.alt = post.title || 'Blog thumbnail';
    thumbImg.className = 'card-img';
    thumbImg.loading = 'lazy';
    thumbImg.width = 360;
    thumbImg.height = 200;
    imgWrap.appendChild(thumbImg);
    card.appendChild(imgWrap);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-body';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'eyebrow';
    dateSpan.style.marginBottom = '0.5rem';
    dateSpan.textContent = dateStr;
    contentDiv.appendChild(dateSpan);

    const titleH3 = document.createElement('h4');
    titleH3.textContent = post.title;
    contentDiv.appendChild(titleH3);

    const previewP = document.createElement('p');
    previewP.textContent = `${plainText.substring(0, 150)}...`;
    contentDiv.appendChild(previewP);

    const authorDiv = document.createElement('div');
    authorDiv.style.marginTop = 'auto';
    authorDiv.style.paddingTop = '1rem';
    authorDiv.style.display = 'flex';
    authorDiv.style.justifyContent = 'space-between';
    authorDiv.style.alignItems = 'center';

    const authorSpan = document.createElement('span');
    authorSpan.textContent = `— ${post.author || 'Anonymous'}`;
    authorSpan.style.fontSize = '0.85rem';
    authorSpan.style.opacity = '0.8';
    authorDiv.appendChild(authorSpan);

    const readSpan = document.createElement('span');
    readSpan.className = 'card-link';
    readSpan.innerHTML = 'Read <span aria-hidden="true">→</span>';
    authorDiv.appendChild(readSpan);

    contentDiv.appendChild(authorDiv);
    card.appendChild(contentDiv);
    container.appendChild(card);
  });
};

/**
 * Renders the members list in the grid layout.
 * @param {HTMLElement} container - The members grid element
 * @param {object} data - The members listing data
 * @returns {void}
 */
const renderMembersGrid = (container, data) => {
  if (!container) return;
  container.innerHTML = '';
  data.members.forEach((member, i) => {
    const delayClass = i % 3 === 1 ? 'delay-1' : (i % 3 === 2 ? 'delay-2' : '');
    let imgSrc = member.image || '';
    if (imgSrc.startsWith('/')) {
      imgSrc = imgSrc.substring(1);
    }

    const card = document.createElement('div');
    card.className = `member-card fade-up ${delayClass}`.trim();

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = member.name || 'Member profile';
    img.loading = 'lazy';
    img.width = 150;
    img.height = 150;
    card.appendChild(img);

    const nameH4 = document.createElement('h4');
    nameH4.textContent = member.name;
    card.appendChild(nameH4);

    const roleSpan = document.createElement('span');
    roleSpan.className = 'member-role';
    roleSpan.textContent = member.role;
    card.appendChild(roleSpan);

    container.appendChild(card);
  });
};

/**
 * Renders the Meraki grid and latest preview panel.
 * @param {HTMLElement} gridContainer - The grid element
 * @param {HTMLElement} previewContainer - The preview header container
 * @param {object} data - The Meraki issues data
 * @returns {void}
 */
const renderMeraki = (gridContainer, previewContainer, data) => {
  const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (gridContainer) {
    gridContainer.innerHTML = '';
    sortedPosts.forEach((post) => {
      const slug = post.slug || generateSlug(post.title);
      const postUrl = `/meraki/${slug}`;
      const dateObj = new Date(post.date);
      const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      let imgSrc = post.thumbnail || '';
      if (imgSrc.startsWith('/')) {
        imgSrc = imgSrc.substring(1);
      }
      const plainText = getMarkdownText(post.body || '');

      const card = document.createElement('a');
      card.className = 'card blog-card fade-up';
      card.href = postUrl;
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';

      const imgWrap = document.createElement('div');
      imgWrap.className = 'card-img-wrap';

      const thumbImg = document.createElement('img');
      thumbImg.src = imgSrc;
      thumbImg.alt = post.title || 'Issue cover';
      thumbImg.className = 'card-img';
      thumbImg.loading = 'lazy';
      thumbImg.width = 360;
      thumbImg.height = 200;
      imgWrap.appendChild(thumbImg);
      card.appendChild(imgWrap);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'card-body';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'eyebrow';
      dateSpan.style.marginBottom = '0.5rem';
      dateSpan.textContent = dateStr;
      contentDiv.appendChild(dateSpan);

      const titleH3 = document.createElement('h4');
      titleH3.textContent = post.title;
      contentDiv.appendChild(titleH3);

      const previewP = document.createElement('p');
      previewP.textContent = `${plainText.substring(0, 150)}...`;
      contentDiv.appendChild(previewP);

      const authorDiv = document.createElement('div');
      authorDiv.style.marginTop = 'auto';
      authorDiv.style.paddingTop = '1rem';
      authorDiv.style.display = 'flex';
      authorDiv.style.justifyContent = 'space-between';
      authorDiv.style.alignItems = 'center';

      const authorSpan = document.createElement('span');
      authorSpan.textContent = `— ${post.author || 'Editorial Board'}`;
      authorSpan.style.fontSize = '0.85rem';
      authorSpan.style.opacity = '0.8';
      authorDiv.appendChild(authorSpan);

      const readSpan = document.createElement('span');
      readSpan.className = 'card-link';
      readSpan.innerHTML = 'Read <span aria-hidden="true">→</span>';
      authorDiv.appendChild(readSpan);

      contentDiv.appendChild(authorDiv);
      card.appendChild(contentDiv);
      gridContainer.appendChild(card);
    });
  }

  if (previewContainer && sortedPosts.length > 0) {
    const latest = sortedPosts[0];
    let imgSrc = latest.thumbnail || '';
    if (imgSrc.startsWith('/')) {
      imgSrc = imgSrc.substring(1);
    }
    const plainText = getMarkdownText(latest.body || '');

    previewContainer.innerHTML = '';
    previewContainer.style.display = 'flex';
    previewContainer.style.gap = '2rem';

    const imgWrap = document.createElement('div');
    imgWrap.style.flexShrink = '0';
    imgWrap.style.width = '90px';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = latest.title || 'Latest cover';
    img.style.width = '90px';
    img.style.borderRadius = '4px';
    img.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
    img.loading = 'lazy';
    img.width = 90;
    img.height = 130;
    imgWrap.appendChild(img);

    const descWrap = document.createElement('div');

    const eyebrowSpan = document.createElement('span');
    eyebrowSpan.className = 'eyebrow';
    eyebrowSpan.style.marginBottom = '0.4rem';
    eyebrowSpan.textContent = 'Latest Magazine Issue';
    descWrap.appendChild(eyebrowSpan);

    const titleH3 = document.createElement('h3');
    titleH3.style.fontSize = '1.4rem';
    titleH3.style.marginBottom = '0.5rem';
    titleH3.textContent = latest.title;
    descWrap.appendChild(titleH3);

    const textP = document.createElement('p');
    textP.style.fontSize = '0.95rem';
    textP.textContent = `${plainText.substring(0, 200)}...`;
    descWrap.appendChild(textP);

    const infoP = document.createElement('p');
    infoP.style.fontSize = '0.85rem';
    infoP.style.marginTop = '0.75rem';
    infoP.style.color = 'rgba(153,153,153,0.7)';
    infoP.textContent = `Published: ${new Date(latest.date).toLocaleDateString()} · By: ${latest.author || 'Editorial Board'}`;
    descWrap.appendChild(infoP);

    previewContainer.appendChild(imgWrap);
    previewContainer.appendChild(descWrap);
  }
};

/**
 * Renders the Crescent Line newsletter elements.
 * @param {HTMLElement} container - The newsletters grid element
 * @param {object} data - The newsletters listing database
 * @returns {void}
 */
const renderCrescentLine = (container, data) => {
  if (!container) return;
  container.innerHTML = '';
  const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedPosts.forEach((post) => {
    const slug = post.slug || generateSlug(post.title);
    const postUrl = `/crescent-line/${slug}`;
    const dateObj = new Date(post.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    let imgSrc = post.thumbnail || '';
    if (imgSrc.startsWith('/')) {
      imgSrc = imgSrc.substring(1);
    }
    const plainText = getMarkdownText(post.body || '');

    const card = document.createElement('a');
    card.className = 'card blog-card fade-up';
    card.href = postUrl;
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-img-wrap';

    const thumbImg = document.createElement('img');
    thumbImg.src = imgSrc;
    thumbImg.alt = post.title || 'Newsletter cover';
    thumbImg.className = 'card-img';
    thumbImg.loading = 'lazy';
    thumbImg.width = 360;
    thumbImg.height = 200;
    imgWrap.appendChild(thumbImg);
    card.appendChild(imgWrap);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-body';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'eyebrow';
    dateSpan.style.marginBottom = '0.5rem';
    dateSpan.textContent = dateStr;
    contentDiv.appendChild(dateSpan);

    const titleH3 = document.createElement('h4');
    titleH3.textContent = post.title;
    contentDiv.appendChild(titleH3);

    const previewP = document.createElement('p');
    previewP.textContent = `${plainText.substring(0, 150)}...`;
    contentDiv.appendChild(previewP);

    const authorDiv = document.createElement('div');
    authorDiv.style.marginTop = 'auto';
    authorDiv.style.paddingTop = '1rem';
    authorDiv.style.display = 'flex';
    authorDiv.style.justifyContent = 'space-between';
    authorDiv.style.alignItems = 'center';

    const authorSpan = document.createElement('span');
    authorSpan.textContent = `— ${post.author || 'Dean'}`;
    authorSpan.style.fontSize = '0.85rem';
    authorSpan.style.opacity = '0.8';
    authorDiv.appendChild(authorSpan);

    const readSpan = document.createElement('span');
    readSpan.className = 'card-link';
    readSpan.innerHTML = 'Read <span aria-hidden="true">→</span>';
    authorDiv.appendChild(readSpan);

    contentDiv.appendChild(authorDiv);
    card.appendChild(contentDiv);
    container.appendChild(card);
  });
};

/**
 * Renders the latest Obverse article into the homepage feature section.
 * Updates the title, blockquote, and description dynamically from CMS data.
 * @param {HTMLElement} container - The .obverse-content element
 * @param {object} data - The Obverse articles data
 * @returns {void}
 */
const renderObverse = (container, data) => {
  if (!container) return;
  const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortedPosts.length === 0) return;

  const latest = sortedPosts[0];
  const slug = latest.slug || generateSlug(latest.title);
  const postUrl = `/obverse/${slug}`;
  const plainText = getMarkdownText(latest.body || '');
  const excerpt = plainText.substring(0, 200);

  // Update the h3 title
  const titleEl = container.querySelector('h3');
  if (titleEl) titleEl.textContent = latest.title || 'Untitled';

  // Update the blockquote with a snippet
  const quoteEl = container.querySelector('blockquote');
  if (quoteEl) quoteEl.textContent = `"${excerpt}…"`;

  // Update the description paragraph
  const descP = container.querySelector('p');
  if (descP) descP.textContent = `By ${latest.author || 'CLS'} — Read this and more in Obverse, our flagship literary magazine.`;

  // Update the Read More link to point to the actual article
  const readBtn = container.parentElement ? container.parentElement.querySelector('#obverse-read-btn, .btn-gold') : null;
  if (readBtn) readBtn.href = postUrl;

  // Update the cover image if the article has a thumbnail
  if (latest.thumbnail) {
    const imgContainer = container.parentElement ? container.parentElement.querySelector('.obverse-img img') : null;
    if (imgContainer) {
      let imgSrc = latest.thumbnail;
      if (imgSrc.startsWith('/')) imgSrc = imgSrc.substring(1);
      imgContainer.src = imgSrc;
    }
  }
};

/**
 * Updates About page background banners and group photography.
 * @param {HTMLElement} heroBg - The page-hero container element
 * @param {HTMLImageElement} outingImg - The group outing image element
 * @param {object} data - The images catalog JSON
 * @returns {void}
 */
const renderAboutImages = (heroBg, outingImg, data) => {
  if (data.heroBanner && data.heroBanner.trim() !== '' && heroBg) {
    let src = data.heroBanner.startsWith('/') ? data.heroBanner.substring(1) : data.heroBanner;
    heroBg.style.backgroundImage = `url('${src}')`;
  }
  if (data.outingPhoto && data.outingPhoto.trim() !== '' && outingImg) {
    let src = data.outingPhoto.startsWith('/') ? data.outingPhoto.substring(1) : data.outingPhoto;
    outingImg.src = src;
  }
};

/* --- Main Controller --- */

document.addEventListener("DOMContentLoaded", async () => {
  // Select DOM targets
  const carouselContainer = document.getElementById('hero-carousel');
  const blogContainer = document.getElementById('blog-grid');
  const membersContainer = document.getElementById('members-grid');
  const merakiContainer = document.getElementById('meraki-grid');
  const latestMagazinePreview = document.getElementById('latest-magazine-preview');
  const clContainer = document.getElementById('crescent-line-grid');
  const aboutHeroBg = document.querySelector('#about-hero .page-hero-bg');
  const aboutOutingImg = document.querySelector('section img[alt*="Outing"]');

  // Insert skeletons before starting requests
  showSkeletons(blogContainer);
  showSkeletons(membersContainer);
  showSkeletons(merakiContainer);
  showSkeletons(clContainer);

  const fetchTasks = [];

  // Determine carousel path
  if (carouselContainer) {
    let carouselFile = 'data/carousel.json';
    const path = window.location.pathname;
    if (path.includes('house-of-debaters')) {
      carouselFile = 'data/debaters-carousel.json';
    } else if (path.includes('improv')) {
      carouselFile = 'data/improv-carousel.json';
    } else if (path.includes('writers-guild')) {
      carouselFile = 'data/writers-carousel.json';
    } else if (path.includes('quizzers-circuit')) {
      carouselFile = 'data/quizzers-carousel.json';
    } else if (path.includes('editorial-board')) {
      carouselFile = 'data/editorial-carousel.json';
    }

    fetchTasks.push({
      url: `${carouselFile}?t=${Date.now()}`,
      container: carouselContainer,
      validate: (data) => data && Array.isArray(data.slides),
      render: (data) => renderCarousel(carouselContainer, data)
    });
  }

  // Blog Task
  if (blogContainer) {
    fetchTasks.push({
      url: `data/blog.json?t=${Date.now()}`,
      container: blogContainer,
      validate: (data) => data && Array.isArray(data.posts),
      render: (data) => {
        if (data.posts.length === 0) {
          showEmpty(blogContainer);
        } else {
          renderBlogGrid(blogContainer, data);
        }
      }
    });
  }

  // Members Task
  if (membersContainer) {
    fetchTasks.push({
      url: `data/members.json?t=${Date.now()}`,
      container: membersContainer,
      validate: (data) => data && Array.isArray(data.members),
      render: (data) => {
        if (data.members.length === 0) {
          showEmpty(membersContainer);
        } else {
          renderMembersGrid(membersContainer, data);
        }
      }
    });
  }

  // Meraki / Writers Guild Task
  if (merakiContainer || latestMagazinePreview) {
    fetchTasks.push({
      url: `data/meraki.json?t=${Date.now()}`,
      container: merakiContainer || latestMagazinePreview,
      validate: (data) => data && Array.isArray(data.posts),
      render: (data) => {
        if (data.posts.length === 0) {
          if (merakiContainer) showEmpty(merakiContainer);
        } else {
          renderMeraki(merakiContainer, latestMagazinePreview, data);
        }
      }
    });
  }

  // Crescent Line Task
  if (clContainer) {
    fetchTasks.push({
      url: `data/crescent-line.json?t=${Date.now()}`,
      container: clContainer,
      validate: (data) => data && Array.isArray(data.posts),
      render: (data) => {
        if (data.posts.length === 0) {
          showEmpty(clContainer);
        } else {
          renderCrescentLine(clContainer, data);
        }
      }
    });
  }

  // Obverse Task — homepage feature section
  const obverseContent = document.querySelector('.obverse-content');
  if (obverseContent) {
    fetchTasks.push({
      url: `data/obverse.json?t=${Date.now()}`,
      container: null,
      validate: (data) => data && Array.isArray(data.posts),
      render: (data) => {
        if (data.posts.length > 0) {
          renderObverse(obverseContent, data);
        }
      }
    });
  }

  // About Images Task
  if (aboutHeroBg || aboutOutingImg) {
    fetchTasks.push({
      url: `data/about-images.json?t=${Date.now()}`,
      container: null,
      validate: (data) => data && (data.heroBanner !== undefined || data.outingPhoto !== undefined),
      render: (data) => renderAboutImages(aboutHeroBg, aboutOutingImg, data)
    });
  }

  // Wing Card Image Sync — pull first slide from each wing's carousel JSON
  // to keep homepage card thumbnails in sync with the CMS-managed hero images.
  const wingCards = document.querySelectorAll('[data-wing-carousel]');
  wingCards.forEach((card) => {
    const carouselFile = card.getAttribute('data-wing-carousel');
    if (!carouselFile) return;
    fetchTasks.push({
      url: `${carouselFile}?t=${Date.now()}`,
      container: null,
      validate: (data) => data && Array.isArray(data.slides) && data.slides.length > 0,
      render: (data) => {
        let imgSrc = data.slides[0].image;
        if (!imgSrc) return;
        if (imgSrc.startsWith('/')) imgSrc = imgSrc.substring(1);
        const imgEl = card.querySelector('.card-img');
        if (imgEl) {
          imgEl.src = imgSrc;
          if (data.slides[0].altText) {
            imgEl.alt = data.slides[0].altText;
          }
        }
      }
    });
  });

  // Execute all fetches in parallel using Promise.allSettled()
  const promises = fetchTasks.map(async (task) => {
    try {
      const response = await fetch(task.url);
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      const data = await response.json();
      if (!task.validate(data)) {
        throw new Error("JSON response validation failed");
      }
      task.render(data);
    } catch (err) {
      if (task.container) {
        showError(task.container);
      }
    }
  });

  await Promise.allSettled(promises);

  // Content is injected, trigger animations re-observation
  reObserveFadeElements();
});
