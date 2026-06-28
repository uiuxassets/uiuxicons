---
name: new-icons
description: >-
  Validates names, categorizes, and tags newly added uiuxicons and verifies them
  locally without publishing. Use when the user runs /new-icons or asks to check
  icon names, categorize, tag, or prepare new icons for review (but not release/publish).
disable-model-invocation: true
---

# New Icons

Prepares newly added icons for review: checks names, assigns categories and search
tags, then verifies the build locally.

**This skill stops before publishing.** It never commits, tags, releases, or pushes.
When the user is ready to ship, hand off to the `release-and-publish` skill.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Identify new icons
- [ ] 2. Check names against conventions (before sync)
- [ ] 3. npm run sync (assign category + tags)
- [ ] 4. Review and fine-tune categories + tags
- [ ] 5. Propose a new category only if none fit
- [ ] 6. npm run build
- [ ] 7. npm test
- [ ] 8. Stop and report
```

### 1. Identify new icons

```bash
git status --short exports/
```

New icons appear as untracked `.svg` files. The canonical source is
`exports/line/regular/` - `npm run sync` reads names from there.

### 2. Check names against conventions (before sync)

Validate every new icon name and flag anything that diverges. Propose a corrected
name and only rename if the user approves.

- **Hard rule:** the name must match `ICON_NAME_RE` `/^[a-z0-9-]+$/` (lowercase
  letters, digits, hyphens only), enforced by `assertSafeIconName` in
  [scripts/icon-names.js](scripts/icon-names.js). `npm run sync` throws otherwise.
- **Conventions** (inferred from existing names in
  [icons.meta.json](icons.meta.json), not enforced by a script - compare each
  new name against existing families):
  - `base-modifier` order: `grid-plus`, not `plus-grid` or `gridplus`.
  - Shared modifier vocabulary: prefer `plus` / `minus` / `x` / `check` over
    `add` / `remove` / `close` / `done`.
  - Shape qualifiers: `-circle`, `-square` (e.g. `arrow-circle-down`).
  - Directional suffixes: `-up` / `-down` / `-left` / `-right`, with vertical
    before horizontal (`arrow-down-left`, not `arrow-left-down`).
  - Match singular/plural to siblings (`rows`, `columns`).

Renaming an icon means renaming the file in ALL 9 variant folders so the integrity
test still sees identical sets:

```
exports/{line,duotone,solid}/{light,regular,bold}/<name>.svg
```

Do the rename before `npm run sync`, since the metadata `name` is derived from the
filename.

### 3. npm run sync

```bash
npm run sync
```

Auto-fills each new icon's `category` (`inferCategory`) and enriched search `tags`
(`enrichTags`) into [icons.meta.json](icons.meta.json). Note the
`+ <name> -> <category>` lines it prints.

### 4. Review and fine-tune categories + tags

Confirm each new icon's `category` is correct and `tags` are not sparse. An icon
that silently lands in `general` usually means no pattern in
[scripts/categories.js](scripts/categories.js) matched its name.

Fine-tune, preferring the source of truth so future icons benefit:

- **Wrong/missing category for a naming family** -> add a pattern to
  `CATEGORY_PATTERNS` in [scripts/categories.js](scripts/categories.js).
- **Sparse tags for a new token** -> add to `TOKEN_SYNONYMS` (keyed by a name token)
  or `NAME_EXTRAS` (keyed by the full icon name) in
  [scripts/categories.js](scripts/categories.js), then re-run `npm run sync`.
- **One-off override** -> edit `category` / `tags` directly in
  [icons.meta.json](icons.meta.json). Custom values win and are never
  overwritten by sync.

### 5. Propose a new category (only when none of the existing fit)

First genuinely try to place the icon in an existing category (see the enum in
[scripts/categories.js](scripts/categories.js)). Landing in `general` is a
smell to investigate, not an automatic signal to invent a category.

If a new category is truly warranted, STOP and ask the user for approval, presenting:

- the proposed lowercase category name,
- why no existing category fits,
- the exact edits required to keep the taxonomy consistent:
  1. Add the string to `category.enum` in
     [icons.meta.schema.json](icons.meta.schema.json).
  2. Add the same string to `META_CATEGORIES` in
     [scripts/categories.js](scripts/categories.js). The two lists MUST stay
     identical: `isValidMetaCategory` rejects a category missing from `META_CATEGORIES`,
     and `inferCategory` would fall back to `general`.
  3. Optionally add a `CATEGORY_PATTERNS` entry so future icons auto-infer it.

After approval and edits, re-run `npm run sync` (or set the icon's `category`
directly in `icons.meta.json`).

### 6. npm run build

```bash
npm run build
```

Assigns codepoints and regenerates `dist/` plus the React/Vue package sources.
Required before tests.

### 7. npm test

```bash
npm test
```

Typecheck plus integrity checks. Passes only after the build.

### 8. Stop and report

List the new icons with their final name, category, and tags; note any rename or
new category applied; and confirm the build and tests passed. Hand off to
`release-and-publish` only when the user is ready.

## Gotchas

- Run strictly `sync` -> `build` -> `test`. Never run `npm test` between sync and
  build - codepoints are assigned during build (`scripts/font.js`), so the integrity
  test fails otherwise.
- A category lives in TWO places that must stay identical: `category.enum` in
  `icons.meta.schema.json` and `META_CATEGORIES` in `scripts/categories.js`.
- Custom `category` / `tags` in `icons.meta.json` are never overwritten by sync.
- Renaming an icon means renaming all 9 variant SVGs; a mismatch fails the integrity
  test.
- `dist/` is generated and gitignored - never stage or commit it.
- Do NOT run `npm run release`, create tags, commit, or push. The tag is the
  deliberate publish trigger, handled by `release-and-publish`.
- Ignore the `npm warn Unknown env config "devdir"` line in command output; it is
  sandbox env noise, not a repo issue.
