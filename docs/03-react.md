---
title: React
---

The `@uiuxicons/react` package provides typed, tree-shakeable components. Only the icons you import are included in your bundle.

### Install

<div class="docs-pkg-tabs" data-package="@uiuxicons/react">
  <div class="docs-pkg-tabs-bar" role="tablist">
    <button role="tab" data-pm="npm" aria-selected="true">npm</button>
    <button role="tab" data-pm="pnpm">pnpm</button>
    <button role="tab" data-pm="yarn">yarn</button>
    <button role="tab" data-pm="bun">bun</button>
  </div>
  <div class="docs-pkg-tabs-panels">
    <pre data-pm="npm"><code>npm install @uiuxicons/react</code></pre>
    <pre data-pm="pnpm" hidden><code>pnpm add @uiuxicons/react</code></pre>
    <pre data-pm="yarn" hidden><code>yarn add @uiuxicons/react</code></pre>
    <pre data-pm="bun" hidden><code>bun add @uiuxicons/react</code></pre>
  </div>
</div>

Requires **React 19** or later.

### Basic usage

Component names are `Icon` + PascalCase icon id (e.g. `gear` → `IconGear`).

```tsx
import { IconGear, IconHouse } from "@uiuxicons/react";

function App() {
  return (
    <div>
      <IconGear />
      <IconHouse size={32} />
    </div>
  );
}
```

Icons accept standard SVG attributes: `className`, `style`, `onClick`, `ref`, etc.

### Variants & props

Use `variant` and `weight`. Defaults: `line` + `regular`.

```tsx
<IconGear />                                     {/* line + regular */}
<IconGear variant="duotone" weight="bold" />     {/* duotone + bold */}
<IconGear variant="solid" weight="light" />      {/* solid + light */}
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
      <td>className</td>
      <td><code>string</code></td>
      <td>-</td>
    </tr>
  </tbody>
</table>

### IconProvider

Use `IconProvider` to set default props for all icons in a subtree. Individual icon props override the provider.

```tsx
import { IconProvider, IconGear, IconHouse } from "@uiuxicons/react";

<IconProvider variant="duotone" weight="bold" size={20}>
  <IconGear />            {/* duotone + bold + 20px */}
  <IconHouse size={32} /> {/* duotone + bold + 32px (overrides size) */}
</IconProvider>
```

Providers can be nested; the inner provider's values take priority and any unset props fall through to the outer provider.

### Duotone (React)

Duotone icons use an accent layer at 25% opacity. Override with `--uiux-accent`:

```tsx
<IconGear
  variant="duotone"
  className="text-foreground [--uiux-accent:theme(colors.primary)]"
/>
```

Plain CSS: set `color` and `--uiux-accent` on a parent or the icon.

### Accessibility

Decorative icons use `aria-hidden="true"`. For meaningful icons, add `aria-label` or `title`:

```tsx
<IconGear aria-label="Settings" />
```

### With shadcn/ui

```tsx
import { IconGear } from "@uiuxicons/react";
import { Button } from "@/components/ui/button";

<Button variant="outline" size="icon">
  <IconGear className="size-4" />
</Button>
```

### With Tailwind CSS

```tsx
<IconGear className="size-5 text-foreground" />
```

### TypeScript

```tsx
import type { IconProps } from "@uiuxicons/react";

function MyIcon(props: IconProps) {
  return <IconGear variant="solid" {...props} />;
}
```
