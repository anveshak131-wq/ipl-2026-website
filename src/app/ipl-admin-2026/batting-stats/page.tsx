'use client';

const BattingStatsPage = () => {
  console.log('BattingStatsPage component rendered!');

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Batting Statistics</h1>
        <p className="text-gray-400">Test page - if you see this, the component is working</p>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-white">Debug info:</p>
          <p className="text-gray-300">- Component rendered: ✓</p>
          <p className="text-gray-300">- Basic display: ✓</p>
          <p className="text-gray-300">- Check console for component render message</p>
        </div>
      </div>
    </div>
  );
};

export default BattingStatsPage;
