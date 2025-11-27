# Live Operations Enhancement Guide

## Overview

This guide provides comprehensive documentation for the enhanced Live Operations system, including real-time updates, moderation queue management, user activity monitoring, performance metrics, and incident management.

## Architecture

### Core Components

#### 1. **WebSocket Client** (`/src/lib/websocket-client.ts`)
Real-time bidirectional communication for live updates.

**Features:**
- Automatic reconnection with exponential backoff
- Message queuing for offline scenarios
- Heartbeat mechanism to keep connections alive
- Event-based subscription system
- Connection status tracking

**Usage:**
```typescript
import { initializeWebSocket } from '@/lib/websocket-client';

const ws = initializeWebSocket({
  url: 'wss://your-domain.com/ws',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
});

// Connect
await ws.connect();

// Subscribe to events
ws.on('liveScore', (data) => {
  console.log('Score updated:', data);
});

// Send message
ws.send({
  type: 'liveScore',
  data: { matchId: '123', runs: 45 },
  timestamp: Date.now(),
});

// Check status
console.log(ws.getStatus()); // 'connected' | 'disconnected' | 'reconnecting'

// Disconnect
ws.disconnect();
```

#### 2. **Moderation Rules Engine** (`/src/lib/moderation-rules.ts`)
Automatic content flagging and moderation rule management.

**Features:**
- Pattern-based and keyword-based rule matching
- Severity levels (low, medium, high, critical)
- Auto-action suggestions
- Bulk moderation operations
- Rule management and statistics

**Usage:**
```typescript
import { getModerationEngine } from '@/lib/moderation-rules';

const engine = getModerationEngine();

// Check content
const flagged = engine.checkContent(
  'This is potentially offensive content',
  'user123',
  'John Doe',
  'match456'
);

if (flagged) {
  console.log('Flagged:', flagged);
  // {
  //   id: 'flag_...',
  //   severity: 'high',
  //   suggestedAction: 'hide',
  //   flaggedRules: ['offensive_language'],
  //   ...
  // }
}

// Get pending items
const pending = engine.getPendingContent(50);

// Review content
engine.reviewContent(
  flagged.id,
  'delete',
  'Violates community guidelines',
  'admin123'
);

// Bulk action
engine.bulkAction(
  ['flag_1', 'flag_2', 'flag_3'],
  'delete',
  'Spam content',
  'admin123'
);

// Get statistics
const stats = engine.getStats();
// {
//   totalFlagged: 150,
//   pending: 23,
//   resolved: 127,
//   autoActioned: 45,
//   ...
// }
```

#### 3. **Performance Monitor** (`/src/lib/performance-monitor.ts`)
Real-time performance metrics tracking and alerting.

**Features:**
- Message latency monitoring
- API response time tracking
- Server load monitoring
- Error rate tracking
- Automatic threshold-based alerts
- Metrics export (CSV)

**Usage:**
```typescript
import { getPerformanceMonitor } from '@/lib/performance-monitor';

const monitor = getPerformanceMonitor();

// Record metrics
monitor.recordMetric('messageLatency', 150, 'chat_message_1');
monitor.recordMetric('apiResponseTime', 250);
monitor.recordMetric('serverLoad', 65);
monitor.recordMetric('errorRate', 2.5);

// Get statistics
const stats = monitor.getStats();
// {
//   messageLatency: { avg: 145, min: 50, max: 500, p95: 400, p99: 450 },
//   apiResponseTime: { avg: 230, min: 100, max: 800, ... },
//   serverLoad: { current: 65, avg: 60, peak: 85 },
//   errorRate: { current: 2.5, avg: 2.1, total: 150 },
//   activeConnections: { current: 450, peak: 600 },
//   uptime: 3600000,
// }
```

#### 4. **Incident Manager** (`/src/lib/incident-manager.ts`)
Comprehensive incident tracking and management.

**Features:**
- Incident creation and lifecycle management
- Status tracking (open, investigating, resolved, closed)
- Severity levels and categorization
- Comment system for collaboration
- Event timeline tracking
- Statistics and reporting

