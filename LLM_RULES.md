---
_template:
  version: 1
  path: LLM_RULES.md
  sync: notify-only
---

# LLM Rules for kol-lightroom

---

## ⚠️ CRITICAL STARTUP PROTOCOL - READ THIS FIRST ⚠️

**WHEN THE USER SAYS "read `LLM_RULES.md`" YOU MUST:**

1. **READ** `/docs/llm-context/ARCHITECTURE.md` — load-bearing decisions and constraints
2. **READ** `/docs/llm-context/AGENT-CONTEXT.md` — current project state
3. **READ** the latest session log from `/docs/llm-context/session-log/` (sort by date, most recent first)
4. **CHECK** `/docs/llm-context/session-bridge/` for `handoff-*.md` files. If the newest handoff has a timestamp newer than the newest session log, **also READ that handoff** — it carries in-flight state the session log doesn't. Otherwise skip. See `/docs/llm-context/session-bridge/README.md` for the full protocol.
5. **STOP** and say "Context loaded. What would you like me to work on?"
6. **WAIT** for the user to specify their task

**DO NOT:**
- Skip reading the context files
- Start working before the user specifies a task
- Propose anything that contradicts `ARCHITECTURE.md` without flagging the contradiction first

**IF THE USER ASKS "Do you understand?" or "Outline the task?":**
Respond with a clear plan of what you'll do BEFORE taking any action.

---

# LLM Agent Onboarding

Welcome to **kol-lightroom** — KOL app for raw-image editing and CDN media delivery, built on a self-contained, inlined KOL design system.

## Quick Start

1. **Read this file** to understand the project structure
2. **Read** `/docs/llm-context/ARCHITECTURE.md` for load-bearing decisions
3. **Read** `/docs/llm-context/AGENT-CONTEXT.md` for current project state
4. **Check** `/docs/llm-context/session-log/` for the most recent session log
5. **Follow** the conventions and guidelines below

## Project Overview

A single self-contained Vite app carrying a frozen snapshot of the KOL design system as inlined source — `src/components/` (atoms/molecules/organisms/primitives/graphics/hooks/loaders/framework) + `src/styles/` (kol-*.css). Structure mirrors the canonical reference `kol-client-kolkrabbi`. Zero dependency on the source website monorepo. Scaffolded 2026-06-13 from the `_kol-labs-single-init-state` template; the goal domain is raw-image editing (NEF/DNG/CR2/TIFF + color-correction layers) and high-quality image/video delivery via the kolkrabbi Backblaze B2 CDN.

### Tech Stack

pnpm (single project) · React 19 + Vite 8 + Tailwind 4 · inlined KOL design-system snapshot

### Package Manager

<!-- If this project uses a specific package manager, document it here. Example: -->
<!-- **⚠️ IMPORTANT: This project uses Yarn, NOT npm** -->
<!-- Remove this section if no package.json. -->

## Directory Structure

<!-- Paste `tree -L 2` output or hand-write the top-level structure here -->

```
kol-lightroom/
├── ...                            (project-specific)
├── docs/
│   ├── history.md                 decision history — the "why"
│   ├── plan.md                    future exploration (optional)
│   └── llm-context/
│       ├── README.md
│       ├── ARCHITECTURE.md        load-bearing decisions
│       ├── AGENT-CONTEXT.md       current state, roadmap, gotchas, contracts
│       └── session-log/
├── README.md
└── LLM_RULES.md                   this file
```

## LLM Context Protocol

This project uses **session logs** to maintain context across agents and sessions.

### Reading Context

**Always read the latest session log** in `/docs/llm-context/session-log/` before starting work. Session logs are named:
- `YYYY-MM-DD-brief-description.md`

Sort by date to find the most recent.

### Writing Context

When you complete significant work:
1. Create a new session log in `/docs/llm-context/session-log/`
2. Use the format: `YYYY-MM-DD-brief-description.md`
3. Include: session metadata, changes made, current state, next steps
4. Update `AGENT-CONTEXT.md` if the project's current state changed

Or use the `/log-work` skill to automate this.

## Working Conventions

### Code Style

- **No over-engineering** — Make only requested changes
- **Remove unused code** — Delete completely, no backwards-compat hacks
- **Edit over create** — Prefer modifying existing files
- **Use existing patterns** — Follow established naming and structure
- **Apply exact values** — When user specifies a concrete number, use it

### Filename Conventions

- **Protocol files UPPERCASE:** `LLM_RULES.md`, `ARCHITECTURE.md`, `AGENT-CONTEXT.md`, `README.md`, `SKILL.md`.
- **Content files kebab-case:** `history.md`, `plan.md`, session logs.

### Non-goals

<!-- List anything explicitly out of scope. If none yet, delete this section. -->

### Git Workflow

- Only commit when explicitly asked
- Write clear, concise commit messages
- Never force push or use destructive commands without permission
