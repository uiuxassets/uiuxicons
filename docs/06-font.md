---
title: Web Font
---

The ZIP includes `font/<style>/` with `.woff2` and `.ttf` for each weight, plus `font/uiuxicons.css` (generated `@font-face` rules + named classes) and `font/codepoints.json`.

**Duotone in fonts:** single-color only (glyph outline). Use SVG or React for real duotone accents.

### Use uiuxicons.css (recommended)

Keep `uiuxicons.css` in the same folder as `line/`, `duotone/`, and `solid/` so the `url(...)` paths resolve. Link it from your HTML:

```html
<link rel="stylesheet" href="./font/uiuxicons.css" />
```

On one element, combine:

<table>
  <thead>
    <tr>
      <th scope="col">Class</th>
      <th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>uiuxicon</code></td>
      <td>Base sizing / smoothing</td>
    </tr>
    <tr>
      <td><code>uiux-line</code>, <code>uiux-duotone</code>, or <code>uiux-solid</code></td>
      <td>Icon style</td>
    </tr>
    <tr>
      <td><code>uiux-light</code>, <code>uiux-regular</code>, or <code>uiux-bold</code></td>
      <td>Icon weight</td>
    </tr>
    <tr>
      <td><code>uiux-&lt;icon-id&gt;</code></td>
      <td>Kebab-case id matching the SVG file name (e.g. <code>uiux-gear</code>, <code>uiux-app-window</code>)</td>
    </tr>
  </tbody>
</table>

```html
<span class="uiuxicon uiux-line uiux-bold uiux-gear" aria-hidden="true"></span>
```

The stylesheet defines `::before { content: "\e…" }` per icon. The style class (e.g. `uiux-line`) sets `font-family: "UIUX Icons Line"` and the weight class (e.g. `uiux-bold`) sets `font-weight: 700`.

### Codepoints

Glyphs use the private-use area starting at `U+E001`, with the same mapping in every font file. Codepoints are **stable across releases**: once an icon is assigned a codepoint it keeps it forever, and new icons are appended after the highest existing codepoint. `codepoints.json` maps each id to a decimal codepoint for scripts or custom CSS.

### Raw HTML without the bundle

HTML has no named entity for custom PUA glyphs, only numeric references work unless you use the generated CSS:

```html
<span class="uiuxicon" style="font-family: 'UIUX Icons Line', monospace; font-weight: 400" aria-hidden="true">&#xe001;</span>
```

Ligatures (typing the icon name) are not supported, fixed codepoints only.

Prefer **React**, **Vue**, or **inline SVG** when you need duotone, precise sizing, or tree-shaking.
