# SportsUP99 Admin And End-User Upgrade Research Plan

Research date: 2026-06-03  
Project path: `/Users/anvesh/Downloads/sportsup99`  
Stack observed: Next.js 14, React 18, Cloudflare Pages Functions, Cloudflare KV, Tailwind, Playwright

## Executive Summary

SportsUP99 already has a broad cricket platform: IPL/WPL public pages, live score, scorecards, teams, players, news, predictions, notifications, account features, and separate IPL/WPL admin areas. The biggest opportunity is not adding random new pages. The priority should be:

1. Secure the admin system.
2. Make match/live-score data reliable and reversible.
3. Replace mock/fallback operational data with real analytics and monitoring.
4. Upgrade end-user retention through personalization, notifications, PWA support, search, and richer match center experiences.
5. Improve mobile performance, accessibility, and SEO.

The current codebase has several production-risk patterns:

- Hardcoded admin credentials exist in `src/lib/auth.ts` and `functions/api/admin/login.js`.
- Some mutation APIs only check whether a Bearer token exists, not whether it belongs to a valid admin.
- Admin role checks are partially client-side and mock-based.
- Build scripts skip type-checking and linting.
- Some dashboards, analytics, notifications, and support APIs still use mock or local-only data.
- Cloudflare KV is used heavily for data that may need stronger consistency, audit history, and transactional updates.

The recommended roadmap is:

- Phase 0: Admin security, permission model, session handling, and API protection.
- Phase 1: Data model cleanup, audit logs, rollback/versioning, and import validation.
- Phase 2: Admin operations cockpit, live score workflow, real analytics, and alerts.
- Phase 3: End-user personalization, PWA, notifications, search, match center, and gamification.
- Phase 4: Performance, accessibility, SEO, and automated QA hardening.

## Online Research Sources Used

### Security And Admin

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/

### Cloudflare Architecture

- Cloudflare KV consistency and guidance: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- Cloudflare D1 overview and Time Travel: https://developers.cloudflare.com/d1/

### Frontend, UX, Accessibility, SEO

- Next.js Image Optimization: https://nextjs.org/docs/app/getting-started/images
- web.dev Core Web Vitals: https://web.dev/articles/vitals
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MDN Progressive Web Apps: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- MDN Web Push API best practices: https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Best_Practices
- Schema.org SportsEvent: https://schema.org/SportsEvent

### Cricket Product Benchmarking

- Cricbuzz live scores: https://www.cricbuzz.com/cricket-match/live-scores
- IPL official points table: https://www.iplt20.com/points-table/men/2025
- IPL official news: https://www.iplt20.com/news
- IPL official mobile products: https://www.iplt20.com/mobile-products
- ICC rankings: https://www.icc-cricket.com/rankings

## What The Research Means For This Project

### 1. Security Research

OWASP's API security guidance highlights broken object-level authorization, broken authentication, broken function-level authorization, unrestricted resource consumption, security misconfiguration, and poor API inventory as major risks. Those map directly to current repo patterns:

- Admin endpoints are numerous and not consistently protected.
- Some endpoints validate only token presence.
- Role and permission logic is partly client-side.
- Debug/demo routes and fallback hardcoded credentials are present.
- CORS is permissive in many functions.

Password research also matters here. OWASP recommends adaptive password hashing such as Argon2id, scrypt, bcrypt, or PBKDF2, and specifically warns against fast hashes such as SHA-256 for password storage. The repo currently uses SHA-256 based helpers in account/admin auth paths.

Session research matters because localStorage tokens are exposed to client-side script. OWASP session guidance treats the session token as equivalent to the active authentication strength. For this project, admin sessions should be server-issued, revocable, rotated after privilege change, and stored using secure HttpOnly cookies.

### 2. Cloudflare Research

Cloudflare KV is optimized for high-read and relatively low-write use cases. Cloudflare documents eventual consistency, propagation delays, and lack of transactional/atomic behavior. That means KV is reasonable for cached teams, static configuration, preferences, and read-heavy public data. It is weaker for:

- Live ball-by-ball score mutations.
- Admin edits that must not conflict.
- Audit logs that need reliable ordering.
- Scorecard publication workflows.
- Import rollback and version history.
- User predictions, votes, and leaderboard consistency.

