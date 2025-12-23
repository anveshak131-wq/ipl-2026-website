'use client';

import { useState, useEffect } from 'react';

console.log('BattingStatsPage module loaded!');

const BattingStatsPage = () => {
  console.log('BattingStatsPage component rendered!');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect triggered');
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Batting Statistics</h1>
        <p className="text-gray-400">Test page - React hooks working</p>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-white">Debug info:</p>
          <p className="text-gray-300">- Module loaded: ✓</p>
          <p className="text-gray-300">- Component rendered: ✓</p>
          <p className="text-gray-300">- React hooks: ✓</p>
          <p className="text-gray-300">- Players state: {players.length}</p>
        </div>
      </div>
    </div>
  );
};

export default BattingStatsPage;
