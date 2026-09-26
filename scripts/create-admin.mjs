#!/usr/bin/env node

/**
 * Admin User Creation Script
 * Creates an initial admin user for the IPL 2026 website
 * 
 * Usage: node scripts/create-admin.mjs [email] [password] [name]
 * Example: node scripts/create-admin.mjs admin@ipl2026.com IPLAdmin@2025 "Admin User"
 */

import crypto from 'node:crypto';
import readline from 'node:readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function for prompts
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

// Password hashing function (matches backend)
function hashPassword(password) {
  const crypto_module = crypto;
  const hash = crypto_module.createHash('sha256');
  
  // For this demo, we generate a new salt
  const salt = crypto_module.randomBytes(16).toString('hex');
  hash.update(password + salt);
  const hashedPassword = hash.digest('hex');
  
  return { hashedPassword, salt };
}

// Generate unique user ID
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Validate email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain number' };
  }
  return { valid: true };
}

// Main function
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     IPL 2026 - Admin User Creation Tool                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Get input or use command line arguments
    let email = process.argv[2];
    let password = process.argv[3];
    let name = process.argv[4];

    // Prompt for email if not provided
    if (!email) {
      email = await prompt('📧 Enter admin email: ');
      if (!email) {
        console.error('❌ Email is required');
        rl.close();
        process.exit(1);
      }
    }

    // Validate email
    if (!validateEmail(email)) {
      console.error('❌ Invalid email format');
      rl.close();
      process.exit(1);
    }

    // Prompt for password if not provided
    if (!password) {
      password = await prompt('🔐 Enter admin password: ');
      if (!password) {
        console.error('❌ Password is required');
        rl.close();
        process.exit(1);
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error(`❌ ${passwordValidation.error}`);
      rl.close();
      process.exit(1);
    }

    // Prompt for name if not provided
    if (!name) {
      name = await prompt('👤 Enter admin name: ');
      if (!name) {
        console.error('❌ Name is required');
        rl.close();
        process.exit(1);
      }
    }

    // Hash password
    const { hashedPassword, salt } = hashPassword(password);

    // Generate user ID and token
    const userId = generateUserId();
    const token = generateToken();

    // Create admin user object
    const adminUser = {
      id: userId,
      email,
      name,
      salt,
      hashedPassword,
      token,
      role: 'admin',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    // Display result
    console.log('\n✅ Admin User Created Successfully!\n');
    console.log('════════════════════════════════════════════════════════');
    console.log('📋 USER DETAILS:');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`✓ Email:    ${adminUser.email}`);
    console.log(`✓ Name:     ${adminUser.name}`);
    console.log(`✓ Role:     ${adminUser.role}`);
    console.log(`✓ User ID:  ${adminUser.id}`);
    console.log(`✓ Token:    ${adminUser.token}`);
    console.log(`✓ Created:  ${adminUser.createdAt}\n`);

    console.log('════════════════════════════════════════════════════════');
    console.log('📝 KV STORAGE ENTRY:\n');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Key: user:${adminUser.email}\n`);
    console.log('Value (JSON):');
    console.log(JSON.stringify(adminUser, null, 2));
    console.log('\n════════════════════════════════════════════════════════\n');

    // Instructions for KV insertion
    console.log('📦 HOW TO ADD TO CLOUDFLARE KV:\n');
    console.log('Option 1: Using Wrangler CLI');
    console.log('────────────────────────────────────────────────────────');
    console.log(`wrangler kv:key put \\
  --namespace-id "YOUR_NAMESPACE_ID" \\
  "user:${adminUser.email}" \\
  '${JSON.stringify(adminUser)}'
\n`);

    console.log('Option 2: Via Cloudflare Dashboard');
    console.log('────────────────────────────────────────────────────────');
    console.log('1. Go to: Workers → KV → SPORTS_KV');
    console.log('2. Click "Edit" next to namespace');
    console.log('3. Click "Add Key"');
    console.log(`4. Key: user:${adminUser.email}`);
    console.log('5. Value: (paste the JSON above)');
    console.log('6. Click "Save"\n');

    console.log('Option 3: Via Admin Setup Page (easiest)');
    console.log('────────────────────────────────────────────────────────');
    console.log(`1. Navigate to: https://yourdomain.com/admin/setup`);
    console.log(`2. Email: ${adminUser.email}`);
    console.log(`3. Password: (the password you entered)`);
    console.log(`4. Click "Create Admin Account"`);
    console.log('(Setup page to be implemented)\n');

    console.log('════════════════════════════════════════════════════════\n');

    console.log('🔒 SECURITY REMINDER:');
    console.log('────────────────────────────────────────────────────────');
    console.log('✓ Store credentials securely');
    console.log('✓ Change password after first login');
    console.log('✓ Enable 2FA if available');
    console.log('✓ Use unique admin email');
    console.log('✓ Never commit credentials to git\n');

    console.log('✨ Admin account ready for deployment!\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run main function
main();
