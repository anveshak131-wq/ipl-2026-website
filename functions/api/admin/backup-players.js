/**
 * Cloudflare Pages Function for /api/admin/backup-players
 * Handles player backup operations (create, list, restore)
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
  return `players_backup:${timestamp}`;
}

// Parse backup key to get timestamp
function parseBackupKey(key) {
  const match = key.match(/players_backup:(.+)/);
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

    // CREATE BACKUP
    if (request.method === 'POST' && action === 'create') {
      // Get current players
      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];

      if (players.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No players to backup',
          message: 'There are no players in the database to create a backup.'
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
        playerCount: players.length,
        players: players,
        metadata: {
          iplCount: players.filter(p => (p.league || 'ipl') === 'ipl').length,
          wplCount: players.filter(p => (p.league || 'ipl') === 'wpl').length,
        }
      };

      // Store backup in KV
      await env.IPL_CACHE.put(key, JSON.stringify(backup));

      // Also store backup key in a list for easy retrieval
      const backupListKey = 'players_backup:list';
      let backupList = await env.IPL_CACHE.get(backupListKey, 'json') || [];
      backupList.push({
        key: key,
        timestamp: backup.timestamp,
        playerCount: backup.playerCount,
        metadata: backup.metadata
      });
      // Keep only last 50 backups
      backupList = backupList.slice(-50);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));

      console.log(`[BACKUP] Created backup: ${key} with ${players.length} players`);

      return new Response(JSON.stringify({
        success: true,
        message: `Backup created successfully`,
        backup: {
          key: key,
          timestamp: backup.timestamp,
          playerCount: backup.playerCount,
          metadata: backup.metadata
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // LIST BACKUPS
    if (request.method === 'GET' && action === 'list') {
      const backupListKey = 'players_backup:list';
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

      // Restore players to main storage
      await env.IPL_CACHE.put('players', JSON.stringify(backupData.players));

      console.log(`[RESTORE] Restored backup: ${backupKey} with ${backupData.players.length} players`);

      return new Response(JSON.stringify({
        success: true,
        message: `Restored ${backupData.players.length} players from backup`,
        restored: {
          key: backupKey,
          timestamp: backupData.timestamp,
          playerCount: backupData.players.length,
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
      const backupListKey = 'players_backup:list';
      let backupList = await env.IPL_CACHE.get(backupListKey, 'json') || [];
      backupList = backupList.filter(b => b.key !== backupKey);
      await env.IPL_CACHE.put(backupListKey, JSON.stringify(backupList));

      console.log(`[DELETE] Deleted backup: ${backupKey}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Backup deleted successfully'
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
          playerCount: backupData.playerCount,
          metadata: backupData.metadata,
          // Don't include full players array in list view
          players: backupData.players
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
        create: 'POST /api/admin/backup-players?action=create',
        list: 'GET /api/admin/backup-players?action=list',
        restore: 'POST /api/admin/backup-players?action=restore&backupKey=<key>',
        delete: 'DELETE /api/admin/backup-players?action=delete&backupKey=<key>',
        get: 'GET /api/admin/backup-players?action=get&backupKey=<key>'
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Backup API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

