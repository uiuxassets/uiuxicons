# @uiuxicons/react

React components for [UI/UX Icons](https://uiuxicons.com) - a clean, consistent icon library for modern interfaces.

**3 styles** (line, duotone, solid) × **3 weights** (light, regular, bold) = 9 variants per icon.

## Installation

```bash
npm install @uiuxicons/react
```

Requires **React 19** or later.

## Usage

```tsx
import { IconGear, IconHouse, IconCalendar } from "@uiuxicons/react";

<IconGear />
<IconGear variant="duotone" weight="bold" />
<IconGear variant="solid" size={32} className="text-blue-500" />
```

## Props

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"line"` \| `"duotone"` \| `"solid"` | `"line"` |
| `weight` | `"light"` \| `"regular"` \| `"bold"` | `"regular"` |
| `size` | `number` \| `string` | `24` |
| `color` | `string` | inherits from CSS |
| `className` | `string` | - |

All standard SVG attributes are also accepted.

## Duotone Accent

The accent layer uses 25% opacity of the current color by default. Override with the `--uiux-accent` CSS variable:

```tsx
<IconGear
  variant="duotone"
  className="text-foreground [--uiux-accent:theme(colors.primary)]"
/>
```

## Accessibility

Icons are decorative by default (`aria-hidden="true"`). Add `aria-label` or `title` to make them meaningful:

```tsx
<IconGear aria-label="Settings" />
```

## Tree-shaking

The package is marked `sideEffects: false` and ships one module per icon, so your bundler keeps only the icons you actually import:

```tsx
// Standard (tree-shakeable)
import { IconGear } from "@uiuxicons/react";

// Optional: import a single icon module directly
import { IconGear } from "@uiuxicons/react/icons/gear";
```

## License

MIT - free for personal and commercial use.

---

**[uiuxicons.com](https://uiuxicons.com)** · [GitHub](https://github.com/uiuxassets/uiuxicons) · Made by [UI/UX Icons](https://uiuxicons.com)
