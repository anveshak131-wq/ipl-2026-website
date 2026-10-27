import { NextRequest, NextResponse } from 'next/server';

const WPL_TEAMS = [
  {
    id: '11',
    name: 'Delhi Capitals Women',
    shortName: 'DC-W',
    code: 'DC',
    league: 'wpl',
    primaryColor: '#004c97',
    secondaryColor: '#d71921',
    colors: { primary: '#004c97', secondary: '#d71921', text: '#ffffff', accent: '#d71921' }
  },
  {
    id: '12',
    name: 'Gujarat Giants',
    shortName: 'GG',
    code: 'GG',
    league: 'wpl',
    primaryColor: '#ea580c',
    secondaryColor: '#f59e0b',
    colors: { primary: '#ea580c', secondary: '#f59e0b', text: '#ffffff', accent: '#f59e0b' }
  },
  {
    id: '13',
    name: 'Mumbai Indians Women',
    shortName: 'MI-W',
    code: 'MI',
    league: 'wpl',
    primaryColor: '#005ea0',
    secondaryColor: '#d1ab3e',
    colors: { primary: '#005ea0', secondary: '#d1ab3e', text: '#ffffff', accent: '#d1ab3e' }
  },
  {
    id: '14',
    name: 'Royal Challengers Bengaluru Women',
    shortName: 'RCB-W',
    code: 'RCB',
    league: 'wpl',
    primaryColor: '#991b1b',
    secondaryColor: '#ca8a04',
    colors: { primary: '#991b1b', secondary: '#ca8a04', text: '#ffffff', accent: '#ca8a04' }
  },
  {
    id: '15',
    name: 'UP Warriorz',
    shortName: 'UPW',
    code: 'UPW',
    league: 'wpl',
    primaryColor: '#ca8a04',
    secondaryColor: '#7e22ce',
    colors: { primary: '#ca8a04', secondary: '#7e22ce', text: '#ffffff', accent: '#7e22ce' }
  }
];

const IPL_TEAMS = [
  { id: '1', name: 'Royal Challengers Bengaluru', shortName: 'RCB', league: 'ipl', colors: { primary: '#e11d48', secondary: '#1e293b' } },
  { id: '2', name: 'Mumbai Indians', shortName: 'MI', league: 'ipl', colors: { primary: '#004ba0', secondary: '#d1ab3e' } },
  { id: '3', name: 'Chennai Super Kings', shortName: 'CSK', league: 'ipl', colors: { primary: '#facc15', secondary: '#1e3a8a' } },
  { id: '4', name: 'Kolkata Knight Riders', shortName: 'KKR', league: 'ipl', colors: { primary: '#3b0764', secondary: '#eab308' } },
  { id: '5', name: 'Sunrisers Hyderabad', shortName: 'SRH', league: 'ipl', colors: { primary: '#f97316', secondary: '#000000' } },
  { id: '6', name: 'Rajasthan Royals', shortName: 'RR', league: 'ipl', colors: { primary: '#ec4899', secondary: '#1e3a8a' } },
  { id: '7', name: 'Delhi Capitals', shortName: 'DC', league: 'ipl', colors: { primary: '#1d4ed8', secondary: '#dc2626' } },
  { id: '8', name: 'Punjab Kings', shortName: 'PBKS', league: 'ipl', colors: { primary: '#dc2626', secondary: '#d1d5db' } },
  { id: '9', name: 'Lucknow Super Giants', shortName: 'LSG', league: 'ipl', colors: { primary: '#0284c7', secondary: '#f97316' } },
  { id: '10', name: 'Gujarat Titans', shortName: 'GT', league: 'ipl', colors: { primary: '#0f172a', secondary: '#eab308' } }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = (searchParams.get('league') || 'ipl').toLowerCase();
  return NextResponse.json(league === 'wpl' ? WPL_TEAMS : IPL_TEAMS);
}
