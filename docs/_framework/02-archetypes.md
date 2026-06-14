---
title: Archetypes
type: reference
status: active
updated: 2026-05-18
description: The 9 doc types every doc in kol-docs is one of. What each is for, required and optional fields, body shape.
tags:
  - framework/archetypes
  - domain/conventions
aliases:
  - archetypes
related:
  - "[[01-conventions|conventions]]"
  - "[[03-tag-taxonomy|tag-taxonomy]]"
---

# Archetypes

Nine document types. Every doc in `kol-docs/` is exactly one of these.

Pick the type by **what the doc does for the reader**, not what the body looks like.

## The nine types

| Type | What it does | Typical filename |
|---|---|---|
| `index` | Routes to other docs. TOC, hub. | `INDEX.md` |
| `reference` | Lookup. Evergreen specs, tokens, tables, registries. | `01-colors.md` |
| `guide` | Explains how to build or use X. Conceptual + code. | `01-build-system.md` |
| `playbook` | Sequential, copy-pasteable runbook. Numbered steps. | `01-prerequisites.md` |
| `plan` | Forward-looking proposal. Roadmaps, migration plans. | `2026-05-18-restructure.md` |
| `decisions` | Locked architectural decisions. ADR-style. | `INDEX.md` in `01-architecture/` |
| `audit` | Snapshot inventory. Current-state survey. | `INDEX.md` in `02-audit/` |
| `narrative` | Long-form story. Themes, retrospectives. | `01-design-system.md` |
| `log` | Session record. What changed and when. | `2026-05-18-initial-build.md` |

## Per-archetype schema

### `index`

Routes readers to other docs. Body is mostly tables of children with one-line summaries.

**Required:** base set.
**Recommended:** `description`.
**Body:** Overview paragraph → table of contents → optional quick-reference section.

### `reference`

Evergreen lookup. Reader comes with a specific question.

**Required:** base set.
**Recommended:** `description`, `verified` (date of last reality-check), `aliases`.
**Optional:** `covers:` (list of what's documented), `sources:` (list of code paths the reference reflects).
**Body:** Overview → specifications → examples → related docs.

### `guide`

How to build or use X. Narrative, includes code.

**Required:** base set.
**Recommended:** `description`, `audience`.
**Optional:** `prerequisites:` (list of wikilinks).
**Body:** Purpose → prerequisites → walkthrough → examples → troubleshooting.

### `playbook`

Sequential runbook. Reader executes top-to-bottom, copy-pasting commands.

**Required:** base set, `audience`.
**Recommended:** `description`, `providers:` (list or nested object — external services involved).
**Optional:** `placeholders:` (list of `{{TOKENS}}` the playbook substitutes), `companion_to:` (wikilink).
**Body:** Overview → prerequisites → numbered sections (`## 0. Prerequisites`, `## 1. Step name`, etc.) → verification.

### `plan`

Forward-looking. Roadmaps, migration plans, refactor proposals.

**Required:** base set.
**Recommended:** `description`, `phases:` (list of phase names if multi-phase).
**Optional:** `superseded_by:`, `drift:`.
**Body:** Why → current state → target state → phases → acceptance criteria.

Plans rot fast. When the plan ships, mark `status: superseded` and point to the executed reality.

### `decisions`

Locked architectural decisions. ADR-style. Immutable once `canonical`.

**Required:** base set.
**Recommended:** `description`.
**Optional:** `supersedes:` (wikilink to the decision this replaces).
**Body:** Context → decision → consequences. One decision per file, OR a small set of related decisions for the same restructure.

### `audit`

Snapshot of current state.

**Required:** base set.
**Recommended:** `description`, `sources:` (list of code paths surveyed).
**Optional:** `covers:`.
**Body:** Scope → findings → recommendations (optional). Audits decay; usually `status: archived` or `superseded` within months.

### `narrative`

Long-form story. Themes, retrospectives, post-mortems.

**Required:** base set.
**Recommended:** `description`, `date_range:` (ISO range like `2025-10-14 → 2026-04-19`).
**Optional:** `repos:`, `themes:`, `tier:`, `log_count:`.
**Body:** Free-form prose with sections.

### `log`

Session record. **One file per session.**

**Required:** `title`, `type: log`, `status` (almost always `archived`), `updated:` (session date), `tags`.
**Recommended:** `description` (one-line "what shipped").
**Optional:** `repo:` (the repo worked on).
**Body:** `# Session: <description>` → `**Date:**` / `**Agent:**` / `**Summary:**` → `## Changes Made` → `## Current state` → optional `## Next steps`.

## Quick decision tree

- Routes to other docs? → `index`
- Looking up specs/tokens/tables? → `reference`
- Explaining how to do X? → `guide`
- Numbered steps to copy-paste? → `playbook`
- Future-looking? → `plan`
- Locked architectural call? → `decisions`
- Inventory snapshot? → `audit`
- Long-form story? → `narrative`
- Work session record? → `log`

If two fit, pick the one closest to **why the reader opened it**.
