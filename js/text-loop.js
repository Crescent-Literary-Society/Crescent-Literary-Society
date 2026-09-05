/* ================================================
   text-loop.js | CLS Website
   Repeating text flowing along a wave-shaped path.
   Vanilla port of the React Bits <TextLoop> component —
   same path math, same seamless head/tail textPath loop.
   Requires: gsap 3.13 (loaded from cdnjs before this file).
   ================================================ */

/* --- Reference geometry (React Bits TextLoop, shape="wave") --- */
const VIEW_W = 1200;
const VIEW_H = 520;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;

/* --- Props baked in from the supplied configuration --- */
const TEXT = 'About us';
const SEPARATOR = '✦';
const SPEED = 90;          /* user units per second */
const CURVINESS = 90;
const RIBBON_WIDTH = 62;   /* geometry input only — nothing is painted */

/* The wave spans y = CY ± (a / 2) — a quadratic Bézier only reaches
   halfway to its control point — so the text sits well inside
   these crops. Narrowing the box on small screens zooms
   the type instead of shrinking it. */
const VIEWBOX_WIDE = '0 124 1200 272';
const VIEWBOX_NARROW = '260 118 680 284';
const NARROW_QUERY = '(max-width: 700px)';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Builds the wave path, exactly as the reference buildPath() does.
 * @returns {string} An SVG path `d` attribute.
 */
const buildWavePath = () => {
  const room = Math.max(20, CY - RIBBON_WIDTH / 2 - EDGE_PAD);
  const a = Math.min(CURVINESS * 2.2, room * 2);

  return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} ` +
         `T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
};

/**
 * Creates an SVG element with the given attributes.
 * @param {string} name - Tag name.
 * @param {object} attrs - Attributes to set.
 * @returns {SVGElement}
 */
const svgEl = (name, attrs = {}) => {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
};

/**
 * Builds the text loop and starts it inside the given container.
 * Safe to call more than once — it rebuilds from scratch.
 * @returns {void}
 */
window.initTextLoop = () => {
  const root = document.getElementById('about-text-loop');
  if (!root) return;

  /* One repetition: "ABOUT US" + nbsp + sparkle + nbsp */
  const unit = `${TEXT.toUpperCase()} ${SEPARATOR} `;
  const pathId = 'about-text-loop-path';

  root.innerHTML = '';

  const svg = svgEl('svg', {
    class: 'text-loop-svg',
    viewBox: window.matchMedia(NARROW_QUERY).matches ? VIEWBOX_NARROW : VIEWBOX_WIDE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': TEXT
  });

  const path = svgEl('path', {
    id: pathId,
    class: 'text-loop-path',
    d: buildWavePath()
  });
  svg.appendChild(path);

  /* Hidden single repetition, measured to work out how many fit. */
  const measure = svgEl('text', {
    class: 'text-loop-text text-loop-measure',
    'aria-hidden': 'true'
  });
  measure.textContent = unit;
  svg.appendChild(measure);

  /* Two identical runs of text — one trails the other by exactly the
     path length, so whichever leaves the path re-enters behind it. */
  const makeRun = () => {
    const text = svgEl('text', {
      class: 'text-loop-text',
      'dominant-baseline': 'central',
      'aria-hidden': 'true'
    });
    const textPath = svgEl('textPath', {
      startOffset: '0',
      lengthAdjust: 'spacing'
    });
    textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`);
    textPath.setAttribute('href', `#${pathId}`);
    text.appendChild(textPath);
    svg.appendChild(text);
    return textPath;
  };

  const head = makeRun();
  const tail = makeRun();

  root.appendChild(svg);

  let tween = null;

  /** Measures the path and text, then fills and animates the loop. */
  const layout = () => {
    let length = 0;
    let unitWidth = 0;

    try {
      length = path.getTotalLength();
      unitWidth = measure.getComputedTextLength();
    } catch {
      return;
    }
    if (!length) return;

    const reps = unitWidth > 0 ? Math.max(1, Math.round(length / unitWidth)) : 1;
    const loopText = unit.repeat(reps);

    [head, tail].forEach((textPath) => {
      textPath.textContent = loopText;
      /* Stretch the repetitions to exactly one path length so the
         string tiles without a seam at the wrap point. */
      textPath.setAttribute('textLength', length);
    });

    const apply = (offset) => {
      const partner = offset >= 0 ? offset - length : offset + length;
      head.setAttribute('startOffset', String(offset));
      tail.setAttribute('startOffset', String(partner));
    };

    apply(0);

    if (tween) {
      tween.kill();
      tween = null;
    }

    /* The global reduced-motion rule in animations.css only stops CSS
       animations, so the tween needs its own guard. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof gsap === 'undefined') return;

    const state = { offset: 0 };
    tween = gsap.to(state, {
      offset: length,
      duration: length / SPEED,
      ease: 'none',
      repeat: -1,
      onUpdate: () => apply(state.offset)
    });
  };

  layout();

  /* Playfair Display arrives async — the first measure is made with a
     fallback face, so redo it once the real one is ready. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layout).catch(() => {});
  }

  /* Text metrics are in viewBox units, so a resize only ever changes
     which window we look through — no re-measure needed. */
  const narrow = window.matchMedia(NARROW_QUERY);
  narrow.addEventListener('change', (event) => {
    svg.setAttribute('viewBox', event.matches ? VIEWBOX_NARROW : VIEWBOX_WIDE);
  });
};

document.addEventListener('DOMContentLoaded', window.initTextLoop);
