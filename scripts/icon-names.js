import { isValidMetaCategory } from './categories.js';

export const ICON_NAME_RE = /^[a-z0-9-]+$/;

/**
 * Throws unless `name` is a safe icon stem/name: lowercase letters, digits, and
 * hyphens only. This blocks path traversal, quotes, and other characters that
 * could break out of generated source, CSS, or file paths. The `--` category
 * prefix (e.g. "arrows--arrow-down") is allowed since it is only hyphens.
 * @param {string} name
 * @returns {string} the validated name
 */
export function assertSafeIconName(name) {
  if (typeof name !== 'string' || !ICON_NAME_RE.test(name)) {
    throw new Error(
      `Invalid icon name "${name}": must match ${ICON_NAME_RE} ` +
        `(lowercase letters, digits, and hyphens only).`
    );
  }
  return name;
}

/**
 * Parse an SVG basename or filename under exports/line/regular.
 * Optional valid schema category prefix: arrows--arrow-down.svg → logical "arrow-down".
 */
export function parseExportSvgFilename(filename) {
  const base = filename.toLowerCase().endsWith('.svg')
    ? filename.slice(0, -4)
    : filename;

  if (base.includes('--')) {
    const [prefix, ...rest] = base.split('--');
    const logicalName = rest.join('--');
    const raw = prefix.toLowerCase();
    if (isValidMetaCategory(raw)) {
      return {
        exportStem: base,
        logicalName,
        categoryHint: raw,
        invalidPrefix: undefined,
      };
    }
    return {
      exportStem: base,
      logicalName,
      categoryHint: null,
      invalidPrefix: raw || undefined,
    };
  }

  return { exportStem: base, logicalName: base, categoryHint: null, invalidPrefix: undefined };
}
