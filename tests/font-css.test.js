import { describe, it, expect } from 'vitest';
import { fontFamilyName } from '../scripts/font-css.js';

describe('fontFamilyName', () => {
  it('returns human-readable family for line style', () => {
    expect(fontFamilyName('line')).toBe('UIUX Icons Line');
  });

  it('returns human-readable family for duotone style', () => {
    expect(fontFamilyName('duotone')).toBe('UIUX Icons Duotone');
  });

  it('returns human-readable family for solid style', () => {
    expect(fontFamilyName('solid')).toBe('UIUX Icons Solid');
  });
});
