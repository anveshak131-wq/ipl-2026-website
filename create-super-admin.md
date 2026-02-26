# Create Super Admin User in KV

To fix the super admin access issue, you need to create the user in KV storage. Run these commands:

## Option 1: Using Wrangler CLI

```bash
# Create the super admin user
npx wrangler kv:key put "user:admin@ipl2026.com" '{"id":"1","email":"admin@ipl2026.com","name":"Super Admin","role":"super_admin","isBlocked":false,"createdAt":"2026-02-26T18:00:00.000Z","lastLogin":null}' --binding=SPORTS_KV

# Verify the user was created
npx wrangler kv:key get "user:admin@ipl2026.com" --binding=SPORTS_KV
```

## Option 2: Using Cloudflare Dashboard

1. Go to your Cloudflare account
2. Navigate to Workers & Pages → KV Namespaces
3. Select your SPORTS_KV namespace
4. Click "Add key-value pair"
5. Key: `user:admin@ipl2026.com`
6. Value: 
```json
{"id":"1","email":"admin@ipl2026.com","name":"Super Admin","role":"super_admin","isBlocked":false,"createdAt":"2026-02-26T18:00:00.000Z","lastLogin":null}
```

## What This Fixes

- Creates the super admin user in KV storage
- Ensures the auth verification can find the user
- Allows the JWT token to be properly validated
- Fixes access to batting and bowling stats pages
- Enables logout functionality

## Test After Creating

1. Clear your browser cache/localStorage
2. Log in as super admin
3. Try accessing batting and bowling stats pages
4. Test logout functionality
