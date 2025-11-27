# Live Operations Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  Live Score      │  │  Moderation      │  │  Performance     │      │
│  │  Page            │  │  Page            │  │  Dashboard       │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                  │
│  ┌────────┴─────────────────────┴─────────────────────┴──────┐         │
│  │                   Incident Management Page                 │         │
│  └──────────────────────────────────────────────────────────┘         │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │  WebSocket       │  │  Moderation      │  │  Performance     │
        │  Client          │  │  Queue Component │  │  Monitor Comp.   │
        │                  │  │                  │  │                  │
        │ • Connection     │  │ • Bulk actions   │  │ • Health status  │
        │ • Reconnection   │  │ • Filtering      │  │ • Alerts         │
        │ • Events         │  │ • Preview        │  │ • Metrics        │
        │ • Message queue  │  │ • Statistics     │  │ • Visualization  │
        └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                     │                     │
                 └─────────────────────┼─────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│  WebSocket Client    │      │  Moderation Rules    │      │  Performance Monitor │
│  Library             │      │  Engine              │      │  Library             │
│                      │      │                      │      │                      │
│ • Connection mgmt    │      │ • Pattern matching   │      │ • Metric recording   │
│ • Reconnection logic │      │ • Keyword matching   │      │ • Statistics calc    │
│ • Message queuing    │      │ • Rule management    │      │ • Alert system       │
│ • Heartbeat          │      │ • Bulk operations    │      │ • Threshold checks   │
│ • Event subscription │      │ • Statistics         │      │ • Export (CSV)       │
└──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘
           │                             │                             │
           │                             │                             │
           └─────────────────────────────┼─────────────────────────────┘
                                         │
                                         ▼
                        ┌──────────────────────────────┐
                        │  Incident Manager Library    │
                        │                              │
                        │ • Incident creation          │
                        │ • Status lifecycle           │
                        │ • Comments & events          │
                        │ • Statistics & reporting     │
                        │ • Search functionality       │
                        └──────────┬───────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  WebSocket   │  │  Moderation  │  │  Performance │
            │  Server      │  │  API Routes  │  │  API Routes  │
            │  Endpoint    │  │              │  │              │
            │              │  │ • Check      │  │ • Record     │
            │ • Routing    │  │ • Review     │  │ • Get stats  │
            │ • Auth       │  │ • Bulk act.  │  │ • Get alerts │
            │ • Pooling    │  │ • Rules mgmt │  │              │
            └──────────────┘  └──────────────┘  └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
            ┌──────────────────┐        ┌──────────────────┐
            │  Database        │        │  Incident API    │
            │  (Persistence)   │        │  Routes          │
            │                  │        │                  │
            │ • Metrics        │        │ • Create         │
            │ • Incidents      │        │ • Update         │
            │ • Moderation     │        │ • Comments       │
            │ • Rules          │        │ • Search         │
            └──────────────────┘        └──────────────────┘
```

## Data Flow Diagram

### Live Score Update Flow
```
┌─────────────────┐
│  Live Score     │
│  Admin Updates  │
│  Score Form     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  WebSocket Client                   │
│  (Send message)                     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  WebSocket Server                   │
│  (Receive & Route)                  │
└────────┬────────────────────────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────┐
│ Broadcast to all     │              │ Record Performance   │
│ connected clients    │              │ Metric (latency)     │
└──────────────────────┘              └──────────────────────┘
         │                                         │
         ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────┐
│ Live Score Page      │              │ Performance Monitor  │
│ Receives update      │              │ Stores metric        │
│ Updates UI           │              │ Checks thresholds    │
└──────────────────────┘              │ Creates alerts       │
                                      └──────────────────────┘
```

### Moderation Flow
```
┌─────────────────┐
│  User sends     │
│  Chat message   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Message API                        │
│  (Receive message)                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Moderation Engine                  │
│  (Check content)                    │
└────────┬────────────────────────────┘
         │
         ├─────────────────────┬──────────────────────┐
         │                     │                      │
    No Match              Match Found            Match Found
         │                     │                      │
         ▼                     ▼                      ▼
    ┌────────┐         ┌──────────────┐      ┌──────────────┐
    │ Allow  │         │ Flag for     │      │ Auto-action  │
    │ Message│         │ Review       │      │ (if enabled) │
    │        │         │              │      │              │
    └────────┘         └──────┬───────┘      └──────┬───────┘
                               │                     │
                               ▼                     ▼
                        ┌──────────────┐      ┌──────────────┐
                        │ Add to       │      │ Hide/Delete/ │
                        │ Moderation   │      │ Block User   │
                        │ Queue        │      │              │
                        └──────┬───────┘      └──────┬───────┘
                               │                     │
                               ▼                     ▼
                        ┌──────────────────────────────────┐
                        │ Moderation Queue Component       │
                        │ (Admin reviews & takes action)   │
                        └──────────────────────────────────┘
