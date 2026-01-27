import { NextRequest, NextResponse } from 'next/server';

// Cloudflare KV REST API endpoint and token must be set in env
const KV_NAMESPACE = process.env.CF_KV_NAMESPACE || 'SPORTS_KV';
const KV_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const KV_API_TOKEN = process.env.CF_API_TOKEN;

const KV_URL = `https://api.cloudflare.com/client/v4/accounts/${KV_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE}/values/wpl-live-score`;

export async function POST(req: NextRequest) {
  if (!KV_ACCOUNT_ID || !KV_API_TOKEN) {
    return NextResponse.json({ error: 'Cloudflare KV credentials not set' }, { status: 500 });
  }
  try {
    const data = await req.json();
    const body = JSON.stringify(data);
    const resp = await fetch(KV_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${KV_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