Cloudflare D1 is a better fit for relational data, queryable audit logs, admin activity, predictions, and entities with revision history. Durable Objects are a better fit for a live match state coordinator where write ordering matters. KV can remain as an edge cache after canonical writes are stored elsewhere.

### 3. Product Benchmarking

Cricbuzz emphasizes live/current/recent/upcoming tabs and links each live match to live score, scorecard, full commentary, and news. IPL's official site exposes matches, points table, videos, news, teams, fantasy, stats, head-to-head, team comparison, fan contests, photos, auction, venues, and mobile products. IPL's mobile page emphasizes live scores, breaking stories, highlights, press conferences, speed, clarity, and reorganized navigation.

SportsUP99 already has many of those areas. The gaps are in quality, cohesion, and reliability:

- The match center can become the hub for score, scorecard, commentary, playing XI, venue, weather, prediction, and share features.
- Admin can get closer to an operations console instead of separate pages that require manual checking.
- Public pages can become personalized around followed teams/players.
- Notifications should become a trust-based product feature, not just localStorage state.

### 4. Performance And Accessibility Research

web.dev's current Core Web Vitals set is LCP, INP, and CLS. For SportsUP99, the biggest risk areas are:

- Heavy motion on home, team, stats, and live pages.
- Many images and logos.
- Large admin pages with thousands of lines of client-side code.
- Client-side data loading and localStorage hydration.
- Possible layout shifts from dynamic score, logo, and card content.

Next.js Image optimization should be used consistently for public visual assets. WCAG 2.2 makes focus visibility, focus not being obscured, target size, keyboard access, and status messaging important for both admin and public flows. This matters especially for live score controls, modals, team filters, search, and mobile navigation.

### 5. PWA And Notifications Research

MDN describes PWAs as web apps that can be installable, work offline/background, and integrate with the device. That fits cricket fans well:

- Offline fixtures.
- Saved favorite teams.
- Fast match center launch.
- Home-screen install.
- App badge for unread match alerts.

MDN push notification guidance stresses that notifications should be assistive, not disruptive, and permission prompts require user trust. SportsUP99 should ask for notification permission only after the user chooses a favorite team or taps a specific "Remind me" action.

## Repo Audit Highlights

These are not exhaustive, but they are enough to define the upgrade direction.

### Admin/Auth Findings

- `src/lib/auth.ts` contains mock admin users and hardcoded password checks.
- `functions/api/admin/login.js` contains hardcoded admin users and base64 JSON token generation.
- `src/app/ipl-admin-2026/layout.tsx` stores admin tokens in localStorage and parses token payloads client-side.
- `src/components/admin/PermissionGuard.tsx` hardcodes `userRole: 'admin'`.
- `functions/api/players.js`, `functions/api/content.js`, `functions/api/scorecards.js`, and related endpoints include "basic admin token check" patterns.
- Many API files use `Access-Control-Allow-Origin: '*'`.
- `functions/_middleware.ts` logs every request path directly.

### Build And QA Findings

- `package.json` production build uses `SKIP_TYPE_CHECK=true` and `SKIP_LINT=true`.
- `tsconfig.json` is strict, but build bypasses the value of strictness.
- Test coverage is thin compared with app size:
  - `test/matchUtils.test.ts`
  - `tests/playwright/live-commentary.spec.ts`
  - `tests/playwright/live-score.spec.ts`
- Admin critical flows such as login, role enforcement, match import, score entry, scorecard publish, and rollback do not appear to have broad automated coverage.

### Data And Product Findings

- Public and admin pages cover many features, but some important data is still mock or local-only.
- `src/app/ipl-admin-2026/dashboard/page.tsx` uses mock page views.
- `src/app/notifications/page.tsx` relies on localStorage fallback for notifications.
- `functions/api/issues/*.ts` uses mock/in-memory issue data.
- Some AI/weather/analytics endpoints generate random values.
- KV is used as a general store for data that may need stronger consistency.
- Several admin components are very large, especially match and scorecard workflows.

## Admin Side: What Needs To Change

### Priority 0: Admin Security

This should be implemented before adding more admin features.

#### Change 1: Remove hardcoded admin accounts

Current problem:

