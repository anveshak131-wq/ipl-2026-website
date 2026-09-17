const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice('Bearer '.length).trim();
}

export async function getUserFromToken(env, token) {
  if (!token || !env?.SPORTS_KV) return null;

  const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
  if (!tokenValue) return null;

  let email = tokenValue;
  let role = null;

  if (typeof tokenValue === 'string' && tokenValue.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(tokenValue);
      email = parsed.email || '';
      role = parsed.role || null;
    } catch {
      return null;
    }
  }

  if (!email) return null;

  const userData = await env.SPORTS_KV.get(`user:${email}`);
  if (!userData) {
    return {
      id: email,
      email,
      name: email,
      role,
    };
  }

  try {
    const user = JSON.parse(userData);
    return {
      ...user,
      email: user.email || email,
      role: user.role || role,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(request, env) {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const user = await getUserFromToken(env, token);
  if (!user) {
    return { ok: false, status: 401, error: 'Invalid token' };
  }

  if (!ADMIN_ROLES.has(user.role)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, token, user };
}

export async function appendAdminAuditLog(request, env, entry) {
  if (!env?.SPORTS_KV) return;

  const token = getBearerToken(request);
  const user = await getUserFromToken(env, token);
  if (!user || !ADMIN_ROLES.has(user.role)) return;

  const dateKey = new Date().toISOString().slice(0, 10);
  const auditKey = `admin:audit:${dateKey}`;
  const existingLogs = await env.SPORTS_KV.get(auditKey);
  let logs = [];

  if (existingLogs) {
    try {
      logs = JSON.parse(existingLogs);
    } catch {
      logs = [];
    }
  }

  logs.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    adminId: user.id || user.email,
    adminEmail: user.email || '',
    adminName: user.name || user.username || user.email || 'Admin',
    adminRole: user.role,
    action: entry.action,
    details: entry.details || '',
    entityType: entry.entityType || null,
    entityId: entry.entityId || null,
  });

  if (logs.length > 500) {
    logs = logs.slice(-500);
  }

  await env.SPORTS_KV.put(auditKey, JSON.stringify(logs), {
    expirationTtl: 60 * 60 * 24 * 30,
  });
}

function getDateKeyDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export async function getRecentAdminAuditLogs(env, days = 7, limit = 12) {
  if (!env?.SPORTS_KV) return [];

  const logs = [];
  for (let day = 0; day < days; day += 1) {
    const dateKey = getDateKeyDaysAgo(day);
    const raw = await env.SPORTS_KV.get(`admin:audit:${dateKey}`);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        logs.push(...parsed);
      }
    } catch {
      // Ignore malformed legacy audit payloads.
    }
  }

  return logs
    .map((log, index) => ({
      id: log.id || `${log.timestamp || 'audit'}-${index}`,
      timestamp: log.timestamp || new Date().toISOString(),
      adminEmail: log.adminEmail || log.userEmail || '',
      adminName: log.adminName || log.userName || log.adminEmail || 'Admin',
      action: log.action || 'admin_action',
      details: log.details || log.description || '',
      entityType: log.entityType || null,
      entityId: log.entityId || null,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
