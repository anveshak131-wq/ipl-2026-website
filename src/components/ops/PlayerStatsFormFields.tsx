import React from 'react';

interface Props {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PlayerStatsFormFields: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-6 mt-4">
      {/* Batting Stats */}
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-base mb-3">Batting Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['matches', 'innings', 'runs', 'highestScore', 'battingAverage', 'strikeRate', 'halfCenturies', 'centuries'].map((field) => (
            <div key={field}>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                {field}
              </label>
              <input
                type={field === 'highestScore' ? 'text' : 'number'}
                step="any"
                name={`battingStats.${field}`}
                value={data?.battingStats?.[field] ?? ''}
                onChange={onChange}
                className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bowling Stats */}
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-base mb-3">Bowling Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['overs', 'wickets', 'economy', 'bestBowling', 'bowlingAverage', 'bowlingStrikeRate', 'fourWickets', 'fiveWickets'].map((field) => (
            <div key={field}>
              <label className="block text-xs uppercase font-medium text-gray-500 mb-1">
                {field}
              </label>
              <input
                type={field === 'bestBowling' ? 'text' : 'number'}
                step="any"
                name={`bowlingStats.${field}`}
                value={data?.bowlingStats?.[field] ?? ''}
                onChange={onChange}
                className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
