---
name: log-work
description: Create a session log (always) and optionally a session-bridge handoff documenting work done and in-flight state
disable-model-invocation: true
argument-hint: "[brief description of work]"
_template:
  version: 1
  path: .claude/skills/log-work/SKILL.md
  sync: replace
---

# Log Work

Create a session log (retrospective) for the work just completed, and optionally a session-bridge handoff (forward-looking) if work is mid-arc. Ask the user BEFORE writing so the answer paces the work — don't dump a wall of writing on them first.

Summary from user: $ARGUMENTS

## Steps

1. Read the current `docs/llm-context/AGENT-CONTEXT.md` to understand prior state.

2. **Ask the user via `AskUserQuestion`:** "Do you also need a session-bridge handoff?" with two options:
   - **Yes — work is mid-arc.** Carries in-flight state to the next session.
   - **No — work concluded cleanly.** Session log is sufficient.

   The session log is always written. The answer only controls whether a handoff is also written.

3. Create a new session log at `docs/llm-context/session-log/!`date +%Y-%m-%d`-$ARGUMENTS.md` (slugify the description). Format:

```
# Session: [Brief Description]

**Date:** YYYY-MM-DD
**Agent:** [Your identifier]
**Summary:** [One-line description]

## Changes Made

### Files Modified
- path/to/file — [what changed]

### Features Added/Removed
- [Feature description]

## Current State

### Working
- [What's functional now]

### Known Issues
- [Any problems discovered]

## Next Steps
1. [Recommended next task]
2. [Follow-up work]
```

4. (If user picked **Yes** in step 2) Create a session-bridge handoff at `docs/llm-context/session-bridge/handoff-!`date +%Y-%m-%d-%H%M`-$ARGUMENTS.md`. Both files share the timestamp date, but the handoff includes `HHMM` so the startup protocol's "newer wins" rule can compare timestamps unambiguously. Format:

```
# Handoff — YYYY-MM-DD HH:MM

## Goal of the current arc
[One or two sentences on what this push is aiming at.]

## Last actions taken (causal trail, newest first)
- [Recent action]
- [Prior action]
- [etc.]

## Current state / open decision points
- [Where we are, what's blocking, what's been deferred]

## Next intended action
- [What the next session should do first]

## Working memory not yet in AGENT-CONTEXT
- [Observations, half-formed ideas, anything that doesn't earn a place in the long-lived doc but matters now]
```

5. Update `docs/llm-context/AGENT-CONTEXT.md` with any changes to long-lived state (status, what works, key files, contracts, etc).

6. Say "Session log created at [path]. [Handoff created at [path] | Handoff skipped — work concluded.] AGENT-CONTEXT.md updated."

## Notes

- The session log is past-tense and archival. The handoff is forward-looking and bridges to the next session.
- See `docs/llm-context/session-bridge/README.md` for the full protocol covering filename rules, the read-rule for the next session, and lifecycle.
- The user can manually edit or overwrite the handoff after `/log-work` produces it. Old handoffs accumulate as natural history; never auto-delete.
