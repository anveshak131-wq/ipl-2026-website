'use client';

console.log('[LIVE_SCORE_TEST] Script loaded immediately');

export default function LiveScoreTestPage() {
  console.log('[LIVE_SCORE_TEST] Component rendering');

  return (
    <div style={{ padding: '40px', background: '#1a1a2e', color: '#fff', minHeight: '100vh' }}>
      <h1>Live Score Test Page</h1>
      <p>If you see this text, the page is rendering.</p>
      <p>Check the console (F12) for logs.</p>
      <button 
        onClick={() => console.log('[TEST_BUTTON] Clicked at', new Date())}
        style={{
          padding: '10px 20px',
          background: '#e91e63',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Test Button - Click Me
      </button>
    </div>
  );
}