- Admin users `admin/admin123` and `manager/manager123` exist in code.
- Demo route displays demo credentials.
- Hardcoded users are synced into KV in some login paths.

Recommended implementation:

- Delete hardcoded users from `src/lib/auth.ts` and `functions/api/admin/login.js`.
- Keep a one-time admin bootstrap endpoint only if protected by an env secret such as `ADMIN_SETUP_SECRET`.
- Automatically disable setup once the first `super_admin` exists.
- Remove or protect `/ipl-admin-2026/demo`.
- Add a migration script to create the first real admin from a secure CLI flow.

Acceptance criteria:

- `rg "admin123|manager123|Mock admin users"` returns no production auth references.
- Login fails unless the user exists in the admin user store.
- Setup endpoint returns 404 or 403 in production after bootstrap.

#### Change 2: Replace localStorage admin tokens

Current problem:

- Admin token is stored in localStorage/sessionStorage.
- Layout parses token role client-side.
- Base64 JSON tokens are not signed JWTs.

Recommended implementation:

- Use opaque session IDs stored in HttpOnly, Secure, SameSite cookies.
- Store a hash of the session ID server-side with user ID, role, expiry, last-used time, IP/device metadata, and revoked flag.
- Rotate session ID after login, privilege change, password change, and 2FA changes.
- Add idle timeout and absolute timeout.
- Keep a short-lived CSRF token for state-changing requests, or use SameSite plus explicit origin validation.

Acceptance criteria:

- Admin pages can authenticate without reading admin tokens from localStorage.
- State-changing admin APIs reject missing/invalid sessions.
- Logout revokes the server-side session.
- Changing admin role invalidates existing sessions for that admin.

#### Change 3: Centralize admin auth and permissions

Current problem:

- Auth checks are repeated and inconsistent.
- Some admin endpoints only check Bearer token presence.
- UI-level permission guard is not enough.

Recommended implementation:

- Add a shared helper, for example `functions/lib/admin-auth.ts`.
- Expose:
  - `requireAdmin(context, { roles, permission })`
  - `getCurrentUser(context)`
  - `assertCsrf(context)`
  - `writeAuditLog(context, action, entity, before, after)`
- Use this helper in every admin mutation endpoint.
- Define permissions by action, not only role:
  - `matches:create`
  - `matches:update`
  - `matches:delete`
  - `score:update`
  - `score:publish`
  - `players:update`
  - `news:publish`
  - `admins:manage`
  - `settings:update`
  - `audit:read`

Acceptance criteria:

- A non-admin user cannot call admin mutation APIs.
- A `players_admin` cannot mutate matches, scorecards, settings, or admins.
- A viewer can read selected admin data but cannot write.
- Permission checks are enforced server-side.

#### Change 4: Upgrade password storage

Current problem:

- SHA-256 helpers exist for password storage/verification.

Recommended implementation:

- Prefer Argon2id where practical.
- If Workers compatibility blocks Argon2id, use a carefully configured supported alternative:
  - bcrypt with adequate work factor for admin accounts, or
  - PBKDF2-HMAC-SHA-256 with high iteration count using Web Crypto.
- Store algorithm and parameters with each password hash so legacy hashes can be upgraded on login.
- Add password reset and forced reset for legacy SHA-256 users.

Acceptance criteria:

- New password records include `passwordHash.algorithm`.
- Legacy SHA-256 users are forced through reset or upgraded after successful login.
- Admin password change invalidates all old sessions.

#### Change 5: Harden API security

Recommended changes:

- Replace permissive CORS with an allowlist:
  - production domain
  - preview domains if needed
  - localhost for development
- Rate-limit login, signup, prediction submit, comment/message submit, issue report, and email endpoints.
- Add Turnstile verification to signup and abuse-prone public forms.
- Add request size limits and schema validation.
- Add idempotency keys for score entry, scorecard publish, import, and bulk email.
- Maintain an API inventory document for all `functions/api/**` routes.

Acceptance criteria:

- Automated test proves unauthenticated writes are rejected.
- Automated test proves wrong-role writes are rejected.
- CORS does not allow arbitrary origins in production.
- Login has lockout/rate-limit telemetry.

### Priority 1: Data Reliability

#### Change 1: Separate canonical data from cache

Recommended data roles:

