---
title: Conventions
type: reference
status: active
updated: 2026-05-18
description: Frontmatter schema, status enum, link form, filename rules, folder structure, asset handling.
tags:
  - framework/conventions
  - domain/conventions
aliases:
  - conventions
related:
  - "[[02-archetypes|archetypes]]"
  - "[[03-tag-taxonomy|tag-taxonomy]]"
---

# Conventions

The contract every doc in `kol-docs/` conforms to.

## Frontmatter

All keys lowercase. YAML, between `---` fences, at top of file.

```yaml
---
title: Colors
type: reference
status: canonical
updated: 2026-05-18
verified: 2026-05-18
description: Brand palette + semantic tokens. Two ramps, identity, UI state.
aliases:
  - colors
tags:
  - project/zine
  - domain/design-system
  - domain/color
covers:
  - 2 brand ramps (primary, accent × 5 stops each)
  - identity tokens
sources:
  - packages/brand-data/colors.css
related:
  - "[[02-typography|typography]]"
---
```

### Required (every doc)

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Human title, distinct from filename. |
| `type` | enum | Archetype — one of the 9 in [[02-archetypes|archetypes]]. |
| `status` | enum | Lifecycle. See below. |
| `updated` | date | ISO `YYYY-MM-DD`. Last meaningful edit. |
| `tags` | list | List-form, hierarchical. See [[03-tag-taxonomy|tag-taxonomy]]. |

### Recommended

| Field | Type | Purpose |
|---|---|---|
| `description` | string | One-sentence summary. Indexability, previews. |
| `related` | list | Wikilinks to related docs. |
| `aliases` | list | Recommended on every file with a `NN-` prefix. Supports Obsidian's Quick Switcher + search autocomplete. Not required for wikilink resolution — see *Filenames*. |

### Optional

| Field | Type | Purpose |
|---|---|---|
| `created` | date | When the doc first appeared. |
| `verified` | date | Last reality-check (canonical references). |
| `audience` | enum | `internal` `agency-internal` `client` `public`. |
| `superseded_by` | wikilink | If `status: superseded`, point to the replacement. |
| `drift` | list | Known stale spots. `drift: []` means clean. |

Archetype-specific fields (`providers:`, `repos:`, `themes:`, `covers:`, `sources:`, `tier:`, etc.) — see [[02-archetypes|archetypes]] for the full list per type.

## Status enum

| Status | Meaning |
|---|---|
| `draft` | In progress, not yet trustworthy. |
| `active` | Live, evolving, trustworthy now. |
| `canonical` | Locked. Source of truth. Edits require a status bump out of canonical first. |
| `superseded` | Replaced by another doc. Set `superseded_by:`. |
| `archived` | No longer relevant. Kept for history. |

**`active` vs `canonical`:** if you'd be comfortable an agent or teammate reading this doc and taking action without verifying, it's `canonical`. If it might still shift under their feet, it's `active`.

## Tags

- **List-form**, not bracket-array.
- **Hierarchical** with `/` where structure helps.
- Top-level namespace must come from [[03-tag-taxonomy|tag-taxonomy]].
- Don't duplicate `type:` or `status:` as tags.

```yaml
tags:
  - domain/typography
  - project/acyr
  - provider/sanity
```

## Cross-references

- **`related:` field** — flat list of wikilinks. No graph structure.
- **Body links** — `[[wikilinks]]` for vault-internal, standard markdown `[text](url)` for external URLs.

```yaml
related:
  - "[[01-colors|colors]]"
  - "[[02-typography|typography]]"
```

## Filenames

- Kebab-case, lowercase, `.md` extension. No spaces.
- **Every file gets a numeric or date prefix.** Exception: `INDEX.md` is exempt.
  - **Sequential folders** (playbook, ordered guide): `NN-` two-digit prefix = reading order.
  - **Catalog folders** (reference, guides): `NN-` = display priority (most-referenced first, alphabetical, or added-order — pick one per folder, stick to it).
  - **Dated folders** (plans, log): ISO date prefix (`YYYY-MM-DD-`) replaces `NN-`.
