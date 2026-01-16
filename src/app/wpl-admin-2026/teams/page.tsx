'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  city: string;
  captain: string;
  coach: string;
  founded: number;
  homeGround: string;
}

export default function WPLTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Mock data for WPL teams
      const mockTeams: Team[] = [
        {
          id: '1',
          name: 'Mumbai Indians',
          shortName: 'MI',
          logo: '/logos/mi.png',
          city: 'Mumbai',
          captain: 'Harmanpreet Kaur',
          coach: 'Charlotte Edwards',
          founded: 2018,
          homeGround: 'Wankhede Stadium, Mumbai'
        },
        {
          id: '2',
          name: 'Delhi Capitals',
          shortName: 'DC',
          logo: '/logos/dc.png',
          city: 'Delhi',
          captain: 'Meg Lanning',
          coach: 'Jonathan Batty',
          founded: 2018,
          homeGround: 'Arun Jaitley Stadium, Delhi'
        }
      ];
      setTeams(mockTeams);
    } catch (error) {
      setMessage('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <WPLAdminSidebarNew />
      <div className="lg:ml-64 p-6">
      <AnimatedSection>
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          WPL Teams Management
        </h1>
        
        {message && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-white text-center">Loading teams...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{team.shortName}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{team.name}</h3>
                    <p className="text-gray-300">{team.city}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>Captain:</strong> {team.captain}</p>
                  <p><strong>Coach:</strong> {team.coach}</p>
                  <p><strong>Home Ground:</strong> {team.homeGround}</p>
                  <p><strong>Founded:</strong> {team.founded}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedSection>
      </div>
    </div>
  );
}
