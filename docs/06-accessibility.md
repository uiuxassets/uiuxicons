---
title: Accessibility
---

Icons are visual by nature, but proper markup ensures they work for everyone, including users of screen readers and other assistive technologies.

### Decorative vs. meaningful icons

Most icons in a UI are **decorative** -- they sit next to a visible text label and add no extra information. These should be hidden from assistive technology so screen readers don't announce redundant content.

**Meaningful** icons convey information on their own, without an adjacent text label. A settings gear button with no visible "Settings" text is a common example. These need an accessible name.

### How it works

Both `@uiuxicons/react` and `@uiuxicons/vue` handle this automatically:

- **No label provided** -- the icon renders with `aria-hidden="true"` and `focusable="false"`, hiding it from screen readers.
- **Label provided** -- when you pass `aria-label`, `aria-labelledby`, `aria-describedby`, or `title`, the icon renders with `role="img"` instead, making it visible to assistive technology.

### Choosing the right attribute

| Attribute | When to use |
|---|---|
| `aria-label` | Standalone icons (e.g. icon-only buttons). Provides an accessible name directly. |
| `title` | When you want a visible tooltip on hover in addition to an accessible name. |
| `aria-labelledby` | When the label text already exists elsewhere in the DOM and you want to reference it by `id`. |
| `aria-describedby` | When the icon has a description (not a name) provided by another element. |

### React examples

```tsx
{/* Decorative -- hidden from screen readers */}
<Button>
  <IconGear /> Settings
</Button>

{/* Meaningful -- icon-only button needs a label */}
<Button aria-label="Settings">
  <IconGear />
</Button>

{/* Using title for a tooltip + accessible name */}
<IconGear title="Settings" />
```

### Vue examples

```vue
<template>
  <!-- Decorative -->
  <button>
    <IconGear /> Settings
  </button>

  <!-- Meaningful -->
  <button aria-label="Settings">
    <IconGear />
  </button>

  <!-- Using title -->
  <IconGear title="Settings" />
</template>
```

### Font icons

When using the icon font, add `aria-hidden="true"` manually since font glyphs are always text nodes:

```html
<button>
  <span class="uiuxicon uiux-line uiux-regular uiux-gear" aria-hidden="true"></span>
  Settings
</button>
```

For icon-only font buttons, add `aria-label` on the button itself, not on the icon span.

### Best practices

- Prefer decorative icons paired with visible text whenever possible.
- Never rely solely on color to communicate meaning; pair icons with labels.
- Test with a screen reader (VoiceOver, NVDA, JAWS) to verify announcements.
- When an icon is inside an interactive element (`<button>`, `<a>`), the accessible name should be on the interactive element, not the icon.
