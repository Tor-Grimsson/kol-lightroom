---
_template:
  version: 1
  path: docs/llm-context/README.md
  sync: notify-only
---

# LLM Context Directory

This directory provides context for AI agents working on kol-lightroom.

## Files

### ARCHITECTURE.md
Load-bearing decisions and constraints. The "these cannot be revisited without deliberate discussion" baseline. **Read this first.** Any proposal that contradicts this document must flag the contradiction explicitly.

### AGENT-CONTEXT.md
Current project state: what works, what's pending, file-level notes, active known issues, roadmap, contracts. Updated at the end of each significant session.

### session-log/
Chronological log of agent work sessions. Each file is a structured record of a single session's changes, discoveries, and follow-ups. Sort by date to find the most recent.

## Usage for AI Agents

When starting work on this project:

1. Read `/LLM_RULES.md` in the project root for onboarding
2. Read `ARCHITECTURE.md` for load-bearing decisions
3. Read `AGENT-CONTEXT.md` for current project state
4. Check the latest file in `session-log/` for recent context
5. Update `AGENT-CONTEXT.md` and add a new `session-log/` entry when completing significant work

Or run the `/init-agent` skill to automate reading, and `/log-work "brief description"` to automate writing a session log.

## LLM Context Protocol

Session logs follow a structured format:
- **Session metadata** — date, agent, one-line summary
- **Changes made** — files modified, features added/removed
- **Current state** — what works, what's pending
- **Next steps** — recommended follow-up tasks

This preserves continuity across different agents and sessions.
