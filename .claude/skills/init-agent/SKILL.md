---
name: init-agent
description: Load project context for a new session
disable-model-invocation: true
allowed-tools: Read, Glob
_template:
  version: 2
  path: .claude/skills/init-agent/SKILL.md
  sync: replace
---

# Agent Initialization

Follow these steps exactly:

1. Read `/Users/biskup/dev/projects/kol-apparat/kol-lightroom/docs/llm-context/ARCHITECTURE.md` — load-bearing decisions and constraints
2. Read `/Users/biskup/dev/projects/kol-apparat/kol-lightroom/docs/llm-context/AGENT-CONTEXT.md` — current project state
3. Find the most recent session log in `/Users/biskup/dev/projects/kol-apparat/kol-lightroom/docs/llm-context/session-log/` (sort by date)
4. Read that session log
5. Check `/Users/biskup/dev/projects/kol-apparat/kol-lightroom/docs/llm-context/session-bridge/` for `handoff-*.md` files. If the newest handoff's timestamp is newer than the newest session log's timestamp, also read that handoff — it carries in-flight state. Otherwise skip. See `session-bridge/README.md` for the full protocol.
6. Say "Context loaded. What would you like me to work on?"
7. **STOP and WAIT** — do not start any work until the user specifies a task

If you find yourself proposing something that contradicts ARCHITECTURE.md, flag the contradiction to the user before acting. Those rules can be broken — but only deliberately.
