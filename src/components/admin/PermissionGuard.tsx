'use client';

import { ReactNode } from 'react';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export type Permission = 
  | 'teams.create'
  | 'teams.update'
  | 'teams.delete'
  | 'players.create'
  | 'players.update'
  | 'players.delete'
  | 'matches.create'
  | 'matches.update'
  | 'matches.delete'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'content.publish'
  | 'admin.settings'
  | 'admin.users'
  | 'admin.audit'
  | 'admin.export';

export type Role = 'admin' | 'super_admin' | 'editor' | 'viewer';

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
  showTooltip?: boolean;
  requiredRole?: Role;
}

interface PermissionContextType {
  userRole: Role;
  permissions: Permission[];
}

// Mock permission system - in production, this would come from auth context
const getPermissions = (role: Role): Permission[] => {
  const basePermissions: Permission[] = [];
  
  switch (role) {
    case 'super_admin':
      return [
        'teams.create',
        'teams.update',
        'teams.delete',
        'players.create',
        'players.update',
        'players.delete',
        'matches.create',
        'matches.update',
        'matches.delete',
        'content.create',
        'content.update',
        'content.delete',
        'content.publish',
        'admin.settings',
        'admin.users',
        'admin.audit',
        'admin.export',
      ];
    case 'admin':
      return [
        'teams.create',
        'teams.update',
        'teams.delete',
        'players.create',
        'players.update',
        'players.delete',
        'matches.create',
        'matches.update',
        'matches.delete',
        'content.create',
        'content.update',
        'content.delete',
        'content.publish',
        'admin.export',
      ];
    case 'editor':
      return [
        'teams.update',
        'players.update',
        'matches.update',
        'content.create',
        'content.update',
        'content.publish',
      ];
    case 'viewer':
      return [];
    default:
      return [];
  }
};

const checkPermission = (permission: Permission, userRole: Role): boolean => {
  const permissions = getPermissions(userRole);
  return permissions.includes(permission);
};

const checkRole = (requiredRole: Role, userRole: Role): boolean => {
  const roleHierarchy: { [key in Role]: number } = {
    viewer: 1,
    editor: 2,
    admin: 3,
    super_admin: 4,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export default function PermissionGuard({
  children,
  permission,
  fallback,
  showTooltip = true,
  requiredRole,
}: PermissionGuardProps) {
  // In production, get from auth context
  const userRole: Role = 'admin'; // This should come from auth context
  const hasPermission = checkPermission(permission, userRole);
  const hasRole = requiredRole ? checkRole(requiredRole, userRole) : true;

  if (!hasPermission || !hasRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showTooltip) {
      return (
        <div className="relative group">
          <div className="opacity-50 pointer-events-none">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg shadow-xl z-50"
            >
              <div className="flex items-center gap-2 text-sm text-[#E6EDF3]">
                <Lock className="w-4 h-4 text-red-400" />
                <span>Insufficient permissions</span>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions
 */
export function usePermission(permission: Permission): boolean {
  const userRole: Role = 'admin'; // This should come from auth context
  return checkPermission(permission, userRole);
}

/**
 * Hook to check role
 */
export function useRole(requiredRole: Role): boolean {
  const userRole: Role = 'admin'; // This should come from auth context
  return checkRole(requiredRole, userRole);
}

/**
 * Component to show permission indicator
 */
export function PermissionIndicator({ permission }: { permission: Permission }) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
        <Shield className="w-3 h-3" />
        <span>Restricted</span>
      </div>
    );
  }

  return null;
}

