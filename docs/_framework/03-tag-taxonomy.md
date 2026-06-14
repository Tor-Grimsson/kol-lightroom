---
title: Tag taxonomy
type: reference
status: active
updated: 2026-05-18
description: Controlled top-level tag namespaces. Closed set. Sub-levels free-form within reason.
tags:
  - framework/tag-taxonomy
  - domain/conventions
aliases:
  - tag-taxonomy
related:
  - "[[01-conventions|conventions]]"
  - "[[02-archetypes|archetypes]]"
---

# Tag taxonomy

Tags carry signal that frontmatter fields don't. Faceted classification — one doc gets multiple tags along orthogonal axes.

**Top-level tag namespaces are a closed set.** Sub-levels under each namespace are free-form but should reuse existing values when possible. Adding a new top-level namespace requires updating this doc first.

## Top-level namespaces

| Namespace | What it answers | Example |
|---|---|---|
| `project/` | Which project this belongs to. | `project/monorepo`, `project/acyr` |
| `domain/` | What subject area (typography, css, dns). | `domain/typography`, `domain/sanity`, `domain/dns` |
| `audience/` | Who reads this. Mirrors the optional `audience:` field; tag it for grep. | `audience/agency-internal`, `audience/client` |
| `provider/` | External services. | `provider/sanity`, `provider/vercel`, `provider/paypal` |
| `integration/` | A connection between two providers or systems. | `integration/paypal-printful`, `integration/vercel-serverless` |
| `pattern/` | Reusable design or architectural pattern. | `pattern/org-project-transfer`, `pattern/handoff-kit` |
| `brand/` | Brand-tier concerns (voice, assets, identity). | `brand/voice`, `brand/assets`, `brand/print` |
| `editor/` | Concerns specific to an editor surface. | `editor/reference/frame-state`, `editor/persistence` |
| `archive/` | Archive folder's internal taxonomy. Frozen — only used in archive pillars. | `archive/kol`, `archive/theme/website` |
| `framework/` | Concerns about kol-docs itself. Used inside `_framework/`. | `framework/conventions`, `framework/archetypes` |

## What's not a tag namespace

These exist as **frontmatter fields**, not tags. Don't duplicate.

- `type/` — that's the `type:` field. `tags: [type/reference]` duplicates `type: reference`.
- `status/` — same. `status: draft` is the truth; `tags: [status/draft]` is noise.
- `created/`, `updated/`, etc. — date fields, not tags.

## Sub-level conventions

- **Two levels typical, three max.** `archive/theme/website` is fine. `client/handoff/cms/sanity/migration/2026-05` is hostile — collapse it.
- **Reuse existing leaves.** If `provider/sanity` exists, don't introduce `provider/sanity-cms` for the same thing.
- **Kebab-case for multi-word leaves.** `pattern/org-project-transfer`, not `pattern/orgProjectTransfer`.

## Adding a new namespace

If a doc legitimately needs a tag that doesn't fit any existing namespace:

1. Try to fit an existing one first. Most "new" namespaces are sub-levels of an existing one.
2. If genuinely new, add the namespace to the table above with a one-line description, then use it.
3. Don't invent ad-hoc top-levels in individual docs.
