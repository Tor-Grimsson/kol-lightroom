---
title: kol-docs framework
type: index
status: active
updated: 2026-05-18
description: Source of truth for how docs in kol-docs are organised, named, tagged, and cross-referenced.
tags:
  - framework/index
  - domain/conventions
aliases:
  - framework
---

# kol-docs framework

The spec every doc in `kol-docs/` conforms to. Frontmatter schema, archetypes, tag taxonomy, filename rules, asset handling.

## What's here

- [[01-conventions|conventions]] — frontmatter schema, status enum, link form, filename rules, asset handling
- [[02-archetypes|archetypes]] — the 9 doc types and what each is for
- [[03-tag-taxonomy|tag-taxonomy]] — controlled top-level tag namespaces
- `_example/` — a realistic docs folder with the system fully applied. Reference shape when starting a new project or normalising an existing one.

## Writing a new doc

1. Pick an archetype from [[02-archetypes|archetypes]]
2. Copy a matching file from `_example/` as the starting shape
3. Frontmatter rules in [[01-conventions|conventions]], tag rules in [[03-tag-taxonomy|tag-taxonomy]]

## Folder shape

```
_framework/
├── INDEX.md                  ← this file
├── 01-conventions.md
├── 02-archetypes.md
├── 03-tag-taxonomy.md
└── _example/                  ← reference docs folder
    ├── INDEX.md
    ├── _assets/
    ├── 01-architecture/
    ├── 02-audit/
    ├── 03-setup/
    ├── 04-guides/
    ├── 05-reference/
    ├── 06-plans/
    └── 07-log/
```
