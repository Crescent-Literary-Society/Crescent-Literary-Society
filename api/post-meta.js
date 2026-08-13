const fs = require('fs');
const path = require('path');

/**
 * Vercel Serverless Function: /api/post-meta
 *
 * Intercepts clean-URL post requests (/blog/:slug, /meraki/:slug, /crescent-line/:slug),
 * looks up the post in JSON data, and injects correct OG meta tags into post.html
 * so WhatsApp/Telegram/social crawlers show the right preview.
 *
 * Also injects a tiny <script> that exposes source + slug as query parameters
 * so the existing client-side JS in post.html works without any modifications.
 *
 * Fallback behaviour: if anything fails, serve post.html as-is — never break the page.
 */

const SITE_ORIGIN = 'https://crescentliterarysociety.vercel.app';

// Map source keys to their JSON data files
const SOURCE_MAP = {
  blog:            'data/blog.json',
  meraki:          'data/meraki.json',
  'crescent-line': 'data/crescent-line.json',
  obverse:         'data/obverse.json',
};

/**
 * Generates a URL-safe slug from a title string.
 * Mirrors the exact logic used in cms-loader.js and post.html.
 */
function generateSlug(title) {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Reads the raw post.html file from disk.
 * In Vercel serverless, the project root is available at process.cwd().
 */
function readPostHTML() {
  const filePath = path.join(process.cwd(), 'post.html');
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Reads and parses a JSON data file. Returns null on any failure.
 */
function readJSONFile(relativePath) {
  try {
    const filePath = path.join(process.cwd(), relativePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Tries to find a post by slug:
 *  1. First checks for an individual file at /data/{source}/{slug}.json
 *  2. Falls back to the main array file and searches by slug field or generated slug
 */
function findPost(source, slug) {
  if (!slug || !source) return null;

  // Attempt 1: individual file (e.g. /data/blog/my-slug.json)
  const individualPath = `data/${source}/${slug}.json`;
  const individual = readJSONFile(individualPath);
  if (individual) {
    // Individual file might be the post object directly or wrapped in { post: ... }
    return individual.post || individual;
  }

  // Attempt 2: main array file
  const arrayFile = SOURCE_MAP[source];
  if (!arrayFile) return null;

  const data = readJSONFile(arrayFile);
  if (!data || !Array.isArray(data.posts)) return null;

  return data.posts.find(
    (p) => (p.slug || generateSlug(p.title)) === slug
  ) || null;
}

/**
 * Makes an image path into a full absolute HTTPS URL.
 */
function absoluteImageUrl(imgPath) {
  if (!imgPath) return `${SITE_ORIGIN}/assets/logo/logo.jpg`;
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  // Normalise leading slash
  const cleaned = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
  return `${SITE_ORIGIN}${cleaned}`;
}

/**
 * Escapes a string for safe insertion into HTML attribute values.
 */
function escapeAttr(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Injects post-specific meta tags into the raw post.html string.
 * Uses simple string replacement on the known generic tag patterns.
 */
function injectMeta(html, post, source, slug) {
  const title = post.title || 'Untitled';
  const safeTitle = escapeAttr(title);
  const description = `Read ${title} on Crescent Literary Society.`;
  const safeDesc = escapeAttr(description);
  const imageUrl = absoluteImageUrl(post.thumbnail || post.image);
  const canonicalUrl = `${SITE_ORIGIN}/${source}/${slug}`;

  // Replace <title>
  html = html.replace(
    /<title[^>]*>.*<\/title>/,
    `<title>${safeTitle} | Crescent Literary Society</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"[^>]*\/?\s*>/,
    `<meta name="description" content="${safeDesc}"/>`
  );

  // Replace OG tags — match by property name regardless of id attributes
  html = html.replace(
    /<meta\s+property="og:type"[^>]*\/?\s*>/,
    `<meta property="og:type" content="article" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"[^>]*\/?\s*>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*\/?\s*>/,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"[^>]*\/?\s*>/,
    `<meta property="og:image" content="${escapeAttr(imageUrl)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"[^>]*\/?\s*>/,
    `<meta property="og:url" content="${escapeAttr(canonicalUrl)}" />`
  );

  // Replace canonical link
  html = html.replace(
    /<link\s+rel="canonical"[^>]*\/?\s*>/,
    `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`
  );

  // Inject additional meta tags that don't exist in the original HTML
  // (og:site_name, twitter cards) — insert right after the og:url tag
  const additionalTags = [
    `<meta property="og:site_name" content="Crescent Literary Society" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<meta name="twitter:image" content="${escapeAttr(imageUrl)}" />`,
  ].join('\n  ');

  // Insert after the canonical link tag
  html = html.replace(
    /(<link\s+rel="canonical"[^>]*\/?\s*>)/,
    `$1\n  ${additionalTags}`
  );

  return html;
}

/**
 * Injects a tiny inline <script> right after <head> that exposes source + slug
 * as query parameters. This way the existing client-side JS in post.html
 * (which reads window.location.search) works without any modifications.
 *
 * Uses history.replaceState to add ?source=...&slug=... to the URL
 * without changing the visible path in the address bar.
 */
function injectParamsScript(html, source, slug) {
  const safeSource = escapeAttr(source);
  const safeSlug = escapeAttr(slug);

  const script = `<script>
// Injected by /api/post-meta — expose source+slug as query params for client-side JS
(function(){
  var s = new URLSearchParams(window.location.search);
  if (!s.get('source') || !s.get('slug')) {
    s.set('source', '${safeSource}');
    s.set('slug', '${safeSlug}');
    history.replaceState(null, '', window.location.pathname + '?' + s.toString());
  }
})();
</script>`;

  // Insert immediately after <head> (before any other tags)
  html = html.replace(/<head>/, `<head>\n${script}`);

  return html;
}

module.exports = function handler(req, res) {
  try {
    const source = req.query.source || 'blog';
    const slug = req.query.slug || '';

    // Read the raw post.html
    let html;
    try {
      html = readPostHTML();
    } catch {
      // If post.html can't be read at all, return 500
      res.status(500).send('Internal server error');
      return;
    }

    // If no slug provided, serve post.html as-is (it will redirect to blog.html via its own JS)
    if (!slug) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
      return;
    }

    // Look up the post
    const post = findPost(source, slug);

    // If post found, inject OG meta tags
    if (post) {
      html = injectMeta(html, post, source, slug);
    }

    // Always inject the params script so client-side JS works with clean URLs
    html = injectParamsScript(html, source, slug);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).send(html);
  } catch {
    // Ultimate fallback — try to serve raw post.html, or a simple error
    try {
      const fallback = readPostHTML();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(fallback);
    } catch {
      res.status(500).send('Internal server error');
    }
  }
};
