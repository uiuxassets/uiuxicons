# UI/UX Icons

A clean, consistent icon library for modern interfaces.

**3 styles** × **3 weights** = 9 variants per icon.

| Style | Weights |
|-------|---------|
| Line | Light, Regular, Bold |
| Duotone | Light, Regular, Bold |
| Solid | Light, Regular, Bold |

Free and open source. MIT licensed.

## Quick Start

Clone the repo and build all assets (optimized SVGs, fonts, React and Vue packages, and the docs site):

```bash
npm install
npm run build
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run sync` | Sync metadata with exports folder |
| `npm run build` | Full build (optimize + JSON + ZIPs + site) |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |

Site styles: [`styles/index.css`](styles/index.css) (Tailwind) compiles to `dist/styles.css`.

## Adding Icons

1. Export SVGs from Figma to `exports/{style}/{weight}/`
2. Run `npm run sync` - generates metadata for new icons
3. Review `icons.meta.json`, adjust categories/tags if needed
4. Run `npm run build`

## Output

```
dist/
├── index.html
├── examples.html
├── styles.css
├── icon.png             ← from assets/ (favicon, Apple touch, OG image)
├── uiuxicons.json
├── uiuxicons/
│   ├── line-light/
│   ├── line-regular/
│   ├── line-bold/
│   ├── duotone-light/
│   ├── duotone-regular/
│   ├── duotone-bold/
│   ├── solid-light/
│   ├── solid-regular/
│   └── solid-bold/
├── font/
│   ├── line/
│   ├── duotone/
│   ├── solid/
│   ├── uiuxicons.css
│   └── codepoints.json
└── downloads/
    └── uiuxicons.zip    ← svg/, font/ (+ uiuxicons.css, codepoints.json), LICENSE, README.md
```

## Using with React

Install the React package (requires **React 19** or later):

```bash
npm install @uiuxicons/react
```

Import and use icons:

```tsx
import { IconGear, IconHouse, IconCalendar } from "@uiuxicons/react";

<IconGear />
<IconGear variant="duotone" weight="bold" />
<IconGear variant="solid" size={32} className="text-blue-500" />
```

### Props

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"line"` \| `"duotone"` \| `"solid"` | `"line"` |
| `weight` | `"light"` \| `"regular"` \| `"bold"` | `"regular"` |
| `size` | `number` \| `string` | `24` |
| `color` | `string` | inherits from CSS |
| `className` | `string` | - |

All standard SVG attributes are also accepted.

### With shadcn/ui

```tsx
import { IconGear } from "@uiuxicons/react";
import { Button } from "@/components/ui/button";

<Button variant="outline" size="icon">
  <IconGear className="size-4" />
</Button>
```

### Duotone Accent

The accent layer uses 25% opacity of the current color by default. Override via CSS variable:

```tsx
<IconGear
  variant="duotone"
  className="text-foreground [--uiux-accent:theme(colors.primary)]"
/>
```

### Accessibility

Icons are decorative by default (`aria-hidden="true"`). Add `aria-label` or `title` to make them accessible:

```tsx
<IconGear aria-label="Settings" />
```

## Using with Vue

Install the Vue package (requires **Vue 3.5** or later):

```bash
npm install @uiuxicons/vue
```

Import and use icons:

```vue
<script setup>
import { IconGear, IconHouse, IconCalendar } from "@uiuxicons/vue";
</script>

<template>
  <IconGear />
  <IconGear variant="duotone" weight="bold" />
  <IconGear variant="solid" :size="32" class="text-blue-500" />
</template>
```

Same props as the React package (`variant`, `weight`, `size`, `color`), plus `title` for accessible labels. See [packages/vue/README.md](packages/vue/README.md) for full documentation.

## Using the SVGs Directly

Icons use `currentColor` - set color via CSS:

```html
<div style="color: #8A38F5;">
  <svg>...</svg>
</div>
```

### Duotone Accent (CSS)

```css
.icon {
  color: #000;
  --uiux-accent: #8A38F5;
}
```

## Specs

- 24×24 viewBox
- `currentColor` fill/stroke
- Line weights: 1px (light), 1.5px (regular), 2px (bold)

## Project Structure

```
exports/          ← source SVGs from Figma (line/duotone/solid × light/regular/bold)
scripts/          ← build pipeline (optimize, fonts, metadata, React/Vue codegen, site)
packages/react/   ← @uiuxicons/react npm package (TypeScript, dual ESM/CJS)
packages/vue/     ← @uiuxicons/vue npm package (TypeScript, dual ESM/CJS)
docs/             ← markdown content for the docs site
styles/           ← Tailwind CSS source for the docs site
tests/            ← Vitest test suite
dist/             ← build output (gitignored)
```

## Contributing

1. Fork the repo and create a branch
2. Add or modify icons in `exports/{style}/{weight}/`
3. Run `npm run sync` to update metadata
4. Run `npm test` to verify nothing is broken
5. Run `npm run build` to generate all outputs
6. Open a pull request

## License

MIT - free for personal and commercial use.

---

**[uiuxicons.com](https://uiuxicons.com)** · [GitHub](https://github.com/uiuxassets/uiuxicons) · Made by [UI/UX Icons](https://uiuxicons.com)
