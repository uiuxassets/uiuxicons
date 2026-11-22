# @uiuxicons/react-native

React Native components for [UI/UX Icons](https://uiuxicons.com) - a clean, consistent icon library for modern interfaces.

**3 styles** (line, duotone, solid) × **3 weights** (light, regular, bold) = 9 variants per icon.

## Installation

```bash
npm install @uiuxicons/react-native react-native-svg
```

Requires **React Native 0.79** or later and **react-native-svg 15** or later. In Expo projects, install `react-native-svg` with `npx expo install react-native-svg` to get the version matching your SDK.

## Usage

```tsx
import { IconGear } from "@uiuxicons/react-native/icons/gear";

<IconGear />
<IconGear variant="duotone" weight="bold" />
<IconGear variant="solid" size={32} color="#2563eb" />
```

## Props

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"line"` \| `"duotone"` \| `"solid"` | `"line"` |
| `weight` | `"light"` \| `"regular"` \| `"bold"` | `"regular"` |
| `size` | `number` \| `string` | `24` |
| `color` | `ColorValue` | black |
| `accentColor` | `ColorValue` | same as `color` |

All `react-native-svg` `Svg` props (`style`, `testID`, `onPress`, ...) are also accepted.

## IconProvider

React Native has no CSS color inheritance, so set shared defaults once:

```tsx
import { IconProvider } from "@uiuxicons/react-native";

<IconProvider color={theme.text} accentColor={theme.primary} size={20}>
  <App />
</IconProvider>
```

## Duotone Accent

The accent layer is drawn at 25% opacity and follows `color` by default. Tint it with `accentColor`:

```tsx
<IconGear variant="duotone" color="#0a0a0a" accentColor="#8A38F5" />
```

## Accessibility

Icons are hidden from VoiceOver and TalkBack by default. Add `accessibilityLabel` (or `aria-label`) to expose a meaningful icon as an image:

```tsx
<IconGear accessibilityLabel="Settings" />
```

## Bundle size

The package ships one module per icon and is marked `sideEffects: false`, but Metro does not remove unused exports by default. Import icons by module path to bundle only the ones you use:

```tsx
// Bundles only this icon
import { IconGear } from "@uiuxicons/react-native/icons/gear";

// Bundles every icon unless your bundler tree-shakes
import { IconGear } from "@uiuxicons/react-native";
```

## License

MIT - free for personal and commercial use. Every built file carries an `@license` header that bundlers preserve, which keeps the required notice with your bundle. Visible credit is appreciated, not required: `Icons by <a href="https://uiuxicons.com">UI/UX Icons</a>`.

The UI/UX Icons name and logo are not covered by the MIT License - see [TRADEMARKS.md](https://github.com/uiuxassets/uiuxicons/blob/main/TRADEMARKS.md).

---

**[uiuxicons.com](https://uiuxicons.com)** · [GitHub](https://github.com/uiuxassets/uiuxicons) · Made by [UI/UX Icons](https://uiuxicons.com)
