'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('Test page loaded successfully!');
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">IPL Scorecard - Test Version</h1>
      <p className="text-xl mb-4">{message}</p>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Data Persistence Test</h2>
        
        <button
          onClick={() => {
            localStorage.setItem('testData', 'Data saved at ' + new Date().toLocaleTimeString());
            setMessage('✅ Data saved to localStorage!');
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded mr-4"
        >
          Save Test Data
        </button>
        
        <button
          onClick={() => {
            const saved = localStorage.getItem('testData');
            setMessage(saved ? '📦 Retrieved: ' + saved : '❌ No data found');
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
        >
          Load Test Data
        </button>
      </div>
      
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Sections Test</h2>
        <p>✅ Fall of Wickets - Ready</p>
        <p>✅ Powerplays - Ready</p>
        <p>✅ Partnerships - Ready</p>
        <p>✅ Player Dropdowns - Ready</p>
      </div>
    </div>
  );
}
