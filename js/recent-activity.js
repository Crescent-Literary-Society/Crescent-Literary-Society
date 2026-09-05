/* ================================================
   recent-activity.js | CLS Website
   Merges every published CMS collection into one
   newest-first strip, presented with the HoverExpand
   interaction: collapsed tiles that expand on hover,
   click or keyboard focus.

   Interaction adapted from Skiper UI — Skiper 52
   (HoverExpand_001) by @gurvinder-singh02, https://gxuri.me
   Free version requires attribution to Skiper UI.
   Ported from React + Framer Motion to vanilla JS/CSS.
   ================================================ */

/* Collections that represent published activity. Labels mirror
   post.html's sourceMap and prefixes mirror cms-loader.js's
   urlPrefix values, so this page inherits the existing source of
   truth instead of inventing its own names. */
const RA_SOURCES = [
  { key: 'blog',          file: 'data/blog.json',          label: 'Blog',             prefix: '/blog' },
  { key: 'meraki',        file: 'data/meraki.json',        label: 'Meraki Magazine',  prefix: '/meraki' },
  { key: 'crescent-line', file: 'data/crescent-line.json', label: 'Crescent Line',    prefix: '/crescent-line' },
  { key: 'obverse',       file: 'data/obverse.json',       label: 'Obverse Magazine', prefix: '/obverse' }
];

/* Opt-in sources, addressable by key via data-ra-sources but never
   part of the default set — Recent Activity defaults to RA_SOURCES,
   so adding here cannot change that page. `items` names the array
   key, `match` narrows the collection, and a source with no `prefix`
   has no article page, so its tiles are rendered as plain elements
   rather than links. */
const RA_EXTRA_SOURCES = [
  {
    key: 'story-writing',
    file: 'data/wing-entries.json',
    label: 'Story Writing',
    items: 'entries',
    match: (e) => e.wing === 'writers-guild' && e.entryType === 'story-poem'
  }
];

const RA_MAX_ITEMS = 8;

/**
 * Per-instance config, read off the row element. Every default is
 * the value this page used when it was the strip's only consumer,
 * so the Recent Activity page behaves exactly as before.
 * @param {HTMLElement} row - The .ra-row container.
 * @returns {object}
 */
const raConfig = (row) => {
  const d = row.dataset;
  const keys = d.raSources ? d.raSources.split(',').map((s) => s.trim()) : null;
  const known = RA_SOURCES.concat(RA_EXTRA_SOURCES);
  return {
    sources: keys
      ? keys.map((k) => known.find((s) => s.key === k)).filter(Boolean)
      : RA_SOURCES,
    max: d.raMax ? Number(d.raMax) : RA_MAX_ITEMS,
    statusId: d.raStatus || 'recent-activity-status',
    emptyText: d.raEmpty || 'No activity has been published yet. New posts will appear here automatically.',
    linkText: d.raLinkText || 'Browse the blog',
    linkHref: d.raLinkHref || 'blog.html'
  };
};

/* Same two helpers cms-loader.js uses. They are module-scope
   consts there, so they cannot be imported without changing CMS
   behaviour — copied rather than exported. */

/**
 * Strips the CMS's leading slash so paths resolve from any page.
 * @param {string} path - Stored media path.
 * @returns {string}
 */
const raAssetPath = (path) => {
  const p = path || '';
  return p.startsWith('/') ? p.substring(1) : p;
};

/**
 * Derives a URL-safe slug from a title.
 * @param {string} title - Post title.
 * @returns {string}
 */
const raGenerateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Formats a publish date the way the rest of the site does.
 * @param {string} value - ISO date string.
 * @returns {string}
 */
const raFormatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Fetches the configured collections and returns the newest posts
 * across them. A collection that is missing or malformed is
 * skipped rather than failing the page.
 * @param {object} cfg - Config from raConfig().
 * @returns {Promise<object[]>}
 */
