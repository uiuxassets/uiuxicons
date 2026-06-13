# @uiuxicons/vue

Vue components for [UI/UX Icons](https://uiuxicons.com) - a clean, consistent icon library for modern interfaces.

**3 styles** (line, duotone, solid) × **3 weights** (light, regular, bold) = 9 variants per icon.

## Installation

```bash
npm install @uiuxicons/vue
```

Requires **Vue 3.5** or later.

## Usage

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

## Props

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"line"` \| `"duotone"` \| `"solid"` | `"line"` |
| `weight` | `"light"` \| `"regular"` \| `"bold"` | `"regular"` |
| `size` | `number` \| `string` | `24` |
| `color` | `string` | inherits from CSS |
| `title` | `string` | - |

All standard SVG attributes are also accepted.

## Duotone Accent

The accent layer uses 25% opacity of the current color by default. Override with the `--uiux-accent` CSS variable:

```vue
<template>
  <IconGear
    variant="duotone"
    class="text-foreground"
    style="--uiux-accent: var(--color-primary)"
  />
</template>
```

## Accessibility

Icons are decorative by default (`aria-hidden="true"`). Add `aria-label` or `title` to make them meaningful:

```vue
<template>
  <IconGear aria-label="Settings" />
  <IconGear title="Settings" />
</template>
```

## Tree-shaking

The package is marked `sideEffects: false` and ships one module per icon, so your bundler keeps only the icons you actually import:

```vue
<script setup>
// Standard (tree-shakeable)
import { IconGear } from "@uiuxicons/vue";

// Optional: import a single icon module directly
import { IconGear } from "@uiuxicons/vue/icons/gear";
</script>
```

## License

MIT - free for personal and commercial use.

---

**[uiuxicons.com](https://uiuxicons.com)** · [GitHub](https://github.com/uiuxassets/uiuxicons) · Made by [UI/UX Icons](https://uiuxicons.com)
