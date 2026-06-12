export default {
  multipass: true,
  plugins: [
    'preset-default',
    'removeTitle',
    'removeDesc',
    { name: 'removeViewBox', active: false },
    { name: 'removeDimensions', active: true },
    { name: 'removeAttrs', params: { attrs: ['svg:fill'] } }
  ]
};

export function transformToCurrentColor(svg, variant) {
  if (variant === 'duotone') {
    // SVGO 4+ may lowercase hex; match accent color case-insensitively
    svg = svg.replace(
      /fill="#8a38f5"\s*fill-opacity="[^"]*"/gi,
      'fill="var(--uiux-accent, currentColor)" fill-opacity="0.25"'
    );
    svg = svg.replace(
      /fill-opacity="[^"]*"\s*fill="#8a38f5"/gi,
      'fill="var(--uiux-accent, currentColor)" fill-opacity="0.25"'
    );
  }

  // Convert fills to currentColor
  svg = svg.replace(/fill="(black|#000000|#000)"/g, 'fill="currentColor"');
  svg = svg.replace(/stroke="(black|#000000|#000)"/g, 'stroke="currentColor"');

  // Add currentColor to elements without fill
  svg = svg.replace(/<path(?![^>]*fill=)([^>]*)(\/?>)/g, '<path fill="currentColor"$1$2');
  svg = svg.replace(
    /<(circle|rect|ellipse|polygon|polyline)(?![^>]*fill=)([^>]*)(\/?>)/g,
    '<$1 fill="currentColor"$2$3'
  );

  return svg;
}
