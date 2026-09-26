// Remove duplicate Smriti Mandhana entry (wpl4) from RCB-W
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';
const API_BASE = 'https://ipl-2026-website.pages.dev';

async function fixDuplicate() {
  try {
    console.log('Deleting duplicate Smriti Mandhana entry (wpl4)...');
    
    const deleteRes = await fetch(`${API_BASE}/api/players?id=wpl4`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      }
    });

    if (deleteRes.ok) {
      console.log('✓ Successfully deleted duplicate player wpl4');
    } else {
      const error = await deleteRes.text();
      console.log(`✗ Failed to delete: ${error}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDuplicate();