- D1:
  - users
  - admin users
  - sessions
  - matches
  - ball events
  - scorecard revisions
  - predictions
  - votes
  - audit logs
  - notifications
  - issues/support tickets
- Durable Objects:
  - current live match coordinator
  - write ordering for score updates
  - conflict prevention for simultaneous score admins
- KV:
  - public read cache
  - team config
  - logos/config
  - user preferences where immediate consistency is not critical
  - static schedule cache

Why:

- KV is eventually consistent and not transactional.
- Live scoring needs ordered writes.
- Admin rollback needs revision history.
- Predictions and votes need duplicate protection.

#### Change 2: Add revision history and rollback

Entities that need versioning:

- Match schedule
- Match status
- Playing XI
- Live score state
- Scorecard
- Points table
- Player stats
- News/content
- Settings

Each revision should include:

- `entityType`
- `entityId`
- `revisionId`
- `before`
- `after`
- `changedBy`
- `changedAt`
- `reason`
- `source` such as manual, import, sync, script, scheduled job

Admin UI additions:

- View history
- Compare revision
- Restore previous revision
- Require reason for destructive changes

#### Change 3: Improve imports

Current import-related areas:

- Player upload
- Match schedule import
- Scorecard import/export
- Dataset manager

Recommended import workflow:

1. Upload file.
2. Parse into preview table.
3. Validate fields:
   - league
   - season
   - teams
   - venues
   - date/time
   - duplicate match slot
   - player/team ID mappings
4. Show errors and warnings before save.
5. Save as an import batch.
6. Allow rollback by import batch.
7. Write audit log.

Acceptance criteria:

- Admin can preview imports before writing.
- Invalid team IDs cannot silently create bad data.
- Duplicate fixtures are flagged.
- A single import batch can be reverted.

### Priority 2: Admin Operations UX

#### Add 1: Live Operations Cockpit

Create one page for match-day operators:

Route suggestion:

- `/ipl-admin-2026/operations`
- `/wpl-admin-2026/operations`

Sections:

- Today's matches
- Active live match
- Score freshness
- Last ball timestamp
- Current innings
- Current striker/non-striker/bowler
- Stale score warning
- Scorecard draft/published status
- Playing XI status
- Notification queue status
- Live user count
- Recent admin actions
- Failed API/sync alerts

Actions:

- Open live score editor
- Publish scorecard
- Send match alert
- Mark delayed/abandoned/no result
- Roll back last ball
- Lock match editing
- Assign scorer/admin

#### Add 2: Better live score admin

Recommended live score features:

- Explicit match state machine:
  - scheduled
  - toss
  - playing XI locked
  - innings 1 live
  - innings break
  - innings 2 live
  - super over
  - result pending
  - completed
  - abandoned/no result
- Ball event log with undo.
- Conflict detection when two admins edit same ball.
- Keyboard-friendly scoring controls.
- Validation:
  - no more than 6 legal balls per over
  - innings cannot exceed max overs unless super over/rules allow
  - wicket count max 10
  - no impossible player/bowler selection
  - no scorecard publish until result fields pass validation
- "Preview public page" side panel.
- "Save draft" and "publish" separation.

#### Add 3: Admin dashboard should be real

Replace mock stats with:

- Active sessions
- Match center viewers
- Live page viewers
- Message volume
- Prediction entries
- Notification sends/open/clicks
- Error counts
- Admin actions
- Score update latency
- API response latency
- Failed cron jobs

Recommended event names:

- `page_view`
- `match_view`
- `live_score_poll`
- `prediction_submit`
- `notification_sent`
- `notification_opened`
- `admin_login`
- `admin_update_match`
- `admin_publish_scorecard`
- `admin_import_players`
- `api_error`

#### Add 4: Real audit, activity, and version pages

Current endpoints for audit/user activity/versions return mock data. Convert them to real data.

Admin pages:

- `/ipl-admin-2026/audit`
- `/ipl-admin-2026/activity`
- `/ipl-admin-2026/versions`

Filters:

- Admin
- Entity type
- Entity ID
- Action
- Date range
- League
- Severity

Exports:

- CSV
- PDF
- JSON

#### Add 5: Content/news workflow

Recommended CMS upgrades:

