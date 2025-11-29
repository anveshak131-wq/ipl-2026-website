# Admin-Specific Advanced Features

This document describes the admin-specific features including audit trail, permissions, and settings.

## 1. Audit Trail

### AuditTrail Component
Comprehensive audit logging system that tracks all changes in the admin panel.

**Features:**
- Change history log with before/after values
- Filter by action, user, date range
- Search functionality
- Rollback capability
- IP address and user agent tracking
- Export functionality

**Usage:**
```tsx
import AuditTrail from '@/components/admin/AuditTrail';

<AuditTrail
  entityType="team"
  entityId="1"
  onRollback={(logId) => {
    // Handle rollback
    console.log('Rolling back:', logId);
  }}
/>
```

**API Endpoint:** `/api/admin/audit`

### UserActivityTracking Component
Track user activities across the admin panel.

**Features:**
- Real-time activity monitoring
- Activity charts by hour
- Filter by user and date range
- IP address and device tracking
- Activity summaries

**Usage:**
```tsx
import UserActivityTracking from '@/components/admin/UserActivityTracking';

<UserActivityTracking userId="admin1" />
```

**API Endpoint:** `/api/admin/user-activity`

### VersionHistory Component
Track and manage version history for entities.

**Features:**
- Version history with change summaries
- View previous versions
- Rollback to any version
- Current version indicator
- Version comparison

**Usage:**
```tsx
import VersionHistory from '@/components/admin/VersionHistory';

<VersionHistory
  entityType="team"
  entityId="1"
  onRollback={(versionId) => {
    // Handle rollback
    console.log('Rolling back to version:', versionId);
  }}
  onView={(versionId) => {
    // View version details
    console.log('Viewing version:', versionId);
  }}
/>
```

**API Endpoint:** `/api/admin/versions`

## 2. Permissions System

### PermissionGuard Component
Role-based access control for UI elements.

**Features:**
- Permission-based rendering
- Role-based access control
- Tooltip indicators for restricted actions
- Fallback UI for unauthorized users

**Usage:**
```tsx
import PermissionGuard, { Permission } from '@/components/admin/PermissionGuard';

<PermissionGuard
  permission="teams.delete"
  requiredRole="admin"
  showTooltip={true}
  fallback={<div>You don't have permission</div>}
>
  <button onClick={handleDelete}>Delete Team</button>
</PermissionGuard>
```

**Available Permissions:**
- `teams.create`, `teams.update`, `teams.delete`
- `players.create`, `players.update`, `players.delete`
- `matches.create`, `matches.update`, `matches.delete`
- `content.create`, `content.update`, `content.delete`, `content.publish`
- `admin.settings`, `admin.users`, `admin.audit`, `admin.export`

**Available Roles:**
- `viewer` - Read-only access
- `editor` - Can edit content
- `admin` - Full access except admin settings
- `super_admin` - Complete access

### PermissionIndicator Component
Visual indicator for permission status.

**Usage:**
```tsx
import { PermissionIndicator } from '@/components/admin/PermissionGuard';

<PermissionIndicator permission="teams.delete" />
```

### usePermission Hook
Check permissions in components.

**Usage:**
```tsx
import { usePermission } from '@/components/admin/PermissionGuard';

function MyComponent() {
  const canDelete = usePermission('teams.delete');
  
  return (
    <button disabled={!canDelete}>
      Delete
    </button>
  );
}
```

### useRole Hook
Check user role.

**Usage:**
```tsx
import { useRole } from '@/components/admin/PermissionGuard';

function MyComponent() {
  const isAdmin = useRole('admin');
  
  return isAdmin ? <AdminPanel /> : <ViewerPanel />;
}
```

## 3. Admin Settings

### AdminSettings Component
Comprehensive settings management for admins.

**Features:**
- **Preferences Tab:**
  - Language selection
  - Timezone configuration
  - Date format preferences
  - Items per page
  - Auto-save toggle
  - Tooltip preferences

- **Notifications Tab:**
  - Email notification settings (on create, update, delete, error)
  - In-app notification settings
  - Sound settings with volume control

- **Theme Tab:**
  - Theme selection (Dark, Light, Auto)
  - Accent color customization

- **Export Tab:**
  - Default export format
  - Date format for exports
  - CSV delimiter options
  - Include headers toggle
  - Auto-download toggle

**Usage:**
```tsx
import AdminSettings from '@/components/admin/AdminSettings';

<AdminSettings />
```

**Storage:**
All settings are saved to localStorage:
- `admin_preferences`
- `admin_notifications`
- `admin_export_settings`

## Complete Integration Example

```tsx
'use client';

import { useState } from 'react';
import AuditTrail from '@/components/admin/AuditTrail';
import UserActivityTracking from '@/components/admin/UserActivityTracking';
import VersionHistory from '@/components/admin/VersionHistory';
import PermissionGuard from '@/components/admin/PermissionGuard';
import AdminSettings from '@/components/admin/AdminSettings';

export default function AdminAdvancedFeatures() {
  const [activeTab, setActiveTab] = useState('audit');

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2A3440]">
        {[
          { id: 'audit', label: 'Audit Trail' },
          { id: 'activity', label: 'User Activity' },
          { id: 'versions', label: 'Version History' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#2F6FED] text-[#E6EDF3]'
                : 'border-transparent text-[#AEBAC7] hover:text-[#E6EDF3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'audit' && (
        <AuditTrail
          onRollback={(logId) => {
            console.log('Rollback:', logId);
          }}
        />
      )}

      {activeTab === 'activity' && <UserActivityTracking />}

      {activeTab === 'versions' && (
        <VersionHistory
          entityType="team"
          entityId="1"
          onRollback={(versionId) => {
            console.log('Rollback to version:', versionId);
          }}
        />
      )}

      {activeTab === 'settings' && <AdminSettings />}

      {/* Permission Example */}
      <PermissionGuard permission="teams.delete">
        <button className="px-4 py-2 bg-red-500 rounded-lg text-white">
          Delete Team
        </button>
      </PermissionGuard>
    </div>
  );
}
```

## API Routes

### `/api/admin/audit`
- **GET**: Fetch audit logs with filters
- Query params: `entityType`, `entityId`, `action`, `userId`, `startDate`, `endDate`

### `/api/admin/user-activity`
- **GET**: Fetch user activity logs
- Query params: `userId`, `startDate`, `endDate`

### `/api/admin/versions`
- **GET**: Fetch version history
- Query params: `entityType`, `entityId`
- **POST**: Rollback to version
- Body: `{ versionId, entityType, entityId }`

## Implementation Notes

1. **Audit Logging**: In production, implement actual database logging for all CRUD operations
2. **Permissions**: Connect to your authentication system to get actual user roles
3. **Version History**: Implement versioning system in your database
4. **Settings**: Consider syncing with backend for multi-device support
5. **Rollback**: Implement actual data restoration logic in your backend

## Security Considerations

- All audit logs should be immutable
- Version history should be stored securely
- Permissions should be checked server-side
- Settings should be validated before saving
- Rollback operations should require confirmation

