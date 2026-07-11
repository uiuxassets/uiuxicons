# @uiuxicons/core

The core assets of [UI/UX Icons](https://uiuxicons.com): optimized SVGs, the
icon web font, and metadata JSON. No code, no dependencies — use it with any
framework, build tool, or none at all.

**3 styles** (line, duotone, solid) × **3 weights** (light, regular, bold).

Looking for components? Use [`@uiuxicons/react`](https://www.npmjs.com/package/@uiuxicons/react)
or [`@uiuxicons/vue`](https://www.npmjs.com/package/@uiuxicons/vue).

## Install

```bash
npm install @uiuxicons/core
```

## Contents

| Path | Description |
|------|-------------|
| `svg/{style}-{weight}/{name}.svg` | Optimized SVGs, e.g. `svg/line-regular/gear.svg` |
| `font/{style}/{weight}.woff2` (+ `.ttf`) | Web font per style and weight |
| `font/uiuxicons.css` | `@font-face` rules and named classes |
| `font/codepoints.json` | Icon id → decimal codepoint |
| `uiuxicons.json` | Full metadata: names, categories, tags, variants |
| `codepoints.json` | Copy of the codepoint map at the package root |

All SVGs are 24×24, use `currentColor`, and duotone accents read the
`--uiux-accent` CSS variable.

## Use from a CDN

No build tools required. Web font via [jsDelivr](https://www.jsdelivr.com):

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@uiuxicons/core@0/font/uiuxicons.css"
/>

<span class="uiuxicon uiux-line uiux-regular uiux-gear" aria-hidden="true"></span>
```

Or reference a raw SVG directly:

```html
<img
  src="https://cdn.jsdelivr.net/npm/@uiuxicons/core@0/svg/line-regular/gear.svg"
  width="24"
  height="24"
  alt=""
/>
```

The same paths work on [unpkg](https://unpkg.com):
`https://unpkg.com/@uiuxicons/core@0/svg/line-regular/gear.svg`.

`@0` tracks the latest 0.x release; pin an exact version (e.g. `@0.4.0`) in
production for full reproducibility.

## Import in a bundler

Most bundlers import SVG and JSON files out of the box:

```js
import gear from "@uiuxicons/core/svg/line-regular/gear.svg";
import meta from "@uiuxicons/core/uiuxicons.json";
import codepoints from "@uiuxicons/core/codepoints.json";
```

## Web font classes

Combine on one element: the base class, a style class, a weight class, and
the icon id class.

```html
<span class="uiuxicon uiux-duotone uiux-bold uiux-gear" aria-hidden="true"></span>
```

Codepoints are stable across releases: once an icon is assigned a codepoint
it keeps it forever. Note the font renders duotone as a single color; use the
SVGs or component packages for real duotone accents.

## Building on top

This package is the canonical, versioned source of the icon assets. If you
want to build a port for another framework, generate from `svg/` and
`uiuxicons.json` here rather than scraping the repository or the site.

## License

MIT — see [LICENSE](./LICENSE).

---

**[uiuxicons.com](https://uiuxicons.com)** · [GitHub](https://github.com/uiuxassets/uiuxicons)
