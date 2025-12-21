/**
 * Admin Management API
 * POST /api/admin/admins - Create new admin
 * GET /api/admin/admins - List all admins
 * DELETE /api/admin/admins - Delete admin
 */

import crypto from 'node:crypto';

// Password utilities
const encryptPassword = (password, salt) => {
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex');
};

const generateSalt = () => crypto.randomBytes(16).toString('hex');
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Verify admin token
async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer', '').trim();

  if (!token || !env?.SPORTS_KV) {
    return null;
  }

  const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
  if (!tokenValue) {
    return null;
  }

  let email = tokenValue;
  if (tokenValue.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(tokenValue);
      if (parsed && typeof parsed.email === 'string') {
        email = parsed.email;
      }
    } catch {
      // fall back to using tokenValue directly
    }
  }

  const userData = await env.SPORTS_KV.get(`user:${email}`);
  if (!userData) {
    return null;
  }

  const user = JSON.parse(userData);
  if (user.isBlocked) {
    return null;
  }

  // Only allow super_admin to manage other admins
  if (user.role !== 'super_admin') {
    return null;
  }

  return user;
}

export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify admin token (only super_admin can manage admins)
    const adminUser = await verifyAdminToken(request, env);
    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized or insufficient privileges' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // GET - List all admins
    if (method === 'GET') {
      const admins = [];
      
      // Get hardcoded admins
      const hardcodedAdmins = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@ipl2026.com',
          role: 'super_admin',
          type: 'hardcoded'
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@ipl2026.com',
          role: 'admin',
          type: 'hardcoded'
        }
      ];
      
      admins.push(...hardcodedAdmins);
      
      // Get KV-based admins
      if (env?.SPORTS_KV) {
        // We need to scan for admin users
        // For now, we'll return hardcoded admins
        // In a real implementation, you'd have an index of admin emails
      }

      return new Response(
        JSON.stringify({ admins }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // POST - Create new admin
    if (method === 'POST') {
      const body = await request.json();
      const { email, password, name, role } = body;

      // Validate inputs
      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and name are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Validate password strength
      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!/[A-Z]/.test(password)) {
        return new Response(
          JSON.stringify({ error: 'Password must contain uppercase letter' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!/[0-9]/.test(password)) {
        return new Response(
          JSON.stringify({ error: 'Password must contain number' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Validate role
      if (!['admin', 'super_admin', 'players_admin'].includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Role must be admin, super_admin, or players_admin' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Check if user already exists
      const existingUser = await env.SPORTS_KV.get(`user:${email}`);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'User already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Generate salt and hash password
      const salt = generateSalt();
      const hashedPassword = encryptPassword(password, salt);
      const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const token = generateToken();

      // Create admin user object
      const adminUser = {
        id: userId,
        email,
        name,
        salt,
        hashedPassword,
        token,
        role,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };

      // Store in KV with 1 year TTL
      await env.SPORTS_KV.put(
        `user:${email}`,
        JSON.stringify(adminUser),
        {
          expirationTtl: 365 * 24 * 60 * 60, // 1 year
        }
      );

      // Store token for quick lookup
      await env.SPORTS_KV.put(
        `token:${token}`,
        JSON.stringify({
          userId: adminUser.id,
          email,
          role: adminUser.role,
          createdAt: new Date().toISOString(),
        }),
        {
          expirationTtl: 7 * 24 * 60 * 60, // 7 days
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin created successfully',
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            createdAt: adminUser.createdAt,
          },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // DELETE - Delete admin
    if (method === 'DELETE') {
      const { email } = await request.json();

      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Cannot delete hardcoded admins
      if (email === 'admin@ipl2026.com' || email === 'manager@ipl2026.com') {
        return new Response(
          JSON.stringify({ error: 'Cannot delete hardcoded admin accounts' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Cannot delete self
      if (email === adminUser.email) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own admin account' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Get user to delete
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'Admin not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const user = JSON.parse(userData);
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'User is not an admin' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Delete user and token
      await env.SPORTS_KV.delete(`user:${email}`);
      if (user.token) {
        await env.SPORTS_KV.delete(`token:${user.token}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin deleted successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Admin management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