- Draft/review/published states.
- Schedule publish date.
- SEO title/meta description.
- Canonical URL.
- Open Graph image.
- Related match/team/player selection.
- Article schema.
- Preview public page.
- Image validation.
- Author attribution.
- Approval history.

#### Add 6: Admin user management

Recommended fields:

- name
- email
- role
- permissions
- status
- MFA enabled
- last login
- last active
- created by
- created at
- session count

Recommended actions:

- invite admin
- disable admin
- force password reset
- revoke sessions
- require MFA
- assign league scope
- assign team scope

### Priority 3: Monitoring And Incident Response

Add a production health model:

- API uptime
- KV/D1 read/write failures
- score update latency
- match score stale time
- cron success/failure
- email send failures
- notification failures
- content publish failures
- unexpected 500s
- admin login failures
- suspicious repeated write attempts

Alert examples:

- "Live match score has not updated for 5 minutes."
- "Scorecard publish failed."
- "Player import changed more than 50 rows."
- "Admin login failures exceeded threshold."
- "Email queue retry count exceeded threshold."
- "Public live-score page has elevated errors."

Add an incident workflow:

- incident ID
- severity
- affected feature
- owner
- status
- timeline
- notes
- resolution
- postmortem action items

## End-User Side: What Needs To Change

### Priority 0: Truthful Data And Stable UX

#### Change 1: Replace fake analytics and local-only notifications

Current problems:

- Public analytics page has mock data.
- Notifications use localStorage fallback and mixed API/local behavior.

Recommended implementation:

- If data is unavailable, show a real empty state.
- Store notification records server-side.
- Store per-user read/archive state server-side.
- Keep localStorage only as a short-term offline cache.

Acceptance criteria:

- Reloading on another browser/device shows the same notification state.
- Public analytics does not display invented metrics.
- Empty states explain what data is missing without pretending data exists.

#### Change 2: Improve loading, stale, and offline states

Add across public pages:

- `lastUpdated`
- loading skeleton
- retry button
- stale data banner
- offline banner
- "data source unavailable" state
- graceful partial rendering

Important pages:

- `/live-score`
- `/matches`
- `/matches/[matchId]`
- `/teams/[teamId]`
- `/players/[playerId]`
- `/stats`
- `/predictions`
- `/notifications`

### Priority 1: Match Center Upgrade

Create a premium match center that rivals common cricket sites.

Recommended route:

- `/matches/[matchId]`

Tabs:

- Overview
- Live
- Scorecard
- Commentary
- Playing XI
- Stats
- Head-to-head
- Venue/weather
- Predictions
- News

Overview should show:

- match status
- teams/logos
- toss
- venue
- date/time in user's timezone
- live score summary
- result text
- player of the match
- points table impact
- share card

Live tab should show:

- current score
- target/required rate
- striker/non-striker/bowler
- last 6 balls
- innings timeline
- ball-by-ball commentary
- stale/reconnect state

Scorecard tab should show:

- innings summary
- batting table
- bowling table
- extras
- fall of wickets
- partnerships
- man of the match

Stats tab should show:

- top run scorers in match
- top wicket takers
- run rate graph
- wagon/worm style chart if data exists
- boundary breakdown

Venue/weather tab should show:

- stadium
- city
- weather
- dew estimate if supported
- pitch notes
- past match notes if available

### Priority 2: Personalized Home

Recommended additions:

- "Following" module:
  - favorite teams
  - favorite players
  - next match
  - latest news
  - player milestones
- "For you" feed:
  - upcoming favorite team matches
  - relevant news
  - prediction prompts
  - top stats for followed players
- "Continue watching":
  - last viewed match center
  - last viewed team
  - last viewed player

Data model:

- `favoriteTeamIds`
- `favoritePlayerIds`
- `notificationPreferences`
- `recentViews`
- `followedLeagues`

### Priority 3: PWA And Notifications

PWA features to add:

- web app manifest
- app icons
- install prompt after user engagement
- service worker
- offline cached shell
- offline fixtures and favorite teams
- app shortcuts:
  - Live Score
  - Matches
  - My Teams
  - Predictions
- badge count for unread notifications where supported

Notification product rules:

