---
title: Introduction
---

UI/UX Icons is a clean, consistent icon library for modern interfaces. Every icon comes in **3 styles** and **3 weights**, giving you **9 variants** per icon.

<div class="grid grid-cols-3 gap-3 text-sm mb-4">
  <div class="p-4 bg-secondary rounded-md">
    <span class="text-fg font-medium !mb-0">Styles</span>
    <p class="text-fg-muted">Line, Duotone, Solid</p>
  </div>
  <div class="p-4 bg-secondary rounded-md">
    <span class="text-fg font-medium !mb-0">Weights</span>
    <p class="text-fg-muted">Light, Regular, Bold</p>
  </div>
  <div class="p-4 bg-secondary rounded-md">
    <span class="text-fg font-medium !mb-0">Total</span>
    <p class="text-fg-muted">{{total}} icons</p>
  </div>
</div>

All icons use a 24×24 viewBox with `currentColor`, so they inherit your text color automatically.

### Naming

Icon names are lowercase kebab-case and follow a few predictable rules, so you can often guess a name without searching:

- **Glyph first, modifier after** — `grid-plus`, `folder-x`, `clipboard-check`.
- **Shared modifier vocabulary** — `plus`, `minus`, `x`, and `check` (not `add`, `remove`, `close`, or `done`).
- **Shape containers come right after the glyph** — `plus-circle`, `x-square`; with a direction it becomes `arrow-circle-down`, `chevron-circle-up`.
- **Direction is always the final segment** — `-up` / `-down` / `-left` / `-right`, with vertical before horizontal for diagonals (`arrow-down-left`).

Every icon also carries search tags (synonyms like "add" for `plus`), so searching by what an icon does will find it even if you don't know the exact name.

### Brand icons

UI/UX Icons does not include brand or logo icons. Trademarks and brand assets carry legal constraints that are difficult to maintain in an open icon library. For brand icons, we recommend <a href="https://simpleicons.org/" target="_blank" rel="noopener noreferrer">Simple Icons</a>.