const raLoadActivity = async (cfg) => {
  const results = await Promise.allSettled(
    cfg.sources.map((source) =>
      fetch(`${source.file}?t=${Date.now()}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
        .then((data) => {
          const list = data[source.items || 'posts'];
          return { source, posts: Array.isArray(list) ? list : [] };
        })
    )
  );

  const items = [];
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const { source, posts } = result.value;
    posts.forEach((post) => {
      if (!post || !post.title) return;
      /* Some sources hold more than one section's worth of entries. */
      if (source.match && !source.match(post)) return;
      items.push({
        title: post.title,
        date: post.date || '',
        author: post.author || '',
        thumbnail: post.thumbnail || '',
        slug: post.slug || raGenerateSlug(post.title),
        label: source.label,
        prefix: source.prefix || ''
      });
    });
  });

  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  return items.slice(0, cfg.max);
};

/**
 * Builds one tile. Posts without a cover get a typographic plate
 * rather than an empty frame — `thumbnail` is optional in the CMS.
 * @param {object} item - Normalised post.
 * @param {number} index - Position in the strip.
 * @returns {HTMLAnchorElement}
 */
const raBuildTile = (item, index) => {
  /* Sources without a prefix have no article page to open, so their
     tiles are plain elements. They stay keyboard-focusable so the
     expand interaction behaves the same either way. */
  const tile = document.createElement(item.prefix ? 'a' : 'div');
  tile.className = 'ra-item';
  if (item.prefix) {
    /* Same clean URL cms-loader builds and vercel.json rewrites. */
    tile.href = `${item.prefix}/${item.slug}`;
  } else {
    tile.tabIndex = 0;
  }
  tile.dataset.index = String(index);

  const media = document.createElement('div');
  media.className = 'ra-item-media';

  const imgSrc = raAssetPath(item.thumbnail);
  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = item.title;
    img.loading = 'lazy';
    media.appendChild(img);
  } else {
    /* Label only — the caption already carries the title, so
       repeating it here just doubles up on the expanded tile. */
    media.classList.add('is-placeholder');
    const plate = document.createElement('span');
    plate.className = 'ra-plate-label';
    plate.textContent = item.label;
    media.appendChild(plate);
  }
  tile.appendChild(media);

  const caption = document.createElement('div');
  caption.className = 'ra-item-caption';

  const meta = document.createElement('span');
  meta.className = 'ra-item-meta';
  const dateStr = raFormatDate(item.date);
  meta.textContent = dateStr ? `${item.label} · ${dateStr}` : item.label;

  const heading = document.createElement('h2');
  heading.className = 'ra-item-title';
  heading.textContent = item.title;

  caption.append(meta, heading);

  if (item.author) {
    const author = document.createElement('span');
    author.className = 'ra-item-author';
    author.textContent = `— ${item.author}`;
    caption.appendChild(author);
  }

  tile.appendChild(caption);
  return tile;
};

/**
 * Renders one strip and wires its expand interaction.
 * @param {HTMLElement} row - The .ra-row container.
 * @param {object} cfg - Config from raConfig().
 * @returns {Promise<void>}
 */
const raRenderRow = async (row, cfg) => {
  const status = document.getElementById(cfg.statusId);

  const showStatus = (message, linkText, linkHref) => {
    if (!status) return;
    status.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = message;
    status.appendChild(p);
    if (linkText) {
      const link = document.createElement('a');
      link.className = 'btn btn-gold';
      link.href = linkHref;
      link.textContent = linkText;
      status.appendChild(link);
    }
    status.hidden = false;
  };

  let items = [];
  try {
    items = await raLoadActivity(cfg);
  } catch {
    row.hidden = true;
    showStatus('Recent activity is unavailable right now. Please try again later.', cfg.linkText, cfg.linkHref);
    return;
  }

  row.innerHTML = '';

  if (items.length === 0) {
    row.hidden = true;
    showStatus(cfg.emptyText, cfg.linkText, cfg.linkHref);
    return;
  }

  if (status) status.hidden = true;
  row.hidden = false;

  const tiles = items.map((item, index) => {
    const tile = raBuildTile(item, index);
    row.appendChild(tile);
    return tile;
  });

  /* One tile open at a time — the reference's activeImage state.
     It defaults to the newest item rather than the reference's
     arbitrary index 1. */
  let activeIndex = 0;

  const setActive = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;
    tiles.forEach((tile, i) => tile.classList.toggle('is-active', i === index));
  };

  tiles.forEach((tile, index) => {
    tile.addEventListener('mouseenter', () => setActive(index));
    tile.addEventListener('focus', () => setActive(index));
    /* Tap expands first; a second tap on the open tile follows the
       link, which is what makes this usable on touch. */
    tile.addEventListener('click', (event) => {
      if (activeIndex !== index) {
        event.preventDefault();
        setActive(index);
      }
    });
  });

  tiles[0].classList.add('is-active');
  row.classList.add('is-ready');
};

/**
 * Renders every strip on the page. Each .ra-row carries its own
 * data-ra-* config, so one page can host more than one.
 * @returns {Promise<void>}
 */
window.initRecentActivity = async () => {
  const rows = document.querySelectorAll('.ra-row');
  await Promise.all([...rows].map((row) => raRenderRow(row, raConfig(row))));
};

document.addEventListener('DOMContentLoaded', window.initRecentActivity);