- Do not ask for permission on first page load.
- Ask after a user follows a team/player or taps "Remind me".
- Give granular preferences:
  - match start
  - toss
  - playing XI
  - wicket
  - innings end
  - result
  - favorite player milestone
  - news digest
  - prediction deadline
- Add quiet hours.
- Add frequency caps.
- Add unsubscribe/disable controls.

Server data:

- push subscription endpoint
- notification queue
- delivery log
- read/archive state
- user preference sync

### Priority 4: Search

Add global search across:

- teams
- players
- matches
- news
- rules
- venues

Search UX:

- `/search?q=...`
- navbar command palette
- category tabs
- recent searches
- popular searches
- typo-tolerant matching
- quick actions:
  - open live score
  - follow team
  - view player stats

Index fields:

- player name
- team short name
- aliases
- venue
- match number
- news title
- tags
- roles
- nationality

### Priority 5: Predictions And Gamification

Keep predictions cricket-focused rather than generic.

Add:

- private friend leagues
- weekly leaderboard
- team fan leaderboard
- streaks
- badges
- prediction cutoff before match start
- locked predictions after toss if needed
- explain scoring rules
- anti-duplicate vote protection
- abuse detection

Prediction types:

- match winner
- player of the match
- top scorer
- top wicket taker
- total sixes
- first wicket method
- powerplay score range

Admin controls:

- create prediction markets
- close market
- settle result
- recalculate leaderboard
- detect suspicious activity

### Priority 6: Team And Player Pages

Team page upgrades:

- next match
- recent form
- squad grouped by role
- captain/coach
- home ground
- head-to-head
- season stats
- news
- trophies/history
- follow button
- share card

Player page upgrades:

- profile
- role
- team
- batting/bowling stats
- recent form
- milestones
- match-by-match stats
- nationality
- follow button
- comparison
- news mentions

Stats page upgrades:

- filters:
  - league
  - season
  - team
  - role
  - minimum matches
- leaderboard cards:
  - orange/purple cap style
  - best strike rate
  - economy
  - wickets
  - catches
- explain qualification rules.

### Priority 7: News And Content

Add:

- categories
- tags
- related teams/players/matches
- author
- publish date
- read time
- share buttons
- "related stories"
- match report template
- injury/replacement template
- announcement template
- SEO metadata
- article structured data

Public content quality:

- Do not mix official facts with AI-generated claims unless clearly labeled.
- Cite official sources where match reports or rule changes are based on outside information.
- Add editorial review for AI-generated drafts.

### Priority 8: Accessibility

Target WCAG 2.2 AA for important flows.

Fix areas:

- keyboard navigation for navbar, filters, tabs, modals, score controls
- visible focus states
- focus not hidden by sticky headers
- semantic tables for scorecards and points tables
- status messages for live score updates
- reduced motion support across animation-heavy pages
- accessible names for icon buttons
- color contrast
- target size on mobile
- avoid text overlapping in cards/buttons

Admin-specific accessibility:

- live score controls must be usable by keyboard
- modals must trap focus
- destructive actions need confirmation and clear labels
- toast messages need screen-reader announcements

### Priority 9: Performance

Targets:

- LCP: under 2.5 seconds at 75th percentile
- INP: 200 ms or lower at 75th percentile
- CLS: 0.1 or lower at 75th percentile

Recommended work:

- Replace remaining public `<img>` usage with `next/image`.
- Add image dimensions and stable aspect ratios.
- Lazy-load below-fold sections.
- Reduce heavy Framer Motion on mobile and respect reduced motion.
- Split large admin pages into smaller components.
- Dynamically import PDF/Excel/export libraries only when needed.
- Avoid loading admin-only libraries on public pages.
- Add `web-vitals` collection endpoint.
- Add Playwright performance smoke tests for key pages.

### Priority 10: SEO And Sharing

Add structured data:

- `SportsEvent` for matches
- `SportsTeam` for teams
- `Person` for players
- `Article` for news
- `BreadcrumbList` for detail pages

Add metadata:

- Open Graph images
- Twitter/X card metadata
- canonical URLs
- sitemap by league/season
- robots rules
- noindex for admin/demo/test pages

Share cards:

- match result card
- live score card
- player milestone card
- prediction result card
- points table snapshot

## WPL-Specific Recommendations

