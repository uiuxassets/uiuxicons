---
title: Download
---

Get everything in one archive via **Download** in the site header.

The ZIP includes:

<table>
  <thead>
    <tr>
      <th scope="col">Path</th>
      <th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>svg/{line|duotone|solid}/{light|regular|bold}/</code></td>
      <td>Optimized SVGs</td>
    </tr>
    <tr>
      <td><code>font/{line|duotone|solid}/</code></td>
      <td><code>.woff2</code> and <code>.ttf</code> per weight</td>
    </tr>
    <tr>
      <td><code>font/uiuxicons.css</code></td>
      <td>Named classes and all <code>@font-face</code> rules (paths relative to that file)</td>
    </tr>
    <tr>
      <td><code>font/codepoints.json</code></td>
      <td>Icon id → decimal codepoint (same order as the fonts)</td>
    </tr>
    <tr>
      <td><code>LICENSE</code>, <code>README.md</code></td>
      <td>License and package readme</td>
    </tr>
  </tbody>
</table>

You can also copy individual SVGs from the grid on the icons page.

### npm and CDN

The same assets ship on npm as <code>@uiuxicons/core</code> (no code, no dependencies):

```bash
npm install @uiuxicons/core
```

<table>
  <thead>
    <tr>
      <th scope="col">Path</th>
      <th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>svg/{style}-{weight}/{name}.svg</code></td>
      <td>Optimized SVGs (e.g. <code>svg/line-regular/gear.svg</code>)</td>
    </tr>
    <tr>
      <td><code>font/</code></td>
      <td>Web font, <code>uiuxicons.css</code>, and <code>codepoints.json</code></td>
    </tr>
    <tr>
      <td><code>uiuxicons.json</code></td>
      <td>Full metadata: names, categories, tags, variants</td>
    </tr>
  </tbody>
</table>

Because it is on npm, everything is also available from a CDN without any build tools:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@uiuxicons/core@0/font/uiuxicons.css" />

<img src="https://cdn.jsdelivr.net/npm/@uiuxicons/core@0/svg/line-regular/gear.svg" width="24" height="24" alt="" />
```

Pin an exact version (e.g. <code>@0.4.0</code>) in production.
