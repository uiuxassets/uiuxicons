/**
 * Active-content detection for SVG and generated HTML.
 *
 * SVGO is configured to strip these (removeScripts/removeStyleElement), but this
 * is an independent, fail-closed guard so a SVGO bypass or config regression
 * cannot let a malicious contributor SVG reach the site or the npm packages.
 */

export const UNSAFE_PATTERNS = [
  { name: '<script>', re: /<\s*script[\s>]/i },
  { name: '<foreignObject>', re: /<\s*foreignObject[\s>]/i },
  { name: 'event handler attribute (on*=)', re: /\son[a-z]+\s*=/i },
  { name: 'javascript: URL', re: /javascript:/i },
  { name: 'data: URL', re: /(?:href|xlink:href|src)\s*=\s*["']?\s*data:/i },
];

/**
 * Returns the list of matched unsafe-pattern names found in `content`.
 */
export function findUnsafeContent(content) {
  const text = String(content);
  return UNSAFE_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}

/**
 * Throws if `content` contains any active/unsafe construct.
 * @param {string} content
 * @param {string} label - identifier for the error message (e.g. file path)
 */
export function assertSvgSafe(content, label) {
  const hits = findUnsafeContent(content);
  if (hits.length > 0) {
    throw new Error(
      `Unsafe SVG content in ${label}: ${hits.join(', ')}. ` +
        `Active content is not allowed in icons.`
    );
  }
}

// Presentational SVG elements icons are allowed to use (stored lowercase).
// Everything else (script, style, foreignObject, image, a, use, animate, text,
// iframe, ...) is rejected so codegen can never embed an unexpected element.
export const ALLOWED_SVG_ELEMENTS = new Set([
  'svg',
  'path',
  'g',
  'circle',
  'rect',
  'ellipse',
  'polygon',
  'polyline',
  'line',
  'defs',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'stop',
  'symbol',
]);

/**
 * Returns the distinct element tag names in `content` that are not allowlisted.
 */
export function findDisallowedElements(content) {
  const re = /<\s*([a-zA-Z][a-zA-Z0-9:-]*)/g;
  const bad = new Set();
  let m;
  while ((m = re.exec(String(content))) !== null) {
    if (!ALLOWED_SVG_ELEMENTS.has(m[1].toLowerCase())) {
      bad.add(m[1]);
    }
  }
  return [...bad];
}

/**
 * Throws if `content` contains any non-allowlisted SVG element.
 * @param {string} content
 * @param {string} label - identifier for the error message
 */
export function assertAllowedSvgElements(content, label) {
  const bad = findDisallowedElements(content);
  if (bad.length > 0) {
    throw new Error(
      `Disallowed SVG element(s) in ${label}: ${bad.join(', ')}. ` +
        `Only presentational SVG elements are permitted in icons.`
    );
  }
}