The app already has WPL routes, but WPL should not feel like a smaller copy of IPL.

Add:

- WPL-specific stats parity.
- WPL player discovery.
- WPL match center parity.
- WPL team visual identity.
- WPL leaderboard and predictions.
- WPL news categories.
- WPL admin operations cockpit.

Avoid:

- Hiding stats because WPL has less data.
- Using IPL-only assumptions in forms.
- Hardcoding IPL team IDs in shared logic.

## Suggested Architecture After Upgrade

### Data Flow

1. Admin writes canonical change.
2. Server validates role, schema, and state transition.
3. Write goes to D1 or Durable Object.
4. Audit log is written.
5. Public cache in KV is invalidated or refreshed.
6. Live clients get update through polling/SSE/WebSocket strategy.
7. Monitoring event is emitted.

### Storage Split

| Data | Recommended Store | Reason |
| --- | --- | --- |
| Static team config | KV or D1 + KV cache | Read-heavy |
| Match schedule | D1 canonical, KV cache | Queryable and versioned |
| Live ball events | Durable Object + D1 event log | Ordered writes |
| Scorecard revisions | D1 | Version history |
| Admin sessions | D1/KV with hashed session IDs | Revocable auth |
| Audit logs | D1 | Query/export |
| Notifications | D1 | Per-user state |
| Public page cache | KV | Fast reads |
| User preferences | D1 or KV | Depends on consistency needs |
| Predictions/votes | D1 | Deduplication and leaderboard |

## Implementation Roadmap

### Phase 0: Security Foundation

Duration: 1 to 2 weeks

Tasks:

- Remove hardcoded admins and demo credentials.
- Implement server-side admin sessions.
- Add centralized auth/permission helper.
- Protect all admin mutation endpoints.
- Replace localStorage admin token usage.
- Add CORS allowlist.
- Add login rate limiting.
- Add audit logging base table/store.
- Stop skipping type-check/lint in build, or create a staged CI path that fails on new errors.

Deliverables:

- Secure login.
- Role enforcement.
- API auth tests.
- First audit logs.

### Phase 1: Data Integrity

Duration: 2 to 3 weeks

Tasks:

- Define canonical schemas for matches, teams, players, scorecards, events, notifications, predictions.
- Move high-consistency entities to D1 or Durable Objects.
- Add revision history for matches, scorecards, playing XI, points table.
- Add rollback UI.
- Add import preview and rollback.
- Add schema validation to APIs.

Deliverables:

- No silent bad imports.
- Scorecard/match rollback.
- Cleaner canonical data model.

### Phase 2: Admin Operations

Duration: 2 to 3 weeks

Tasks:

- Build operations cockpit.
- Upgrade live score workflow.
- Replace mock dashboard metrics.
- Implement real audit/activity/version pages.
- Add alerting for stale live scores and failed jobs.
- Add admin role management improvements.

Deliverables:

- Match-day admin can operate from one page.
- Admin can inspect and recover from mistakes.
- Real operational metrics.

### Phase 3: End-User Engagement

Duration: 3 to 5 weeks

Tasks:

- Upgrade match center.
- Add personalized home modules.
- Add server-backed notifications.
- Add PWA install/offline shell.
- Add global search.
- Upgrade predictions/gamification.
- Add share cards.

Deliverables:

- Better retention.
- Better match-day experience.
- Better mobile experience.

### Phase 4: Quality, Performance, SEO

Duration: ongoing

Tasks:

- Replace remaining public image tags.
- Add Core Web Vitals tracking.
- Add accessibility checks.
- Add structured data.
- Add sitemap and noindex admin/test/demo routes.
- Expand Playwright coverage.
- Split large admin components.

Deliverables:

- Measurable performance.
- Better SEO.
- Lower regression risk.

## Recommended Test Plan

### Unit Tests

- match state machine
- score calculation
- result text generation
- player stats calculation
- points table calculation
- auth permission helpers
- import validators
- notification preference logic

### API Tests

- unauthenticated admin writes rejected
- wrong role writes rejected
- players admin scope enforced
- scorecard publish validation
- prediction duplicate prevention
- issue report validation
- notification preference updates

### Playwright E2E Tests

Admin:

- login/logout
- role-restricted page access
- create/edit match
- import matches preview
- enter live score ball
- undo live score ball
- publish scorecard
- rollback revision

