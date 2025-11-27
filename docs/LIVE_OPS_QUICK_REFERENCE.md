# Live Operations Quick Reference

## Quick Start

### 1. Initialize WebSocket
```typescript
import { initializeWebSocket } from '@/lib/websocket-client';

const ws = initializeWebSocket({
  url: 'wss://your-domain.com/ws',
});

await ws.connect();
```

### 2. Subscribe to Events
```typescript
ws.on('liveScore', (data) => {
  console.log('Score update:', data);
});

ws.on('engagement', (data) => {
  console.log('User activity:', data);
});
```

### 3. Send Messages
```typescript
ws.send({
  type: 'liveScore',
  data: { matchId: '123', runs: 45 },
  timestamp: Date.now(),
});
```

---

## Moderation Quick Reference

### Check Content
```typescript
import { getModerationEngine } from '@/lib/moderation-rules';

const engine = getModerationEngine();
const flagged = engine.checkContent(
  'user message',
  'userId',
  'userName',
  'matchId'
);
```

### Review Flagged Content
```typescript
engine.reviewContent(
  flaggedItem.id,
  'delete', // 'flag' | 'hide' | 'delete' | 'blockUser' | 'none'
  'Violates guidelines',
  'adminId'
);
```

### Bulk Actions
```typescript
engine.bulkAction(
  ['flag_1', 'flag_2', 'flag_3'],
  'delete',
  'Spam content',
  'adminId'
);
```

### Get Statistics
```typescript
const stats = engine.getStats();
console.log(stats.pending); // Items pending review
console.log(stats.autoActioned); // Auto-actioned items
```

---

## Performance Monitoring Quick Reference

### Record Metrics
```typescript
import { getPerformanceMonitor } from '@/lib/performance-monitor';

const monitor = getPerformanceMonitor();

monitor.recordMetric('messageLatency', 150);
monitor.recordMetric('apiResponseTime', 250);
monitor.recordMetric('serverLoad', 65);
monitor.recordMetric('errorRate', 2.5);
```

### Get Statistics
```typescript
const stats = monitor.getStats();

console.log(stats.messageLatency.avg); // Average latency
console.log(stats.messageLatency.p95); // 95th percentile
console.log(stats.activeConnections.current); // Current connections
```

### Get Alerts
```typescript
const alerts = monitor.getActiveAlerts();
alerts.forEach((alert) => {
  console.log(`${alert.severity}: ${alert.message}`);
});
```

### Resolve Alert
```typescript
monitor.resolveAlert('alert_messageLatency');
```

---

## Incident Management Quick Reference

### Create Incident
```typescript
import { getIncidentManager } from '@/lib/incident-manager';

const manager = getIncidentManager();

const incident = manager.createIncident(
  'High latency detected',
  'Message latency exceeded 1 second',
  'performance', // 'performance' | 'moderation' | 'technical' | 'user' | 'data' | 'security' | 'other'
  'high', // 'low' | 'medium' | 'high' | 'critical'
  'adminId',
  'matchId' // optional
);
```

### Update Status
```typescript
manager.updateStatus(
  incident.id,
  'investigating', // 'open' | 'investigating' | 'resolved' | 'closed'
  'adminId',
  'Started investigation'
);
```

### Add Comment
```typescript
manager.addComment(
  incident.id,
  'adminId',
  'Found database connection issue'
);
```

### Resolve Incident
```typescript
manager.resolveIncident(
  incident.id,
  'Database pool exhaustion',
  'Increased pool size to 50',
  'adminId'
);
```

### Get Statistics
```typescript
const stats = manager.getStats();
console.log(stats.open); // Open incidents
console.log(stats.avgResolutionTime); // Average resolution time
```

---

## Component Usage

### ModerationQueue
```typescript
import ModerationQueue from '@/components/admin/ModerationQueue';

<ModerationQueue
  items={flaggedItems}
  stats={moderationStats}
  onReview={(itemId, action, reason) => {
    // Handle review
  }}
  onBulkAction={(itemIds, action, reason) => {
    // Handle bulk action
  }}
  isLoading={false}
/>
```

### PerformanceMonitor
```typescript
import PerformanceMonitor from '@/components/admin/PerformanceMonitor';

<PerformanceMonitor
  stats={performanceStats}
  alerts={activeAlerts}
  onResolveAlert={(alertId) => {
    // Handle alert resolution
  }}
/>
```

