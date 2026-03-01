'use client';

import { useEffect, useState } from 'react';

export default function SimpleTest() {
  const [message, setMessage] = useState('Loading...');
  
  useEffect(() => {
    console.log('🧪 [SIMPLE TEST] Component mounted');
    setMessage('✅ Simple test page loaded successfully!');
    
    // Test localStorage
    const testKey = 'test-data-' + Date.now();
    localStorage.setItem(testKey, 'test-value');
    const retrieved = localStorage.getItem(testKey);
    console.log('🧪 [SIMPLE TEST] localStorage test:', { testKey, retrieved });
    
    // Test API
    fetch('/api/matches?league=ipl')
      .then(res => res.json())
      .then(data => {
        console.log('🧪 [SIMPLE TEST] API test:', data?.length || 0, 'matches');
        setMessage(prev => prev + ' | API working: ' + (data?.length || 0) + ' matches');
      })
      .catch(err => {
        console.error('🧪 [SIMPLE TEST] API error:', err);
        setMessage(prev => prev + ' | API ERROR');
      });
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">IPL Scorecard - Simple Test</h1>
      <p className="text-xl mb-4">{message}</p>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Tests</h2>
        <button
          onClick={() => {
            localStorage.setItem('selectedIPLMatch', JSON.stringify({
              id: 'test-match',
              team1: { name: 'CSK' },
              team2: { name: 'RCB' }
            }));
            alert('Test match saved to localStorage');
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded mr-4"
        >
          Save Test Match
        </button>
        
        <button
          onClick={() => {
            const saved = localStorage.getItem('selectedIPLMatch');
            alert('Saved match: ' + saved);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
        >
          Load Test Match
        </button>
      </div>
      
      <div className="mt-8">
        <a href="/ipl-admin-2026/scorecard" className="text-blue-400 hover:text-blue-300">
          ← Back to IPL Scorecard
        </a>
      </div>
    </div>
  );
}
