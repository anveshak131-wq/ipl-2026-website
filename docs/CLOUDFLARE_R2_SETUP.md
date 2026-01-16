# Cloudflare R2 Storage Setup Guide

## Overview

Cloudflare R2 is object storage for large amounts of unstructured data without egress bandwidth fees. This guide shows how to integrate R2 into your IPL/WPL 2026 website for storing media assets.

## Current Setup vs R2

### Current Storage (Workers KV)
- **Best for**: Small structured data (teams, matches, players JSON)
- **Limitations**: 25MB per key, not ideal for large files
- **Current usage**: Teams data, matches, players, scorecards

### R2 Storage
- **Best for**: Large unstructured data (images, videos, PDFs)
- **Use cases in your project**:
  - Team logos (SVG/PNG files)
  - Player photos
  - Match highlight videos
  - Scorecard PDFs
  - Stadium images
  - Banner images for matches
  - Audio files (podcast/commentary)

## Setup Steps

### 1. Create R2 Bucket

```bash
# Login to Cloudflare
wrangler login

# Create an R2 bucket
wrangler r2 bucket create ipl-wpl-media

# List buckets to verify
wrangler r2 bucket list
```

### 2. Bind R2 to Your Pages Project

#### Option A: Via Cloudflare Dashboard
1. Go to **Cloudflare Dashboard** → **Pages**
2. Select your project: `ipl-2026-website`
3. Go to **Settings** → **Functions**
4. Under **R2 bucket bindings**, click **Add binding**
5. Variable name: `MEDIA_BUCKET`
6. R2 bucket: `ipl-wpl-media`
7. Save

#### Option B: Via wrangler.toml
Add to your `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "ipl-wpl-media"
preview_bucket_name = "ipl-wpl-media-preview" # Optional: separate bucket for dev
```

### 3. Update Pages Configuration

Create or update `wrangler.json`:

```json
{
  "name": "ipl-2026-website",
  "pages_build_output_dir": ".next",
  "compatibility_date": "2024-01-01",
  "vars": {
    "ENVIRONMENT": "production"
  },
  "kv_namespaces": [
    {
      "binding": "IPL_CACHE",
      "id": "your-kv-namespace-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "ipl-wpl-media"
    }
  ]
}
```

## Usage Examples

### 1. Upload Team Logo API Endpoint

Create: `functions/api/media/upload-logo.js`