End-user:

- home loads
- matches list loads
- match center loads
- live score stale state
- account signup/signin
- favorite team save
- notification preference save
- prediction submit
- search results

### Accessibility Tests

- keyboard-only nav
- modal focus trap
- scorecard table semantics
- visible focus states
- reduced motion mode
- color contrast

## Metrics To Track After Implementation

### Admin Metrics

- failed login rate
- admin session count
- admin write actions per day
- rollback count
- import errors
- score update latency
- stale live score incidents
- scorecard publish failures
- notification queue failures
- API 500 count

### User Metrics

- live score views
- match center views
- notification opt-in rate
- favorite team set rate
- prediction submit rate
- repeat visits by favorite team users
- search usage
- PWA install rate
- article reads
- share clicks

### Performance Metrics

- LCP
- INP
- CLS
- JS bundle size by route
- image transfer size
- API latency
- error rate by endpoint

## High-Impact Backlog

### Admin Backlog

| Priority | Item | Impact | Effort |
| --- | --- | --- | --- |
| P0 | Remove hardcoded admin credentials | Critical security | Medium |
| P0 | Central admin auth helper | Critical security | Medium |
| P0 | Server-side sessions | Critical security | Medium |
| P0 | Server-side permissions | Critical security | Medium |
| P0 | CORS allowlist | Security | Low |
| P0 | Stop production type/lint skip | Quality | Medium |
| P1 | Audit log | Recovery/compliance | Medium |
| P1 | Revision history | Recovery | Medium |
| P1 | Import preview/rollback | Data quality | Medium |
| P1 | Live score state machine | Reliability | High |
| P2 | Operations cockpit | Admin speed | Medium |
| P2 | Real dashboard metrics | Observability | Medium |
| P2 | Alerts | Incident response | Medium |
| P3 | Admin role invitation flow | Operations | Medium |
| P3 | Media library | Content quality | Medium |

### End-User Backlog

| Priority | Item | Impact | Effort |
| --- | --- | --- | --- |
| P0 | Truthful empty/loading/stale states | Trust | Low |
| P1 | Match center upgrade | Core product | High |
| P1 | Server-backed notifications | Retention | High |
| P1 | Personalized home | Retention | Medium |
| P2 | PWA install/offline fixtures | Mobile retention | Medium |
| P2 | Global search | Navigation | Medium |
| P2 | Share cards | Growth | Medium |
| P2 | Prediction leagues/badges | Engagement | Medium |
| P3 | WPL stats parity | Product depth | Medium |
| P3 | Structured data/SEO | Discovery | Low/Medium |
| P3 | Accessibility pass | Quality | Medium |
| P3 | Performance pass | Quality | Medium |

## Concrete First Sprint

If starting implementation now, do this first:

1. Create `functions/lib/admin-auth.ts`.
2. Replace hardcoded admin login with KV/D1 admin lookup only.
3. Add password hash migration plan.
4. Convert admin auth to HttpOnly cookie sessions.
5. Protect `players`, `teams`, `matches`, `scorecards`, `content`, `admins`, `settings`, and import endpoints with server-side permissions.
6. Add `audit_log` writer and call it from admin writes.
7. Add tests for:
   - no token
   - normal user token
   - wrong admin role
   - correct admin role
8. Remove `/ipl-admin-2026/demo` or gate it to development.
9. Change production build so type-check and lint are not silently skipped.

## What Not To Add Yet

Do not add these until Phase 0 and Phase 1 are complete:

- More AI pages.
- More analytics dashboards using fake data.
- More admin shortcuts that call weakly protected APIs.
- More prediction markets without duplicate protection and settlement controls.
- More notification categories without server-side preference and delivery logs.
- More live score display polish before the write path is reliable.

## Final Recommendation

The best upgrade path is to treat SportsUP99 as a live operations product, not only a cricket website. The admin side should become secure, observable, reversible, and match-day efficient. The end-user side should become personalized, reliable on mobile, searchable, installable, and centered around a strong match center.

The immediate engineering priority is:

1. Admin auth and permissions.
2. Data consistency and audit logs.
3. Live score reliability.
4. Real analytics and notifications.
5. Match center and personalization.
