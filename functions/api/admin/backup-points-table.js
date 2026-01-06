/**
 * Cloudflare Pages Function for /api/admin/backup-points-table
 * Handles points table backup operations (create, list, restore, delete)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: basic admin token check
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Generate backup key with timestamp
function generateBackupKey() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2024-01-15T10-30-45
  return `points_table_backup:${timestamp}`;
}

// Parse backup key to get timestamp
function parseBackupKey(key) {
  const match = key.match(/points_table_backup:(.+)/);
  if (match) {
    return match[1];
  }
  return null;
}

export const onRequest = async (context) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify admin token for all operations
    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action'); // 'create', 'list', 'restore', 'delete'
    const backupKey = url.searchParams.get('backupKey');
    const year = url.searchParams.get('year'); // Optional: specific year to backup

    // CREATE BACKUP
    if (request.method === 'POST' && action === 'create') {
      // Get current points table data
      let pointsTableData = [];
      
      if (year) {
        // Backup specific year
        const yearData = await env.IPL_CACHE.get(`iplPointsTable${year}`, 'json');
        if (yearData) {
          pointsTableData = yearData;
        }
      } else {
        // Backup all years - get current year first
        const currentYear = new Date().getFullYear();
        const currentYearData = await env.IPL_CACHE.get(`iplPointsTable${currentYear}`, 'json');
        if (currentYearData) {
          pointsTableData = currentYearData;
        }
      }

      if (pointsTableData.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No points table data to backup',
          message: 'There is no points table data in the database to create a backup.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Generate backup key
      const key = generateBackupKey();
      
      // Create backup object with metadata
      const backup = {
        timestamp: new Date().toISOString(),
        year: year || new Date().getFullYear(),
        teamCount: pointsTableData.length,
        teams: pointsTableData,
        metadata: {
          season: year || new Date().getFullYear(),
          backupType: year ? 'single_year' : 'current_year',
        }
      };

      // Store backup in KV
      await env.IPL_CACHE.put(key, JSON.stringify(backup));

      // Also store backup key in a list for easy retrieval
      const backupListKey = 'points_table_backup:list';
      let backupList = await env.IPL_CACHE.get(backupListKey, 'json') || [];
      backupList.push({
        key: key,
        timestamp: backup.timestamp,
        year: backup.year,
        teamCount: backup.teamCount,
        metadata: backup.metadata
      });
      // Keep only last 50 backups
      backupList = backupList.slice(-50);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));

      console.log(`[BACKUP] Created points table backup: ${key} with ${pointsTableData.length} teams for year ${backup.year}`);

      return new Response(JSON.stringify({
        success: true,
        message: `Points table backup created successfully`,
        backup: {
          key: key,
          timestamp: backup.timestamp,
          year: backup.year,
          teamCount: backup.teamCount,
          metadata: backup.metadata
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // LIST BACKUPS
    if (request.method === 'GET' && action === 'list') {
      const backupListKey = 'points_table_backup:list';
      const backupList = await env.IPL_CACHE.get(backupListKey, 'json') || [];

      // Sort by timestamp (newest first)
      backupList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return new Response(JSON.stringify({
        success: true,
        backups: backupList,
        count: backupList.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // RESTORE FROM BACKUP
    if (request.method === 'POST' && action === 'restore') {
      if (!backupKey) {
        return new Response(JSON.stringify({ 
          error: 'Backup key is required',
          message: 'Please provide a backupKey parameter'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Get backup data
      const backupData = await env.IPL_CACHE.get(backupKey, 'json');
      
      if (!backupData) {
        return new Response(JSON.stringify({ 
          error: 'Backup not found',
          message: `Backup with key ${backupKey} does not exist`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Restore points table to main storage
      const storageKey = `iplPointsTable${backupData.year}`;
      await env.IPL_CACHE.put(storageKey, JSON.stringify(backupData.teams));

      console.log(`[RESTORE] Restored points table backup: ${backupKey} with ${backupData.teams.length} teams for year ${backupData.year}`);

      return new Response(JSON.stringify({
        success: true,
        message: `Restored ${backupData.teams.length} teams from backup for year ${backupData.year}`,
        restored: {
          key: backupKey,
          timestamp: backupData.timestamp,
          year: backupData.year,
          teamCount: backupData.teams.length,
          metadata: backupData.metadata
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // DELETE BACKUP
    if (request.method === 'DELETE' && action === 'delete') {
      if (!backupKey) {
        return new Response(JSON.stringify({ 
          error: 'Backup key is required',
          message: 'Please provide a backupKey parameter'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Delete backup from KV
      await env.IPL_CACHE.delete(backupKey);

      // Remove from backup list
      const backupListKey = 'points_table_backup:list';
      let backupList = await env.IPL_CACHE.get(backupListKey, 'json') || [];
      backupList = backupList.filter(b => b.key !== backupKey);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));

      console.log(`[DELETE] Deleted points table backup: ${backupKey}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Points table backup deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET BACKUP DETAILS
    if (request.method === 'GET' && action === 'get' && backupKey) {
      const backupData = await env.IPL_CACHE.get(backupKey, 'json');
      
      if (!backupData) {
        return new Response(JSON.stringify({ 
          error: 'Backup not found',
          message: `Backup with key ${backupKey} does not exist`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        backup: {
          key: backupKey,
          timestamp: backupData.timestamp,
          year: backupData.year,
          teamCount: backupData.teamCount,
          metadata: backupData.metadata,
          // Include full teams array
          teams: backupData.teams
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Default: return available actions
    return new Response(JSON.stringify({
      error: 'Invalid action',
      availableActions: {
        create: 'POST /api/admin/backup-points-table?action=create&year=<optional_year>',
        list: 'GET /api/admin/backup-points-table?action=list',
        restore: 'POST /api/admin/backup-points-table?action=restore&backupKey=<key>',
        delete: 'DELETE /api/admin/backup-points-table?action=delete&backupKey=<key>',
        get: 'GET /api/admin/backup-points-table?action=get&backupKey=<key>'
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Points table backup API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};