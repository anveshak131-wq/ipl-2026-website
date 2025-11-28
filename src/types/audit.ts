/**
 * Audit trail types
 */

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  changes: ChangeRecord[];
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'publish'
  | 'unpublish'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'rollback';

export interface ChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface VersionHistory {
  id: string;
  version: number;
  entityType: string;
  entityId: string;
  entityName: string;
  data: any;
  createdBy: string;
  createdAt: Date;
  changeSummary: string;
  isCurrent: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  timestamp: Date;
  metadata?: { [key: string]: any };
}