**Usage:**
```typescript
import { getIncidentManager } from '@/lib/incident-manager';

const manager = getIncidentManager();

// Create incident
const incident = manager.createIncident(
  'High message latency detected',
  'Message latency exceeded 1 second threshold',
  'performance',
  'high',
  'admin123',
  'match456'
);

// Update status
manager.updateStatus(incident.id, 'investigating', 'admin123', 'Started investigation');

// Add comment
manager.addComment(
  incident.id,
  'admin123',
  'Found database connection pool exhaustion'
);

// Resolve incident
manager.resolveIncident(
  incident.id,
  'Database connection pool was misconfigured',
  'Increased pool size from 10 to 50 connections',
  'admin123'
);

// Get statistics
const stats = manager.getStats();
// {
//   total: 45,
//   open: 3,
//   investigating: 2,
//   resolved: 35,
//   closed: 5,
//   avgResolutionTime: 1800000,
//   byCriticality: { low: 10, medium: 15, high: 15, critical: 5 },
//   byCategory: { performance: 20, moderation: 10, ... },
// }
```

## UI Components

### 1. **ModerationQueue Component**
Enhanced moderation interface with bulk actions and filtering.

**Props:**
```typescript
interface ModerationQueueProps {
  items: FlaggedContent[];
  stats: ModerationStats;
  onReview: (itemId: string, action: ActionType, reason: string) => void;
  onBulkAction: (itemIds: string[], action: ActionType, reason: string) => void;
  isLoading?: boolean;
}
```

**Features:**
- Real-time flagged content queue
- Severity-based filtering
- Bulk selection and actions
- Detailed content preview
- Quick action buttons
- Statistics dashboard

### 2. **PerformanceMonitor Component**
Real-time performance metrics dashboard.

**Props:**
```typescript
interface PerformanceMonitorProps {
  stats: PerformanceStats;
  alerts: PerformanceAlert[];
  onResolveAlert?: (alertId: string) => void;
}
```

**Features:**
- System health status
- Active alerts display
- Metric cards with detailed stats
- Connection usage visualization
- Performance summary
- Threshold-based alerting

### 3. **IncidentLog Component**
Comprehensive incident management interface.

**Props:**
```typescript
interface IncidentLogProps {
  incidents: Incident[];
  stats: IncidentStats;
  onCreateIncident?: (title: string, description: string, category: string, severity: string) => void;
  onUpdateStatus?: (incidentId: string, status: string) => void;
  onAddComment?: (incidentId: string, comment: string) => void;
  onResolveIncident?: (incidentId: string, rootCause: string, resolution: string) => void;
}
```

**Features:**
- Incident creation and lifecycle
- Status and severity filtering
- Comment system
- Root cause and resolution tracking
- Statistics overview
- Timeline view

## Integration Guide

### Step 1: Initialize WebSocket

```typescript
'use client';

import { useEffect } from 'react';
import { initializeWebSocket } from '@/lib/websocket-client';

export default function LiveOperationsPage() {
  useEffect(() => {
    const ws = initializeWebSocket({
      url: process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:3000/ws',
    });

    ws.connect().catch((error) => {
      console.error('WebSocket connection failed:', error);
    });

    return () => {
      ws.disconnect();
    };
  }, []);

  return (
    // Your component JSX
  );
}
```

### Step 2: Integrate Moderation Queue

```typescript
import { useState, useEffect } from 'react';
import { getModerationEngine } from '@/lib/moderation-rules';
import ModerationQueue from '@/components/admin/ModerationQueue';

export default function ModerationPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const engine = getModerationEngine();
    setItems(engine.getPendingContent());
    setStats(engine.getStats());
  }, []);

  const handleReview = (itemId, action, reason) => {
    const engine = getModerationEngine();
    engine.reviewContent(itemId, action, reason, 'admin123');
    setItems(engine.getPendingContent());
    setStats(engine.getStats());
  };

  return (
    <ModerationQueue
      items={items}
      stats={stats}
      onReview={handleReview}
      onBulkAction={handleBulkAction}
    />
  );
}
```

### Step 3: Integrate Performance Monitor