```javascript
/**
 * Upload team logo to R2
 * POST /api/media/upload-logo
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ');
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('logo');
    const teamId = formData.get('teamId');
    const league = formData.get('league'); // 'ipl' or 'wpl'

    if (!file || !teamId || !league) {
      return new Response(JSON.stringify({ error: 'Missing file, teamId, or league' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `logos/${league}/${teamId}.${fileExt}`;

    // Upload to R2
    await env.MEDIA_BUCKET.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        teamId: teamId,
        league: league,
      }
    });

    // Generate public URL (you'll need to set up a custom domain for R2)
    const publicUrl = `https://media.yourdomain.com/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      fileName: fileName
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Upload failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
```

### 2. Serve Files from R2

Create: `functions/api/media/[...path].js`

```javascript
/**
 * Serve media files from R2
 * GET /api/media/logos/ipl/1.svg
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  
  try {
    // Extract path from URL
    const url = new URL(request.url);
    const filePath = params.path.join('/');

    // Get file from R2
    const object = await env.MEDIA_BUCKET.get(filePath);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Return file with appropriate headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000'); // Cache for 1 year

    return new Response(object.body, {
      headers,
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### 3. Upload Player Photo from Admin Panel

Frontend code for `src/app/wpl-admin-2026/players/page.tsx`:

```typescript
const handleUploadPhoto = async (playerId: string, file: File) => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('playerId', playerId);
  formData.append('league', 'wpl');

  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch('/api/media/upload-photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    console.log('Photo uploaded:', data.url);
    
    // Update player record with photo URL
    await api.updatePlayer(playerId, { photoUrl: data.url });
    
    return data.url;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};
```

## Public Access Setup

### Option 1: Custom Domain for R2 (Recommended)

1. Go to **R2** → **Buckets** → `ipl-wpl-media`
2. Click **Settings** → **Public Access**
3. Click **Connect Domain**
4. Add subdomain: `media.yourdomain.com`
5. Cloudflare will automatically create DNS records

Now files are accessible at:
```
https://media.yourdomain.com/logos/ipl/1.svg
https://media.yourdomain.com/players/wpl/player-123.jpg
```

### Option 2: Pre-signed URLs (Private Files)

```javascript
// Generate pre-signed URL for temporary access
export async function onRequest(context) {
  const { env } = context;
  const fileName = 'private/scorecard-123.pdf';
  
  // Generate pre-signed URL valid for 1 hour
  const url = await env.MEDIA_BUCKET.createSignedUrl(fileName, {
    expiresIn: 3600 // seconds
  });
  
  return Response.json({ url });
}
```

## Folder Structure in R2

Organize files logically:

```
ipl-wpl-media/
├── logos/
│   ├── ipl/
│   │   ├── 1.svg (RCB)
│   │   ├── 2.svg (MI)
│   │   └── ...
│   └── wpl/
│       ├── 11.svg (MI-W)
│       ├── 12.svg (RCB-W)
│       └── ...
├── players/
│   ├── ipl/
│   │   ├── player-1.jpg
│   │   └── ...
│   └── wpl/
│       ├── player-101.jpg
│       └── ...
├── stadiums/
│   ├── wankhede.jpg
│   ├── chinnaswamy.jpg
│   └── ...
├── highlights/
│   ├── match-1-highlights.mp4
│   └── ...
├── scorecards/
│   ├── match-1-scorecard.pdf
│   └── ...
└── banners/
    ├── home-banner.jpg
    └── ...
```

## Migration Strategy

### Current Assets (in /public)
```
/public/logos/*.svg
```

### Migrate to R2
```bash
# Install wrangler if not already
npm install -g wrangler

# Upload files to R2
wrangler r2 object put ipl-wpl-media/logos/ipl/1.svg --file=public/logos/rcb_logo_premium.svg
wrangler r2 object put ipl-wpl-media/logos/ipl/2.svg --file=public/logos/mi_logo_new.svg

# Or use bulk upload script
```

### Bulk Upload Script

Create `scripts/upload-to-r2.js`:

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadDirectory(dirPath, prefix = '') {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDirectory(filePath, `${prefix}${file}/`);
    } else {
      const key = `${prefix}${file}`;
      const fileContent = fs.readFileSync(filePath);
      
      await client.send(new PutObjectCommand({
        Bucket: 'ipl-wpl-media',
        Key: key,
        Body: fileContent,
      }));
      
      console.log(`Uploaded: ${key}`);
    }
  }
}

// Run
uploadDirectory('./public/logos', 'logos/');
```

## Cost Comparison

### Workers KV
- **Storage**: $0.50/GB/month
- **Reads**: $0.50/million reads
- **Writes**: $5.00/million writes
- **Best for**: < 25MB structured data

### R2 Storage
- **Storage**: $0.015/GB/month (33x cheaper!)
- **Reads/Writes**: FREE (Class A: 1M/month, Class B: 10M/month)
- **Egress**: FREE (no bandwidth charges!)
- **Best for**: Large files, high traffic

### Example Cost (1000 team logos @ 100KB each = 100MB)
- **KV**: $0.05/month + read/write costs
- **R2**: $0.0015/month + FREE bandwidth
- **Savings**: 97%+ for large assets

## Best Practices

1. **Use R2 for**:
   - Images > 100KB
   - Videos
   - Audio files
   - PDFs
   - Any file served to end-users

2. **Use KV for**:
   - JSON data < 25MB
   - Configuration
   - Cached API responses
   - Session data

3. **Set Cache Headers**:
   ```javascript
   headers.set('cache-control', 'public, max-age=31536000, immutable');
   ```

4. **Use ETags** for efficient caching:
   ```javascript
   const etag = object.httpEtag;
   if (request.headers.get('if-none-match') === etag) {
     return new Response(null, { status: 304 });
   }
   ```

5. **Optimize Images**:
   - Use Cloudflare Images for automatic optimization
   - Or use Image Resizing with R2:
   ```
   https://media.yourdomain.com/cdn-cgi/image/width=200,quality=80/players/wpl/player-1.jpg
   ```

## Testing Locally

```bash
# Start Wrangler dev server with R2
wrangler pages dev .next --r2 MEDIA_BUCKET --port 8788

# Test upload
curl -X POST http://localhost:8788/api/media/upload-logo \
  -H "Authorization: Bearer test-token" \
  -F "logo=@./test-logo.svg" \
  -F "teamId=1" \
  -F "league=ipl"

# Test retrieval
curl http://localhost:8788/api/media/logos/ipl/1.svg
```

## Security Considerations

1. **Private uploads**: Require authentication for all upload endpoints
2. **File validation**: Check file type and size
3. **Rate limiting**: Prevent abuse
4. **CORS**: Configure appropriately for your domain

```javascript
// Validate file type
const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
if (!allowedTypes.includes(file.type)) {
  return new Response('Invalid file type', { status: 400 });
}

// Validate file size (max 5MB for images)
if (file.size > 5 * 1024 * 1024) {
  return new Response('File too large', { status: 400 });
}
```

## Next Steps

1. ✅ Create R2 bucket: `ipl-wpl-media`
2. ✅ Bind to Pages project
3. ✅ Create upload API endpoints
4. ✅ Add file upload UI to admin panels
5. ✅ Set up custom domain: `media.yourdomain.com`
6. ✅ Migrate existing logos from /public to R2
7. ✅ Update image references in code to use R2 URLs
8. ✅ Add player photo upload feature
9. ✅ Implement video highlight storage

## Resources

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
- [Pages Functions + R2](https://developers.cloudflare.com/pages/functions/bindings/#r2-buckets)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)
