---
_template:
  version: 1
  path: docs/llm-context/session-bridge/README.md
  sync: replace
---

# session-bridge — in-flight handoffs between sessions

Short-lived handoff notes covering the gap between sessions when work is **not yet at a natural retrospective break.** Different from:

- `../session-log/` — past-tense, archival. Written when work *concludes* a meaningful unit.
- `../AGENT-CONTEXT.md` — long-lived project state. Captures committed facts, not in-flight thoughts.

A session bridge file fills the gap when you hit `/clear`, `/compact`, or just open a new chat mid-task — the agent's working memory ("I just tried X, was about to do Y, ran into Z") would otherwise be lost.

---

## Authorship

Handoffs are produced by the `/log-work` skill in the same batch as the session log — paired by design so the next session has both retrospective and forward-looking context. **The agent only writes handoffs via `/log-work`,** not as an arbitrary mid-conversation action. The user can manually edit or overwrite a handoff after it's created. Old handoffs accumulate as natural history — never auto-deleted.

---

## Filename pattern

```
handoff-YYYY-MM-DD-HHMM[-brief-slug].md
```

Example: `handoff-2026-05-15-2240-shipping-bug.md`

Session logs use only `YYYY-MM-DD`. The extra `HHMM` on handoffs is what makes the startup-protocol comparison unambiguous when both files share a date.

---

## Startup protocol

When a new session begins, after reading `ARCHITECTURE.md` and `AGENT-CONTEXT.md`:

1. Find the newest file in `../session-log/` (call its timestamp `T_log` — date only, `YYYY-MM-DD`).
2. Find the newest file in `./session-bridge/` matching `handoff-*.md` (call its timestamp `T_bridge` — `YYYY-MM-DD-HHMM`).
3. **Always read** the newest session log.
4. **Also read** the newest handoff if `T_bridge` is newer than `T_log`. **Same-date tie-break: handoff wins** — `/log-work` always writes the session log first and the handoff after, so on a same-date comparison the handoff is the more recent artifact by design. Skip the handoff only when its date is strictly older than the session log's date.
5. If multiple handoff files exist, only the newest matters per the rule above. Older handoffs are passive history; ignore them unless the user explicitly asks.

---

## What a handoff covers

The five things working memory tends to hold that nothing else captures:

1. **Goal of the current arc** — one or two sentences on what this push is aiming at.
2. **Last actions taken** (plural) — recent causal trail. "Tried X, didn't work, switched to Y, hit Z."
3. **Current state / blocker / decision point** — where you are and what's holding things.
4. **Next intended action** — what you (or the agent) were about to do next.
5. **Anything in working memory not yet in AGENT-CONTEXT** — observations, half-formed ideas, things that didn't earn a place in the long-lived doc but matter now.

Keep it brief. The handoff is a bridge, not a document.

---

## Lifecycle

- **Created** by `/log-work` when work is mid-arc (the skill asks; user picks "yes — work is mid-arc").
- **Read** by the next session's agent per the startup protocol.
- **Superseded** when work concludes and a retrospective session log is written *on a later date* — the protocol then prefers the newer session log over the older bridge.
- **Never deleted by the agent.** Old handoffs accumulate as natural history; the user prunes manually if they want.
