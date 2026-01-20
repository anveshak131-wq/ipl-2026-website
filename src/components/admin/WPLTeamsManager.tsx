'use client';

import { useState, useEffect } from 'react';
import { Team } from '@/types';
import { api } from '@/lib/data';
import { CustomEmoji } from '@/components/emoji/Emoji';

interface WPLTeamsManagerProps {
  onTeamsUpdate?: (teams: Team[]) => void;
  className?: string;
}

// WPL Teams Configuration
const WPL_TEAMS_CONFIG = [
  {
    id: '11',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    abbreviation: 'MI-W',
    colors: { primary: '#004BA0', secondary: '#FFD700' },
    home: 'Mumbai',
    founded: 2018,
    league: 'wpl' as const
  },
  {
    id: '12',
    name: 'Royal Challengers Bangalore (WPL)',
    shortName: 'RCB-W',
    abbreviation: 'RCB-W',
    colors: { primary: '#C8102E', secondary: '#FFD700' },
    home: 'Bengaluru',
    founded: 2018,
    league: 'wpl' as const
  },
  {
    id: '13',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    abbreviation: 'DC-W',
    colors: { primary: '#004BA0', secondary: '#DC2626' },
    home: 'Delhi',
    founded: 2018,
    league: 'wpl' as const
  },
  {
    id: '14',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    abbreviation: 'GG',
    colors: { primary: '#F97316', secondary: '#FFD700' },
    home: 'Ahmedabad',
    founded: 2018,
    league: 'wpl' as const
  },
  {
    id: '15',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    abbreviation: 'UPW',
    colors: { primary: '#059669', secondary: '#F97316' },
    home: 'Lucknow',
    founded: 2018,
    league: 'wpl' as const
  }
];

export default function WPLTeamsManager({ onTeamsUpdate, className = '' }: WPLTeamsManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    checkWPLTeamsSetup();
  }, []);

  const checkWPLTeamsSetup = async () => {
    try {
      setIsLoading(true);
      const existingTeams = await api.getTeams('wpl');
      setTeams(existingTeams);
      
      // Check if all WPL teams are properly configured
      const hasAllTeams = WPL_TEAMS_CONFIG.every(configTeam => 
        existingTeams.some(team => team.id === configTeam.id && team.league === 'wpl')
      );
      
      setIsSetupComplete(hasAllTeams);
      onTeamsUpdate?.(existingTeams);
    } catch (error) {
      console.error('Error checking WPL teams:', error);
      setMessage({ type: 'error', text: 'Failed to check WPL teams setup' });
    } finally {
      setIsLoading(false);
    }
  };

  const setupWPLTeams = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      // Get existing teams
      const existingTeams = await api.getTeams('wpl');
      const existingTeamIds = new Set(existingTeams.map(t => t.id));

      // Filter teams that need to be created
      const teamsToCreate = WPL_TEAMS_CONFIG.filter(configTeam => 
        !existingTeamIds.has(configTeam.id)
      );

      if (teamsToCreate.length === 0) {
        setMessage({ type: 'info', text: 'All WPL teams are already set up' });
        setIsSetupComplete(true);
        return;
      }

      // Create missing teams via API
      const createdTeams = [];
      for (const teamConfig of teamsToCreate) {
        try {
          const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'demo-token'}`
            },
            body: JSON.stringify({
              ...teamConfig,
              description: `${teamConfig.name} - WPL Team`
            })
          });

          if (response.ok) {
            const newTeam = await response.json();
            createdTeams.push(newTeam);
          } else {
            console.error(`Failed to create team ${teamConfig.name}:`, await response.text());
          }
        } catch (error) {
          console.error(`Error creating team ${teamConfig.name}:`, error);
        }
      }

      if (createdTeams.length > 0) {
        const updatedTeams = [...existingTeams, ...createdTeams];
        setTeams(updatedTeams);
        setIsSetupComplete(true);
        onTeamsUpdate?.(updatedTeams);
        setMessage({ 
          type: 'success', 
          text: `Successfully set up ${createdTeams.length} WPL teams` 
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to create any WPL teams' });
      }
    } catch (error) {
      console.error('Error setting up WPL teams:', error);
      setMessage({ type: 'error', text: 'Failed to set up WPL teams' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`admin-card ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <CustomEmoji type="star" size={20} />
          WPL Teams Management
        </h3>
        <p className="text-gray-400 text-sm">
          Configure Women's Premier League teams for player management
        </p>
      </div>

      {/* Status Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSetupComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-white font-medium">
              {isSetupComplete ? 'WPL Teams Configured' : 'Setup Required'}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {teams.length} of {WPL_TEAMS_CONFIG.length} teams
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Teams Preview */}
      {teams.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Configured Teams:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {WPL_TEAMS_CONFIG.map(team => {
              const isConfigured = teams.some(t => t.id === team.id);
              return (
                <div 
                  key={team.id}
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    isConfigured 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-gray-800/30 border-gray-700/30'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: team.colors.primary }}
                  >
                    {team.shortName}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{team.name}</div>
                    <div className="text-xs text-gray-400">{team.home}</div>
                  </div>
                  {isConfigured && (
                    <CustomEmoji type="star" size={14} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isSetupComplete && (
          <button
            onClick={setupWPLTeams}
            disabled={isLoading}
            className="admin-btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CustomEmoji type="star" size={16} />
            )}
            Setup WPL Teams
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
          <CustomEmoji type="warning" size={14} />
          Setup Instructions
        </h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• WPL teams use IDs 11-15 to avoid conflicts with IPL teams (1-10)</li>
          <li>• Each team is configured with proper colors and branding</li>
          <li>• Players can be added after teams are set up</li>
          <li>• League switching preserves existing players</li>
        </ul>
      </div>
    </div>
  );
}
