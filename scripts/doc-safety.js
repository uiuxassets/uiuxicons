/**
 * Build-time safety checks for rendered docs HTML.
 *
 * docs/*.md is rendered with markdown-it `html: true` (needed for tables,
 * tabs, and the font demo), so raw HTML from a docs PR reaches the generated
 * pages verbatim. These checks reject active content at build time; the site
 * CSP is the runtime backstop.
 *
 * Patterns are tag-anchored so escaped code samples (where `<` becomes
 * `&lt;`) never match; only real rendered HTML elements can trip these.
 */

export const DANGEROUS_DOC_HTML = [
  { name: '<script>', re: /<\s*script[\s>]/i },
  { name: '<iframe>', re: /<\s*iframe[\s>]/i },
  { name: '<object>', re: /<\s*object[\s>]/i },
  { name: '<embed>', re: /<\s*embed[\s>/]/i },
  { name: '<base>', re: /<\s*base[\s>/]/i },
  { name: '<form>', re: /<\s*form[\s>]/i },
  { name: '<meta http-equiv>', re: /<\s*meta\b[^>]*?http-equiv/i },
  {
    // Matches handlers after whitespace, quotes, or a slash separator
    // (e.g. <svg/onload=...>), not just the whitespace-separated form.
    name: 'inline event handler (on*=)',
    re: /<[a-z][a-z0-9]*\b[^>]*?[\s/"']on[a-z]+\s*=/i,
  },
  {
    name: 'javascript: URL',
    re: /<[a-z][a-z0-9]*\b[^>]*?(?:href|src|xlink:href|data)\s*=\s*["']?\s*javascript:/i,
  },
  {
    // Allow raster-image data URLs; reject everything else (text/html,
    // image/svg+xml, application/*, ...) which can carry active content.
    name: 'data: URL',
    re: /<[a-z][a-z0-9]*\b[^>]*?(?:href|src|xlink:href|data)\s*=\s*["']?\s*data:(?!image\/(?:png|jpe?g|gif|webp)[;,])/i,
  },
];

/**
 * Returns the names of dangerous patterns found in rendered docs HTML.
 */
export function findUnsafeDocHtml(html) {
  const text = String(html);
  return DANGEROUS_DOC_HTML.filter((p) => p.re.test(text)).map((p) => p.name);
}

/**
 * Throws if rendered docs HTML contains active content.
 * @param {string} html
 * @param {string} sourceName - docs file name for the error message
 */
export function assertDocHtmlSafe(html, sourceName) {
  const hits = findUnsafeDocHtml(html);
  if (hits.length > 0) {
    throw new Error(
      `Unsafe HTML in docs/${sourceName}: ${hits.join(', ')}. ` +
        `Scripts, embeds, inline event handlers, and unsafe URLs are not allowed in docs.`
    );
  }
}
