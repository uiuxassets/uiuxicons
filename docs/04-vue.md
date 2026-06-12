---
title: Vue
---

The `@uiuxicons/vue` package provides typed, tree-shakeable components. Only the icons you import are included in your bundle.

### Install

<div class="docs-pkg-tabs" data-package="@uiuxicons/vue">
  <div class="docs-pkg-tabs-bar" role="tablist">
    <button role="tab" data-pm="npm" aria-selected="true">npm</button>
    <button role="tab" data-pm="pnpm">pnpm</button>
    <button role="tab" data-pm="yarn">yarn</button>
    <button role="tab" data-pm="bun">bun</button>
  </div>
  <div class="docs-pkg-tabs-panels">
    <pre data-pm="npm"><code>npm install @uiuxicons/vue</code></pre>
    <pre data-pm="pnpm" hidden><code>pnpm add @uiuxicons/vue</code></pre>
    <pre data-pm="yarn" hidden><code>yarn add @uiuxicons/vue</code></pre>
    <pre data-pm="bun" hidden><code>bun add @uiuxicons/vue</code></pre>
  </div>
</div>

Requires **Vue 3.5** or later.

### Basic usage

Component names are `Icon` + PascalCase icon id (e.g. `gear` → `IconGear`).

```vue
<script setup>
import { IconGear, IconHouse } from "@uiuxicons/vue";
</script>

<template>
  <IconGear />
  <IconHouse :size="32" />
</template>
```

Icons accept standard SVG attributes: `class`, `style`, event listeners, etc.

### Variants & props

Use `variant` and `weight`. Defaults: `line` + `regular`.

```vue
<template>
  <IconGear />                                     <!-- line + regular -->
  <IconGear variant="duotone" weight="bold" />     <!-- duotone + bold -->
  <IconGear variant="solid" weight="light" />      <!-- solid + light -->
</template>
```

<table class="docs-table--props">
  <thead>
    <tr>
      <th scope="col">Prop</th>
      <th scope="col">Type</th>
      <th scope="col">Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>variant</td>
      <td><code>"line" | "duotone" | "solid"</code></td>
      <td>"line"</td>
    </tr>
    <tr>
      <td>weight</td>
      <td><code>"light" | "regular" | "bold"</code></td>
      <td>"regular"</td>
    </tr>
    <tr>
      <td>size</td>
      <td><code>number | string</code></td>
      <td>24</td>
    </tr>
    <tr>
      <td>color</td>
      <td><code>string</code></td>
      <td>inherits from CSS</td>
    </tr>
    <tr>
      <td>title</td>
      <td><code>string</code></td>
      <td>-</td>
    </tr>
  </tbody>
</table>

### IconProvider

Use `IconProvider` to set default props for all icons in its subtree. Individual icon props override the provider.

```vue
<script setup>
import { IconProvider, IconGear, IconHouse } from "@uiuxicons/vue";
</script>

<template>
  <IconProvider variant="duotone" weight="bold" :size="20">
    <IconGear />              <!-- duotone + bold + 20px -->
    <IconHouse :size="32" />  <!-- duotone + bold + 32px (overrides size) -->
  </IconProvider>
</template>
```

Providers can be nested; the inner provider's values take priority and any unset props fall through to the outer provider.

### Duotone (Vue)

Duotone icons use an accent layer at 25% opacity. Override with `--uiux-accent`:

```vue
<template>
  <IconGear
    variant="duotone"
    class="text-foreground"
    style="--uiux-accent: var(--color-primary)"
  />
</template>
```

Plain CSS: set `color` and `--uiux-accent` on a parent or the icon.

### Accessibility

Decorative icons use `aria-hidden="true"`. For meaningful icons, add `aria-label` or `title`:

```vue
<template>
  <IconGear aria-label="Settings" />
  <IconGear title="Settings" />
</template>
```

### With Tailwind CSS

```vue
<template>
  <IconGear class="size-5 text-foreground" />
</template>
```

### TypeScript

```vue
<script setup lang="ts">
import { IconGear } from "@uiuxicons/vue";
import type { IconProps } from "@uiuxicons/vue";

const props = defineProps<IconProps>();
</script>

<template>
  <IconGear variant="solid" v-bind="props" />
</template>
```

### Nuxt

The package works with Nuxt 3 out of the box. Import icons directly in your components:

```vue
<script setup>
import { IconGear } from "@uiuxicons/vue";
</script>

<template>
  <IconGear />
</template>
```