### IncidentLog
```typescript
import IncidentLog from '@/components/admin/IncidentLog';

<IncidentLog
  incidents={incidents}
  stats={incidentStats}
  onCreateIncident={(title, desc, cat, sev) => {
    // Handle creation
  }}
  onUpdateStatus={(id, status) => {
    // Handle status update
  }}
  onAddComment={(id, comment) => {
    // Handle comment
  }}
  onResolveIncident={(id, cause, resolution) => {
    // Handle resolution
  }}
/>
```

---

## Common Patterns

### Real-time Score Updates
```typescript
useEffect(() => {
  const ws = getWebSocketInstance();
  
  const unsubscribe = ws.on('liveScore', (data) => {
    setScore(data);
  });

  return unsubscribe;
}, []);
```

### Periodic Metric Recording
```typescript
useEffect(() => {
  const monitor = getPerformanceMonitor();
  
  const interval = setInterval(() => {
    const latency = measureLatency();
    monitor.recordMetric('messageLatency', latency);
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

### Auto-refresh Moderation Queue
```typescript
useEffect(() => {
  const engine = getModerationEngine();
  
  const interval = setInterval(() => {
    const pending = engine.getPendingContent();
    setPendingItems(pending);
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

---

## Severity Levels

### Moderation
- **low**: Minor violations, flag for review
- **medium**: Moderate violations, hide content
- **high**: Serious violations, delete content
- **critical**: Severe violations, block user

### Incidents
- **low**: Minor issue, no immediate action needed
- **medium**: Moderate issue, should be addressed soon
- **high**: Serious issue, needs immediate attention
- **critical**: Critical issue, requires immediate escalation

---

## Status Flows

### Moderation Status
```
pending → reviewed → actioned
                  → false_positive
```

### Incident Status
```
open → investigating → resolved → closed
```

---

## Error Handling

### WebSocket Errors
```typescript
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Implement retry logic or user notification
});

ws.on('connection', (status) => {
  if (status.status === 'disconnected') {
    // Handle disconnection
  }
});
```

### Moderation Errors
```typescript
try {
  const flagged = engine.checkContent(...);
  if (!flagged) {
    console.log('Content passed moderation');
  }
} catch (error) {
  console.error('Moderation check failed:', error);
}
```

### Performance Monitoring Errors
```typescript
try {
  monitor.recordMetric('messageLatency', latency);
} catch (error) {
  console.error('Failed to record metric:', error);
}
```

---

## Configuration

### WebSocket Config
```typescript
{
  url: 'wss://domain.com/ws',
  reconnectAttempts: 5,           // Max reconnection attempts
  reconnectDelay: 1000,           // Initial delay in ms
  maxReconnectDelay: 30000,       // Max delay in ms
  heartbeatInterval: 30000        // Heartbeat interval in ms
}
```

### Performance Thresholds
```typescript
monitor.setThreshold('messageLatency', 1000);      // 1 second
monitor.setThreshold('apiResponseTime', 500);     // 500ms
monitor.setThreshold('serverLoad', 80);           // 80%
monitor.setThreshold('errorRate', 5);             // 5%
```

---

## Debugging

### Check WebSocket Status
```typescript
const ws = getWebSocketInstance();
console.log(ws.getStatus()); // 'connected' | 'disconnected' | 'reconnecting'
console.log(ws.isConnected()); // true | false
```

### View Moderation Queue
```typescript
const engine = getModerationEngine();
const pending = engine.getPendingContent();
console.log(`Pending items: ${pending.length}`);
```

### Monitor Performance
```typescript
const monitor = getPerformanceMonitor();
const stats = monitor.getStats();
console.log('Performance Stats:', stats);
```

### Check Incidents
```typescript
const manager = getIncidentManager();
const recent = manager.getRecentIncidents(10);
console.log('Recent incidents:', recent);
```

---

## Performance Tips

1. **Batch metric recordings** - Don't record every single metric
2. **Use WebSocket** - Avoid polling for real-time data
3. **Implement pagination** - For large lists (moderation queue, incidents)
4. **Clear old data** - Periodically clean up old metrics and incidents
5. **Use indexes** - For fast searching and filtering

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| WebSocket won't connect | Check URL, firewall, server status |
| Moderation queue empty | Verify content is being checked |
| No performance alerts | Check threshold configuration |
| Incidents not showing | Verify incident creation succeeded |
| High memory usage | Clear old metrics/incidents |

---

**Last Updated:** November 27, 2025
**Version:** 1.0
