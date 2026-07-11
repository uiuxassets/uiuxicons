/**
 * Runtime validation for icons.meta.json, mirroring icons.meta.schema.json:
 * safe name charset, category enum, and at least one non-empty tag per icon.
 * The schema file is editor documentation; this makes it a hard build gate.
 */

import { ICON_NAME_RE } from './icon-names.js';
import { isValidMetaCategory, META_CATEGORIES } from './categories.js';

/**
 * Returns a list of human-readable problems for the given `icons` array.
 */
export function findMetaProblems(icons) {
  const problems = [];
  const seen = new Set();

  icons.forEach((icon, i) => {
    const label = icon && typeof icon.name === 'string' ? `"${icon.name}"` : `at index ${i}`;

    if (!icon || typeof icon !== 'object') {
      problems.push(`icon ${label}: entry is not an object`);
      return;
    }
    if (typeof icon.name !== 'string' || !ICON_NAME_RE.test(icon.name)) {
      problems.push(`icon ${label}: name must match ${ICON_NAME_RE}`);
    } else if (seen.has(icon.name)) {
      problems.push(`icon ${label}: duplicate name`);
    } else {
      seen.add(icon.name);
    }
    if (!isValidMetaCategory(icon.category)) {
      problems.push(
        `icon ${label}: category "${icon.category}" is not one of: ${META_CATEGORIES.join(', ')}`
      );
    }
    if (
      !Array.isArray(icon.tags) ||
      icon.tags.length === 0 ||
      icon.tags.some((t) => typeof t !== 'string' || t.trim() === '')
    ) {
      problems.push(`icon ${label}: tags must be a non-empty array of non-empty strings`);
    }
  });

  return problems;
}

/**
 * Throws if any icon entry violates the icons.meta.json schema contract.
 * @param {Array} icons - the parsed `icons` array
 */
export function assertValidMetaIcons(icons) {
  const problems = findMetaProblems(icons);
  if (problems.length > 0) {
    throw new Error(
      `icons.meta.json failed validation:\n  - ${problems.join('\n  - ')}`
    );
  }
}
