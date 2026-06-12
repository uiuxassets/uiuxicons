import { describe, it, expect } from 'vitest';
import { transformToCurrentColor } from '../svgo.config.js';

describe('transformToCurrentColor', () => {
  describe('line / solid variants', () => {
    it('replaces fill="black" with currentColor', () => {
      const input = '<svg><path fill="black" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      expect(output).toContain('fill="currentColor"');
      expect(output).not.toContain('fill="black"');
    });

    it('replaces fill="#000000" with currentColor', () => {
      const input = '<svg><path fill="#000000" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'solid');
      expect(output).toContain('fill="currentColor"');
      expect(output).not.toContain('#000000');
    });

    it('replaces fill="#000" with currentColor', () => {
      const input = '<svg><path fill="#000" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      expect(output).toContain('fill="currentColor"');
    });

    it('replaces stroke="black" with currentColor', () => {
      const input = '<svg><path stroke="black" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      expect(output).toContain('stroke="currentColor"');
      expect(output).not.toContain('stroke="black"');
    });

    it('adds fill="currentColor" to paths without fill', () => {
      const input = '<svg><path d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      expect(output).toContain('<path fill="currentColor"');
    });

    it('adds fill="currentColor" to circle without fill', () => {
      const input = '<svg><circle cx="12" cy="12" r="10"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      expect(output).toContain('<circle fill="currentColor"');
    });

    it('does not double-add fill to elements that already have one', () => {
      const input = '<svg><path fill="currentColor" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      const fillCount = (output.match(/fill="currentColor"/g) || []).length;
      expect(fillCount).toBe(1);
    });
  });

  describe('duotone variant', () => {
    it('replaces accent color with CSS variable', () => {
      const input = '<svg><path fill="#8a38f5" fill-opacity="0.25" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'duotone');
      expect(output).toContain('fill="var(--uiux-accent, currentColor)"');
      expect(output).toContain('fill-opacity="0.25"');
    });

    it('handles reversed attribute order for accent', () => {
      const input = '<svg><path fill-opacity="0.25" fill="#8a38f5" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'duotone');
      expect(output).toContain('fill="var(--uiux-accent, currentColor)"');
    });

    it('is case-insensitive for accent hex', () => {
      const input = '<svg><path fill="#8A38F5" fill-opacity="0.25" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'duotone');
      expect(output).toContain('fill="var(--uiux-accent, currentColor)"');
    });

    it('also converts black fills to currentColor', () => {
      const input = '<svg><path fill="black" d="M0 0"/><path fill="#8a38f5" fill-opacity="0.25" d="M1 1"/></svg>';
      const output = transformToCurrentColor(input, 'duotone');
      expect(output).toContain('fill="currentColor"');
      expect(output).toContain('fill="var(--uiux-accent, currentColor)"');
    });
  });

  describe('non-duotone ignores accent', () => {
    it('does not convert accent color for line variant', () => {
      const input = '<svg><path fill="#8a38f5" fill-opacity="0.25" d="M0 0"/></svg>';
      const output = transformToCurrentColor(input, 'line');
      expect(output).not.toContain('var(--uiux-accent');
    });
  });
});