```typescript
import { useState, useEffect } from 'react';
import { getPerformanceMonitor } from '@/lib/performance-monitor';
import PerformanceMonitor from '@/components/admin/PerformanceMonitor';

export default function PerformancePage() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    const interval = setInterval(() => {
      setStats(monitor.getStats());
      setAlerts(monitor.getActiveAlerts());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PerformanceMonitor
      stats={stats}
      alerts={alerts}
      onResolveAlert={handleResolveAlert}
    />
  );
}
```

### Step 4: Integrate Incident Log

```typescript
import { useState, useEffect } from 'react';
import { getIncidentManager } from '@/lib/incident-manager';
import IncidentLog from '@/components/admin/IncidentLog';

export default function IncidentPage() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const manager = getIncidentManager();
    setIncidents(manager.getRecentIncidents());
    setStats(manager.getStats());
  }, []);

  const handleCreateIncident = (title, description, category, severity) => {
    const manager = getIncidentManager();
    manager.createIncident(title, description, category, severity, 'admin123');
    setIncidents(manager.getRecentIncidents());
    setStats(manager.getStats());
  };

  return (
    <IncidentLog
      incidents={incidents}
      stats={stats}
      onCreateIncident={handleCreateIncident}
      onUpdateStatus={handleUpdateStatus}
      onAddComment={handleAddComment}
      onResolveIncident={handleResolveIncident}
    />
  );
}
```

## Best Practices

### 1. **Performance Optimization**
- Use WebSocket for real-time updates instead of polling
- Batch metric recordings to reduce overhead
- Implement pagination for large incident lists
- Clear old metrics and incidents periodically

### 2. **Error Handling**
- Always wrap WebSocket operations in try-catch
- Implement graceful degradation for failed connections
- Log errors for debugging
- Show user-friendly error messages

### 3. **Security**
- Validate all user inputs before processing
- Implement rate limiting for moderation actions
- Use authentication tokens for WebSocket connections
- Sanitize content before display

### 4. **Monitoring**
- Track WebSocket connection health
- Monitor moderation queue size
- Alert on performance threshold breaches
- Log all incident state changes

## API Endpoints (To Be Implemented)

### WebSocket Endpoint
```
wss://your-domain.com/ws
```

### Moderation API
```
POST /api/moderation/check
POST /api/moderation/review
POST /api/moderation/bulk-action
GET /api/moderation/stats
GET /api/moderation/rules
```

### Performance API
```
POST /api/performance/metrics
GET /api/performance/stats
GET /api/performance/alerts
```

### Incident API
```
POST /api/incidents
GET /api/incidents
PUT /api/incidents/:id
POST /api/incidents/:id/comments
```

## Troubleshooting

### WebSocket Connection Issues
- Check WebSocket URL configuration
- Verify firewall allows WebSocket connections
- Check browser console for connection errors
- Ensure server supports WebSocket protocol

### Moderation Queue Not Updating
- Verify content is being checked against rules
- Check rule configuration
- Ensure moderation engine is initialized
- Check for JavaScript errors in console

### Performance Metrics Not Recording
- Verify metrics are being recorded at correct intervals
- Check threshold configuration
- Ensure performance monitor is initialized
- Review metric recording calls

### Incidents Not Appearing
- Verify incident creation is successful
- Check incident manager initialization
- Ensure incidents are not being filtered out
- Review incident status and filters

## Future Enhancements

1. **Machine Learning Integration**
   - Automated content classification
   - Anomaly detection for performance metrics
   - Predictive incident alerting

2. **Advanced Analytics**
   - Trend analysis and forecasting
   - Comparative metrics across matches
   - User behavior analytics

3. **Integration Capabilities**
   - Slack/Teams notifications
   - PagerDuty incident escalation
   - Custom webhook support

4. **Reporting**
   - Automated daily/weekly reports
   - Custom report generation
   - Export to multiple formats

## Support

For issues or questions:
- Check the troubleshooting section above
- Review code comments in library files
- Check browser console for error messages
- Refer to Next.js documentation: https://nextjs.org/docs

---

**Last Updated:** November 27, 2025
**Version:** 1.0
