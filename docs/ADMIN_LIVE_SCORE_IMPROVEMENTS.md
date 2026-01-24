Live Score — clear, step-by-step guide (short)

Goal
- Make it easy and safe for admins to update live scores: fast primary flow, clear save action, undo, and accessible announcements.

Top-level flow (what an operator does)
1. Pick match (search or dropdown).
2. Set toss (winner + decision) — this determines who bats first.
3. Enter an event (over.ball, batter, bowler, event type, runs/extras, optional note).
4. Press the single primary button `Save to Match` to commit the event.
5. If needed, use `Undo` (appears briefly) or the history/revert UI.

What must be on the page (short checklist)
- Header: teams, venue, start time, compact current score.
- Match selector: fast search/dropdown.
- Toss controls: editable, small, showing computed batting side.
- Single-row event entry form with: over.ball, batter, bowler, event type, runs, extras, note, AI suggestion (optional), and `Save to Match`.
- Commentary feed: chronological list with announcements (use `role="region" aria-live="polite" aria-atomic="true"`).
- Recent history: last N events with operator id and a revert action.

Data contract (minimal)
- POST /api/matches/:matchId/events
   - Example payload:
      {
         "over": 3,
         "ball": 2,
         "batterId": 18,
         "bowlerId": 4,
         "eventType": "run",
         "runs": 2,
         "extras": {"type": null, "runs": 0},
         "note": "quick single",
         "operatorId": "admin_joe",
         "clientTimestamp": 1670000000000
      }
   - Response: 200 + canonical event object: { eventId, serverTimestamp, ... }

Client behavior (recommended)
- Validate form fields client-side (required fields, numeric ranges).
- On `Save to Match` do an optimistic update:
   - Append a temporary entry to the feed with status `saving`.
   - POST the event to the server.
   - On success: replace the temp entry with the server event.
   - On failure: show `role="alert"` error and let operator retry or revert.
   - Show a short undo toast (10–20s) that calls a revert endpoint: POST /api/matches/:matchId/events/:eventId/revert.

Concurrency & conflicts
- Server should use a monotonic sequence or eventId per match.
- If client sends an out-of-order event, server returns 409 + suggested options.
- Client should show a lightweight merge UI when 409 occurs (apply as new, replace, or contact teammate).

Resilience
- Autosave the current form in localStorage every ~5–10s so a refresh doesn't lose work.
- Provide a `Background save` option for auto-commit workflows (optional).

Accessibility
- Use `role="region" aria-live="polite" aria-atomic="true"` for the commentary feed so screen readers announce updates.
- Use `role="status"` for non-critical info and `role="alert"` for errors.
- Ensure all controls have visible labels, logical tab order and keyboard support.

Small examples (pseudo)
- Optimistic save:

```js
appendToFeed({ id: 'tmp-'+Date.now(), ...form, status: 'saving' })
const res = await fetch(`/api/matches/${matchId}/events`, { method: 'POST', body: JSON.stringify(form) })
if (res.ok) { replaceOptimisticWith(await res.json()) }
else { markOptimisticFailed(); showAlert('Save failed') }
```

- Revert endpoint (server): POST /api/matches/:matchId/events/:eventId/revert — server stores an audit and marks the event reverted.

Testing checklist
- Unit tests: validate event payload generation, playerId→name mapping.
- Integration tests: POST /events, revert flows, server-side validation.
- E2E (Playwright): save happy path, optimistic UI, undo toast, conflict (409) resolution, and aria-live announcements.

Operational notes (short)
- Always store: operatorId, clientTimestamp, serverTimestamp, and before/after summary for every change.
- Protect write endpoints (rate limit / debounce rapid actions).
- If Cloudflare Functions hit publish limits for heavy logic, move the heavy parts (PDFs, long processing) to an external API.

Quick implementation checklist
- Add `aria-live` to commentary feed.
- Make `Save to Match` the primary CTA and disable when validation fails.
- Add optimistic UI + undo toast + revert endpoint on server.
- Add local autosave draft and a `Resume draft` affordance.

Files to change
- `src/app/ipl-admin-2026/live-score/page.tsx` — UI and optimistic save.
- `functions/api/live-commentary.js` — ensure commentary events map player IDs to names.
- `functions/api/matches/[matchId]/events.js` — implement POST and revert endpoints (if not present).

If you want, I can implement two small changes next: add `aria-live` to the commentary feed and make `Save to Match` the primary button with an optimistic save toast. Which should I do next?