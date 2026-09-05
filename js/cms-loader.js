/* ================================================
   cms-loader.js | CLS Website
   Fetches and renders CMS JSON content dynamically
   ================================================ */

/* --- Configuration & Utilities --- */

/**
 * Normalises a CMS media path for use from a page at the site root.
 * The CMS stores public paths with a leading slash; the pages link relatively.
 * @param {string} path - The raw path from a JSON record
 * @returns {string} - The path without its leading slash
 */
const assetPath = (path) => {
  const p = path || '';
  return p.startsWith('/') ? p.substring(1) : p;
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
    const imgSrc = assetPath(slide.image);
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
 * Renders one post card into a grid container.
 * Shared by the blog, Meraki and Crescent Line listings, which differ only in
 * their URL prefix and their fallback strings.
 * @param {HTMLElement} container - The grid element to append to
 * @param {object} post - A single post record
 * @param {object} opts - { urlPrefix, imageAlt, defaultAuthor }
 * @returns {void}
 */
const appendPostCard = (container, post, opts) => {
  const slug = post.slug || generateSlug(post.title);
  const dateObj = new Date(post.date);
  const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const imgSrc = assetPath(post.thumbnail);
  const plainText = getMarkdownText(post.body || '');

  const card = document.createElement('a');
  card.className = 'card blog-card fade-up';
  card.href = `${opts.urlPrefix}/${slug}`;
  card.style.textDecoration = 'none';
  card.style.color = 'inherit';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'card-img-wrap';

  const thumbImg = document.createElement('img');
  thumbImg.src = imgSrc;
  thumbImg.alt = post.title || opts.imageAlt;
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
  authorSpan.textContent = `— ${post.author || opts.defaultAuthor}`;
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
};

/**
 * Sorts posts newest-first and renders them as cards into a grid container.
 * @param {HTMLElement} container - The grid element
 * @param {Array} posts - The posts to render
 * @param {object} opts - { urlPrefix, imageAlt, defaultAuthor }
 * @returns {Array} - The posts, sorted newest-first
 */
const renderPostGrid = (container, posts, opts) => {
  const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (container) {
    container.innerHTML = '';
    sortedPosts.forEach((post) => appendPostCard(container, post, opts));
  }
  return sortedPosts;
};

/**
 * Renders the blog posts grid container.
 * @param {HTMLElement} container - The blog grid element
 * @param {object} data - The validated blog database
 * @returns {void}
 */
const renderBlogGrid = (container, data) => {
  renderPostGrid(container, data.posts, {
    urlPrefix: '/blog',
    imageAlt: 'Blog thumbnail',
    defaultAuthor: 'Anonymous'
  });
};

/**
 * Renders the members list in the grid layout.
 * @param {HTMLElement} container - The members grid element
 * @param {object} data - The members listing data
 * @param {string} [teamFilter] - When set, only members whose `team` matches are shown
 * @returns {void}
 */
const renderMembersGrid = (container, data, teamFilter) => {
  if (!container) return;
  container.innerHTML = '';
  const members = (teamFilter ? data.members.filter(m => m.team === teamFilter) : data.members)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (members.length === 0) {
    showEmpty(container);
    return;
  }

  members.forEach((member, i) => {
    const delayClass = i % 3 === 1 ? 'delay-1' : (i % 3 === 2 ? 'delay-2' : '');
    const imgSrc = assetPath(member.image);

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
  const sortedPosts = renderPostGrid(gridContainer, data.posts, {
    urlPrefix: '/meraki',
    imageAlt: 'Issue cover',
    defaultAuthor: 'Editorial Board'
  });

  if (previewContainer && sortedPosts.length > 0) {
    const latest = sortedPosts[0];
    const imgSrc = assetPath(latest.thumbnail);
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
  renderPostGrid(container, data.posts, {
    urlPrefix: '/crescent-line',
    imageAlt: 'Newsletter cover',
    defaultAuthor: 'Dean'
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
 * Renders the Obverse archive grid (same card pattern as Blog/Meraki/Crescent Line).
 * @param {HTMLElement} container - The Obverse grid element
 * @param {object} data - The Obverse articles data
 * @returns {void}
 */
const renderObverseGrid = (container, data) => {
  if (!container) return;
  container.innerHTML = '';
  const sortedPosts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedPosts.forEach((post) => {
    const slug = post.slug || generateSlug(post.title);
    const postUrl = `/obverse/${slug}`;
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
    thumbImg.alt = post.title || 'Obverse cover';
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
    authorSpan.textContent = `— ${post.author || 'CLS'}`;
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
 * Renders the homepage "Recent Updates" feed — the newest items across every
 * publication category (Blog, Meraki, Obverse, Crescent Line), most recent first.
 * @param {HTMLElement} container - The recent-updates grid element
 * @param {{label: string, urlPrefix: string, data: object}[]} sources - One entry per category
 * @returns {void}
 */
const renderRecentUpdates = (container, sources) => {
  if (!container) return;

  const merged = sources.flatMap(({ label, urlPrefix, data }) =>
    (data.posts || []).map((post) => ({ ...post, _category: label, _urlPrefix: urlPrefix }))
  );

  if (merged.length === 0) {
    showEmpty(container);
    return;
  }

  const recent = merged
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  container.innerHTML = '';
  recent.forEach((post) => {
    const slug = post.slug || generateSlug(post.title);
    const postUrl = `/${post._urlPrefix}/${slug}`;
    const dateStr = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    let imgSrc = post.thumbnail || '';
    if (imgSrc.startsWith('/')) imgSrc = imgSrc.substring(1);

    const card = document.createElement('a');
    card.className = 'card blog-card fade-up';
    card.href = postUrl;
    card.style.textDecoration = 'none';
    card.style.color = 'inherit';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-img-wrap';
    const thumbImg = document.createElement('img');
    thumbImg.src = imgSrc;
    thumbImg.alt = post.title || 'Update thumbnail';
    thumbImg.className = 'card-img';
    thumbImg.loading = 'lazy';
    thumbImg.width = 360;
    thumbImg.height = 200;
    imgWrap.appendChild(thumbImg);
    card.appendChild(imgWrap);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-body';

    const metaRow = document.createElement('div');
    metaRow.style.display = 'flex';
    metaRow.style.gap = '0.6rem';
    metaRow.style.alignItems = 'center';
    metaRow.style.marginBottom = '0.5rem';

    const badge = document.createElement('span');
    badge.className = 'update-badge';
    badge.textContent = post._category;
    metaRow.appendChild(badge);

    const dateSpan = document.createElement('span');
    dateSpan.className = 'eyebrow';
    dateSpan.style.marginBottom = '0';
    dateSpan.textContent = dateStr;
    metaRow.appendChild(dateSpan);

    contentDiv.appendChild(metaRow);

    const titleH4 = document.createElement('h4');
    titleH4.textContent = post.title;
    contentDiv.appendChild(titleH4);

    contentDiv.appendChild(document.createElement('div')).outerHTML =
      '<span class="card-link" style="margin-top:auto; padding-top:1rem;">View <span aria-hidden="true">→</span></span>';

    card.appendChild(contentDiv);
    container.appendChild(card);
  });
};

/**
 * Renders a wing's own content grid (stories/poems, event write-ups, results, highlights),
 * filtered from the shared Wing Entries collection.
 * @param {HTMLElement} container - The wing-entries grid element
 * @param {string} wing - The wing slug (e.g. "writers-guild")
 * @param {object} data - The Wing Entries data
 * @returns {void}
 */
const renderWingEntries = (container, wing, data) => {
  if (!container) return;
  const entries = (data.entries || [])
    .filter((e) => e.wing === wing)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (entries.length === 0) {
    showEmpty(container);
    return;
  }

  container.innerHTML = '';
  entries.forEach((entry) => {
    let imgSrc = entry.thumbnail || '';
    if (imgSrc.startsWith('/')) imgSrc = imgSrc.substring(1);
    const dateStr = entry.date
      ? new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';

    const card = document.createElement('div');
    card.className = 'card blog-card fade-up';

    if (imgSrc) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'card-img-wrap';
      const thumbImg = document.createElement('img');
      thumbImg.src = imgSrc;
      thumbImg.alt = entry.title || 'Entry thumbnail';
      thumbImg.className = 'card-img';
      thumbImg.loading = 'lazy';
      thumbImg.width = 360;
      thumbImg.height = 200;
      imgWrap.appendChild(thumbImg);
      card.appendChild(imgWrap);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-body';

    if (dateStr) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'eyebrow';
      dateSpan.style.marginBottom = '0.5rem';
      dateSpan.textContent = dateStr;
      contentDiv.appendChild(dateSpan);
    }

    const titleH4 = document.createElement('h4');
    titleH4.textContent = entry.title;
    contentDiv.appendChild(titleH4);

    const bodyP = document.createElement('p');
    bodyP.textContent = entry.entryType === 'story-poem'
      ? `${getMarkdownText(entry.body || '').substring(0, 150)}...`
      : (entry.body || '');
    contentDiv.appendChild(bodyP);

    if (entry.author) {
      const authorSpan = document.createElement('span');
      authorSpan.style.fontSize = '0.85rem';
      authorSpan.style.opacity = '0.8';
      authorSpan.textContent = `— ${entry.author}`;
      contentDiv.appendChild(authorSpan);
    }

    card.appendChild(contentDiv);
    container.appendChild(card);
  });
};

/**
 * Renders the Crescent Line QR panel — generates a QR code client-side from the
 * CMS-managed destination URL so editors can update it without touching code.
 * @param {HTMLCanvasElement} canvas - The QR canvas element
 * @param {HTMLElement} captionEl - The caption paragraph element
 * @param {HTMLAnchorElement} linkEl - The plain-text fallback link element
 * @param {object} data - The Crescent Line settings data
 * @returns {void}
 */
const renderQrPanel = (canvas, captionEl, linkEl, data) => {
  const url = data.qrDestinationUrl;
  if (!url) return;

  if (canvas && typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, url, { width: 192, margin: 1 }, (err) => {
      if (err) canvas.replaceWith(document.createTextNode('QR code unavailable.'));
    });
  }
  if (captionEl) captionEl.textContent = data.qrCaption || 'Scan to read the latest Crescent Line issue on the college site.';
  if (linkEl) {
    linkEl.href = url;
    linkEl.textContent = url;
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
    heroBg.style.backgroundImage = `url('${assetPath(data.heroBanner)}')`;
  }
  if (data.outingPhoto && data.outingPhoto.trim() !== '' && outingImg) {
    outingImg.src = assetPath(data.outingPhoto);
  }
};

/* --- Main Controller --- */

document.addEventListener("DOMContentLoaded", async () => {
  // Select DOM targets
  const carouselContainer = document.getElementById('hero-carousel');
  const blogContainer = document.getElementById('blog-grid');
  const membersContainer = document.getElementById('members-grid');
  const coordinatorsContainer = document.getElementById('coordinators-grid');
  const merakiContainer = document.getElementById('meraki-grid');
  const latestMagazinePreview = document.getElementById('latest-magazine-preview');
  const clContainer = document.getElementById('crescent-line-grid');
  const obverseGridContainer = document.getElementById('obverse-grid');
  const recentUpdatesContainer = document.getElementById('recent-updates-grid');
  const wingEntriesContainer = document.getElementById('wing-entries-grid');
  const qrCanvas = document.getElementById('qr-canvas');
  const qrCaptionEl = document.getElementById('qr-caption');
  const qrLinkEl = document.getElementById('qr-fallback-link');
  const aboutHeroBg = document.querySelector('#about-hero .page-hero-bg');
  const aboutOutingImg = document.querySelector('section img[alt*="Outing"]');

  // Insert skeletons before starting requests
  showSkeletons(blogContainer);
  showSkeletons(membersContainer);
  showSkeletons(coordinatorsContainer);
  showSkeletons(merakiContainer);
  showSkeletons(clContainer);
  showSkeletons(obverseGridContainer);
  showSkeletons(recentUpdatesContainer);
  showSkeletons(wingEntriesContainer);

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

  // Members Task — teamFilter comes from a `data-team-filter` attribute so the
  // same grid can show everyone (About) or one team (Editorial Board / a wing).
  if (membersContainer) {
    fetchTasks.push({
      url: `data/members.json?t=${Date.now()}`,
      container: membersContainer,
      validate: (data) => data && Array.isArray(data.members),
      render: (data) => renderMembersGrid(membersContainer, data, membersContainer.dataset.teamFilter)
    });
  }

  // Wing Coordinators Task — a second, independently-filtered members grid
  // that can appear alongside the wing-entries grid on a wing page.
  if (coordinatorsContainer) {
    fetchTasks.push({
      url: `data/members.json?t=${Date.now()}`,
      container: coordinatorsContainer,
      validate: (data) => data && Array.isArray(data.members),
      render: (data) => renderMembersGrid(coordinatorsContainer, data, coordinatorsContainer.dataset.teamFilter)
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

  // Obverse Archive Grid Task
  if (obverseGridContainer) {
    fetchTasks.push({
      url: `data/obverse.json?t=${Date.now()}`,
      container: obverseGridContainer,
      validate: (data) => data && Array.isArray(data.posts),
      render: (data) => {
        if (data.posts.length === 0) {
          showEmpty(obverseGridContainer);
        } else {
          renderObverseGrid(obverseGridContainer, data);
        }
      }
    });
  }

  // Wing Entries Task — filtered by the container's `data-wing` attribute
  if (wingEntriesContainer) {
    const wing = wingEntriesContainer.dataset.wing;
    fetchTasks.push({
      url: `data/wing-entries.json?t=${Date.now()}`,
      container: wingEntriesContainer,
      validate: (data) => data && Array.isArray(data.entries),
      render: (data) => renderWingEntries(wingEntriesContainer, wing, data)
    });
  }

  // Crescent Line QR Panel Task
  if (qrCanvas) {
    fetchTasks.push({
      url: `data/crescent-line-settings.json?t=${Date.now()}`,
      container: null,
      validate: (data) => data && typeof data.qrDestinationUrl === 'string',
      render: (data) => renderQrPanel(qrCanvas, qrCaptionEl, qrLinkEl, data)
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

  // Recent Updates Task — merges Blog/Meraki/Obverse/Crescent Line, so it fetches
  // its own copies of those four files rather than threading data through the
  // single-URL fetchTasks shape above.
  const recentUpdatesPromise = (async () => {
    if (!recentUpdatesContainer) return;
    const sourceFiles = [
      { label: 'Blog', urlPrefix: 'blog', file: 'data/blog.json' },
      { label: 'Meraki', urlPrefix: 'meraki', file: 'data/meraki.json' },
      { label: 'Obverse', urlPrefix: 'obverse', file: 'data/obverse.json' },
      { label: 'Crescent Line', urlPrefix: 'crescent-line', file: 'data/crescent-line.json' },
    ];
    const settled = await Promise.allSettled(sourceFiles.map(async (source) => {
      const response = await fetch(`${source.file}?t=${Date.now()}`);
      if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.posts)) throw new Error('JSON response validation failed');
      return { ...source, data };
    }));
    const results = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (results.length === 0) {
      showError(recentUpdatesContainer);
    } else {
      renderRecentUpdates(recentUpdatesContainer, results);
    }
  })();

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
      if (task.onError) {
        task.onError();
      } else if (task.container) {
        showError(task.container);
      }
    }
  });

  await Promise.allSettled([...promises, recentUpdatesPromise]);

  // Content is injected, trigger animations re-observation
  reObserveFadeElements();
});
