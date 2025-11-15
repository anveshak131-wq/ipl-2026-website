/**
 * Admin Setup API
 * POST /api/admin/setup
 * 
 * Creates the initial admin account during setup phase.
 * Should be secured and disabled after first use.
 */

import crypto from 'crypto';

export async function onRequest(context) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    const { email, password, name, setupKey } = data;

    // Validate setup key (should be set in environment)
    const validSetupKey = env.SETUP_KEY || 'default-setup-key-change-me';
    if (setupKey !== validSetupKey) {
      return new Response(
        JSON.stringify({ message: 'Invalid setup key. Setup may have already been completed.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate inputs
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ message: 'Email, password, and name are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: 'Password must be at least 8 characters' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return new Response(
        JSON.stringify({ message: 'Password must contain uppercase letter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ message: 'Password must contain number' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if admin already exists
    const existingUser = await env.SPORTS_KV.get(`user:${email}`);
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Admin account already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate salt and hash password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const encoder = new TextEncoder();
    const data_to_hash = encoder.encode(password + saltHex);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data_to_hash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate user ID and token
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokenBuffer = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBuffer).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create admin user object
    const adminUser = {
      id: userId,
      email,
      name,
      salt: saltHex,
      hashedPassword,
      token,
      role: 'admin',
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
        role: 'admin',
        createdAt: new Date().toISOString(),
      }),
      {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
      }
    );

    return new Response(
      JSON.stringify({
        message: 'Admin account created successfully',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          token: adminUser.token,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({
        message: 'Error creating admin account',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