```

### Incident Management Flow
```
┌──────────────────────┐
│  System Event        │
│  (Performance alert, │
│   Error, etc.)       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Incident Manager                    │
│  (Create incident)                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Incident Log Component              │
│  (Display to admin)                  │
└────────┬─────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Add    │   │ Update   │  │ Add      │  │ Resolve  │
    │Comment │   │ Status   │  │ Affected │  │ Incident │
    │        │   │          │  │ Systems  │  │          │
    └────────┘   └──────────┘  └──────────┘  └──────────┘
         │              │              │              │
         └──────────────┼──────────────┼──────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │ Incident Manager             │
         │ (Update incident record)     │
         │ (Track timeline)             │
         └──────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │ Database                     │
         │ (Persist incident)           │
         └──────────────────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    Admin Pages                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Live Score Page │  │ Moderation Page │  │ Performance Pg. │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ WebSocket    │  │ Moderation   │  │ Performance  │
        │ Client       │  │ Queue Comp.  │  │ Monitor Comp.│
        └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
               │                 │                 │
               │                 │                 │
        ┌──────▼──────────────────▼─────────────────▼──────┐
        │                                                   │
        │        Core Libraries (Singleton Pattern)        │
        │                                                   │
        │  ┌──────────────┐  ┌──────────────┐             │
        │  │ WebSocket    │  │ Moderation   │             │
        │  │ Client       │  │ Engine       │             │
        │  └──────────────┘  └──────────────┘             │
        │                                                   │
        │  ┌──────────────┐  ┌──────────────┐             │
        │  │ Performance  │  │ Incident     │             │
        │  │ Monitor      │  │ Manager      │             │
        │  └──────────────┘  └──────────────┘             │
        │                                                   │
        └──────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌────────┐     ┌────────┐     ┌────────┐
    │ WebSkt │     │ API    │     │ DB     │
    │ Server │     │ Routes │     │        │
    └────────┘     └────────┘     └────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  useState()                                                  │
│  ├─ items: FlaggedContent[]                                 │
│  ├─ stats: ModerationStats                                  │
│  ├─ selectedItems: Set<string>                              │
│  ├─ filterSeverity: string                                  │
│  └─ expandedId: string | null                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Library State (Singleton)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Moderation Engine                                           │
│  ├─ rules: Map<string, ModerationRule>                      │
│  ├─ flaggedContent: Map<string, FlaggedContent>             │
│  └─ stats: ModerationStats                                  │
│                                                               │
│  Performance Monitor                                         │
│  ├─ metrics: PerformanceMetric[]                            │
│  ├─ alerts: Map<string, PerformanceAlert>                   │
│  └─ thresholds: Record<MetricType, number>                  │
│                                                               │
│  Incident Manager                                            │
│  ├─ incidents: Map<string, Incident>                        │
│  └─ incidentCounter: number                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Persistent Storage                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Database                                                    │
│  ├─ Metrics (time-series)                                   │
│  ├─ Incidents (with timeline)                               │
│  ├─ Moderation History                                      │
│  └─ Rules Configuration                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Admin Dashboard (Next.js Client)                           │
│  ├─ WebSocket Client                                        │
│  ├─ UI Components                                           │
│  └─ State Management                                        │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                    WebSocket
                    & HTTP/REST
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Server                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  API Routes                                                  │
│  ├─ /api/websocket (WebSocket upgrade)                      │
│  ├─ /api/moderation/* (Moderation endpoints)                │
│  ├─ /api/performance/* (Performance endpoints)              │
│  └─ /api/incidents/* (Incident endpoints)                   │
│                                                               │
│  Server-Side Libraries                                       │
│  ├─ Moderation Engine                                       │
│  ├─ Performance Monitor                                     │
│  └─ Incident Manager                                        │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Database
                    Queries
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables/Collections                                          │
│  ├─ metrics (time-series data)                              │
│  ├─ incidents (incident records)                            │
│  ├─ moderation_history (moderation actions)                 │
│  ├─ rules (moderation rules)                                │
│  └─ alerts (alert history)                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
┌──────────────────────────────────────────────────────────────┐
│                    Load Distribution                          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Multiple Admin Instances                                    │
│  ├─ WebSocket connections (per instance)                    │
│  ├─ Moderation queue (shared via DB)                        │
│  ├─ Performance metrics (aggregated)                        │
│  └─ Incidents (shared via DB)                               │
│                                                                │
│  Scaling Strategy                                            │
│  ├─ Horizontal scaling (multiple server instances)          │
│  ├─ Connection pooling (WebSocket)                          │
│  ├─ Database indexing (for queries)                         │
│  ├─ Caching layer (Redis for hot data)                      │
│  └─ Message queue (for async operations)                    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** November 27, 2025
**Version:** 1.0
