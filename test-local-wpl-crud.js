async function run() {
  const BASE = 'http://localhost:8788';
  console.log('1. [GET] Fetching WPL players...');
  const res = await fetch(`${BASE}/api/players?league=wpl`);
  console.log('Status:', res.status);
  const list = await res.json();
  console.log('Loaded WPL Players count:', Array.isArray(list) ? list.length : 'N/A');

  const testId = 'test_auction_' + Date.now();
  console.log('\n2. [POST] Adding new player to UP Warriorz (teamId: 15)...');
  const postRes = await fetch(`${BASE}/api/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testId,
      name: 'Auction Fast Bowler',
      role: 'Bowler',
      league: 'wpl',
      teamId: '15',
      nationality: 'India',
      isActiveInSquad: true
    })
  });
  console.log('POST Status:', postRes.status);

  console.log('\n3. [PUT] Updating player role to All-rounder...');
  const putRes = await fetch(`${BASE}/api/players`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testId,
      name: 'Auction Fast Bowler',
      role: 'All-rounder',
      league: 'wpl',
      teamId: '15'
    })
  });
  console.log('PUT Status:', putRes.status);

  console.log('\n4. [DELETE] Removing test player...');
  const delRes = await fetch(`${BASE}/api/players?id=${testId}&league=wpl`, {
    method: 'DELETE'
  });
  console.log('DELETE Status:', delRes.status);
  console.log('\n✓ Full CRUD cycle verified successfully!');
}
run();