- **Wikilinks use the explicit-with-display form** so they always resolve regardless of Obsidian's index state: `[[01-colors|colors]]` renders as "colors" but binds to `01-colors.md`. See *Maintenance* for why.
- **Optionally add `aliases:`** with the un-prefixed name for Obsidian Quick Switcher / search autocomplete. Doesn't affect wikilink resolution.

```yaml
aliases:
  - colors
```

## Folder structure

At any folder level, you have:

- `INDEX.md` (when it adds signal — see *INDEX's role* below; exempt from prefix rule when present)
- `_assets/` and/or `_files/` (when needed — infrastructure, exempt from prefix rule)
- **Either** subfolders **or** loose content files. **Never both.**

Reason: Finder and Obsidian both group folders before files. Mixing breaks the numeric sequence visually — `01-foo.md, 02-bar/, 03-baz.md` displays as `02-bar/, INDEX.md, 01-foo.md, 03-baz.md`.

**Single-doc folders are fine.** `01-architecture/INDEX.md` IS the architecture doc, with `type: decisions` in frontmatter. The folder reserves the namespace for future growth.

## INDEX's role

INDEX.md is a **position**, not an archetype. It exists **when it adds signal** — not as a default at every folder level.

**Have an INDEX when:**
- The folder has multiple subfolders that need framing (a pillar entry routing to sections)
- The folder has a substantive "why this section exists" story worth telling
- The folder contains one substantive doc that IS the folder's content (single-doc subfolder)

**Skip an INDEX when:**
- The folder is a leaf with a handful of related files and the parent's INDEX can list them directly
- The folder content is self-evident from filenames (sequential playbook, simple reference catalog)
- The INDEX would only duplicate what the parent INDEX already says

**Types based on role:**

- Single-doc folder → INDEX *is* that doc, with the relevant `type:` in frontmatter (`decisions`, `audit`, etc.)
- Multi-doc folder with substantive framing → INDEX is `type: index` and routes to children
- No INDEX → parent INDEX describes the folder's contents directly

**Default is no INDEX.** Add one when a child listing alone isn't enough.

## H1

- `# Title` — matches `title:` in frontmatter, optionally extended with ` — qualifier` for subtitle.
- No leading numbering in the H1. Filename carries any numbering.

## Dates

- ISO `YYYY-MM-DD`. No timestamps, no timezones.
- One date field required (`updated:`). `created:` and `verified:` optional.

## Supporting files — `_assets/` and `_files/`

Two folder names, picked by what's inside:

| Folder | Holds | Embed behavior |
|---|---|---|
| `_assets/` | Renderable media — images (`.png/.jpg/.svg`), video (`.mp4/.webm`), PDFs, audio (`.mp3`) | `![[name.png]]` renders inline |
| `_files/` | Non-renderable supporting files — configs (`.txt/.json/.yaml`), code (`.css/.jsx`), raw data, exports | `[[name.txt]]` links; doesn't render. Contents go in fenced code blocks if you need them visible. |

Both follow the same placement, prefix, and naming rules below.

### Placement — closest common ancestor

The folder lives at the closest common ancestor of the docs that reference its contents:

- Used by one doc → in that doc's immediate folder
- Used by multiple docs in same section → at the section root
- Used across multiple sections → at the pillar root

```
kol-docs/<pillar>/
├── _assets/                        ← pillar-wide images (logo, recurring diagrams)
│   └── brand-logo.svg
├── 03-setup/
│   ├── _assets/                    ← section-wide images
│   │   └── deploy-flow.png
│   ├── _files/                     ← section-wide non-renderables (sibling, when both kinds present)
│   │   └── env-template.txt
│   └── 01-prerequisites.md
└── 05-reference/
    ├── _assets/
    │   └── color-ramp.png
    └── 01-colors.md
```

**Both folders coexist as siblings** in the same parent when a section has both kinds. They serve different purposes and have different embed behavior — separating them is honest.

**Promotion:** if a supporting file starts in a section's `_assets/` or `_files/` and ends up referenced from another section, move it up to the pillar level. Don't link across sibling section folders.

### Within a single folder

Flat until ~10 files, then subfolder. **Prefer topic-based subfolders** (`_assets/screenshots/`, `_assets/diagrams/`) over **type-based** (`_assets/images/`, `_assets/svgs/`). Topic carries more signal.

### `_` prefix

Sorts above content folders, matches `_framework/` and `_example/`. Exempt from the `NN-` prefix rule.

### Embed syntax — `_assets/` (renderable)

Obsidian wikilink-embed. Two real files live in `_example/_assets/` — used here as live demos.

**Bare embed:**

```markdown
![[architecture-diagram.png]]
```

Renders as:

![[architecture-diagram.png]]

**With width constraint** (pixels after `|`):

```markdown
![[color-ramp.png|400]]
```

Renders as:

![[color-ramp.png|400]]

**Caption pattern** — italic line directly below the embed:

```markdown
![[color-ramp.png]]
*Brand ramp — primary hue, 5 stops.*
```

Renders as:

![[color-ramp.png]]
*Brand ramp — primary hue, 5 stops.*

### Showing `_files/` contents inline

Obsidian doesn't render `.txt/.css/.jsx/.html/.json` etc. To show their contents in a doc, paste them into a fenced code block. The actual file in `_files/` stays as the canonical source-of-truth.

````markdown
```
$ORIGIN another-creation.xyz.
@  IN  MX  10  mail.protonmail.ch.
```

Full file: `[[../_files/proton-records.txt]]` (link only; Obsidian won't render this inline).
````

### Naming

- Kebab-case, descriptive.
- **No `NN-` prefix.** Supporting files aren't navigated by file tree — they're embedded or linked by name. The numbering rule is doc-only.
- Namespace where ambiguity would otherwise exist (`acyr-logo-mark.svg` over `logo.svg`). Obsidian resolves embeds by filename across the vault — unique names avoid path management.
- When names must collide, use path-qualified embed: `![[03-setup/_assets/flow.png]]`. Path-qualified is friction; descriptive-unique names are the goal.

## Maintenance

Bulk moves and renames will outrun Obsidian's metadata cache. After any restructure (rename, move, prefix change):

1. **Reload Obsidian.** Open Command Palette (`Cmd-P`), search "Reload" → "Reload app without saving". Forces a metadata reindex. Pure-alias wikilinks like `[[colors]]` won't resolve until the cache catches up — they'll render unstyled in preview until then. Explicit-form wikilinks (`[[01-colors|colors]]`) are immune to this. (You can bind a shortcut to the Reload command under Settings → Hotkeys if you reload often.)
2. **Grep for old filenames** across `.md` files in the affected scope. Body-text references that aren't wikilinks (prose mentions, code blocks) won't auto-update — only Obsidian-managed wikilinks do.
3. **Spot-check wikilinks** in moved/renamed files. Broken links render unstyled in preview — easy to scan visually.
4. **`aliases:` must be kept in sync.** When renaming `01-colors.md` → `02-colors.md`, the alias entry stays (`aliases: [colors]`). When renaming the slug itself (`01-colors.md` → `01-tones.md`), update the alias to match.

### Wikilink form

Two forms render identically in preview but behave differently in resolution.

| Form | Source | Resolves via |
|---|---|---|
| Pure alias | `[[colors]]` | Obsidian's metadata cache + the target file's `aliases:` field |
| Explicit with display | `[[01-colors\|colors]]` | The filename directly. Display text after `\|` |

**Default: explicit with display.** Always resolves, immune to index state, survives renames at the alias level (`aliases:` can change without breaking links).

**Pure alias is acceptable when:**
- You're inside Obsidian and the index is current
- The alias is reliably unique vault-wide
- You explicitly value brevity over reliability

The framework's own cross-references all use the explicit form. The `aliases:` field stays in frontmatter because it still powers Quick Switcher autocomplete and search — but wikilinks themselves don't depend on it.
