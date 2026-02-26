// Script to ensure super admin user exists in KV
// This will create/update the super admin user with correct role

const adminEmail = 'admin@ipl2026.com';
const adminUser = {
  id: '1',
  email: adminEmail,
  name: 'Super Admin',
  role: 'super_admin',
  isBlocked: false,
  createdAt: new Date().toISOString(),
  lastLogin: null,
};

console.log('Creating super admin user:', adminUser);
console.log('Run this in your KV console or use wrangler kv:key put --binding=SPORTS_KV "user:' + adminEmail + '" \'' + JSON.stringify(adminUser) + '\'');
