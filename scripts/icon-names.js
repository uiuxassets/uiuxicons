import { isValidMetaCategory } from './categories.js';

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
