---
title: React Native
---

The `@uiuxicons/react-native` package provides typed components for iOS and Android, rendered with [`react-native-svg`](https://github.com/software-mansion/react-native-svg). Works with Expo and bare React Native.

### Install

<div class="docs-pkg-tabs" data-package="@uiuxicons/react-native">
  <div class="docs-pkg-tabs-bar" role="tablist">
    <button role="tab" data-pm="npm" aria-selected="true">npm</button>
    <button role="tab" data-pm="pnpm">pnpm</button>
    <button role="tab" data-pm="yarn">yarn</button>
    <button role="tab" data-pm="bun">bun</button>
  </div>
  <div class="docs-pkg-tabs-panels">
    <pre data-pm="npm"><code>npm install @uiuxicons/react-native react-native-svg</code></pre>
    <pre data-pm="pnpm" hidden><code>pnpm add @uiuxicons/react-native react-native-svg</code></pre>
    <pre data-pm="yarn" hidden><code>yarn add @uiuxicons/react-native react-native-svg</code></pre>
    <pre data-pm="bun" hidden><code>bun add @uiuxicons/react-native react-native-svg</code></pre>
  </div>
</div>

Requires **React Native 0.79** or later (React 19, package exports on by default in Metro) and `react-native-svg` 15 or later. In Expo projects, run `npx expo install react-native-svg` so you get the version that matches your SDK.

### Basic usage

Component names match the React package: `Icon` + PascalCase icon id (e.g. `gear` → `IconGear`).

```tsx
import { View } from "react-native";
import { IconGear, IconHouse } from "@uiuxicons/react-native";

function App() {
  return (
    <View>
      <IconGear />
      <IconHouse size={32} color="#0a0a0a" />
    </View>
  );
}
```

Icons accept all `react-native-svg` `Svg` props: `style`, `testID`, `onPress`, `ref`, etc.

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
      <td><code>ColorValue</code></td>
      <td>black</td>
    </tr>
    <tr>
      <td>accentColor</td>
      <td><code>ColorValue</code></td>
      <td>same as color</td>
    </tr>
  </tbody>
</table>

React Native has no CSS color inheritance, so set `color` on the icon or once through `IconProvider`.

### IconProvider

Use `IconProvider` to set default props for all icons in a subtree, for example to follow your app theme. Individual icon props override the provider.

```tsx
import { IconProvider, IconGear, IconHouse } from "@uiuxicons/react-native";

<IconProvider variant="duotone" size={20} color={theme.text} accentColor={theme.primary}>
  <IconGear />            {/* duotone + 20px + theme colors */}
  <IconHouse size={32} /> {/* overrides size */}
</IconProvider>
```

Providers can be nested; the inner provider's values take priority and any unset props fall through to the outer provider.

### Duotone (React Native)

Duotone icons use an accent layer at 25% opacity. It follows `color` by default; set `accentColor` to tint it:

```tsx
<IconGear variant="duotone" color="#0a0a0a" accentColor="#8A38F5" />
```

### Accessibility

Icons are hidden from VoiceOver and TalkBack by default. For meaningful icons, add `accessibilityLabel` (or `aria-label`) and the icon is exposed as an image:

```tsx
<IconGear accessibilityLabel="Settings" />
```

### Bundle size

The package ships one module per icon and is marked `sideEffects: false`, but Metro does not remove unused exports by default, so importing from the package root bundles every icon. Unless tree shaking is enabled in your setup (for example Expo's), import icons by module path to ship only the ones you use:

```tsx
// Bundles only this icon
import { IconGear } from "@uiuxicons/react-native/icons/gear";

// Bundles every icon unless your bundler tree-shakes
import { IconGear } from "@uiuxicons/react-native";
```
