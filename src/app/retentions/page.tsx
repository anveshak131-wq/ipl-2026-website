'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  ArrowRight, 
  ArrowLeftRight, 
  Shield, 
  Coins, 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Trophy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface TeamOverview {
  rank: number;
  name: string;
  code: string;
  coach: string;
  captain: string;
  retainedCount: number;
  tradedInCount: number;
  releasedCount: number;
  squadCount: number;
  openSlots: number;
  overseasSlots: number;
  spentCap: number;
  remainingPurse: number;
  badgeColor: string;
  priority: string;
}

interface TradeDeal {
  id: string;
  player: string;
  from: string;
  to: string;
  role: string;
  nat: string;
  val: string;
  type: string;
  note: string;
}

interface PlayerRecord {
  name: string;
  role: string;
  style: string;
  nat: string;
  val: string;
  tag: string;
  status: 'RETAINED' | 'TRADED IN' | 'RELEASED' | 'TRADED OUT';
  note?: string;
}

const TEAMS_OVERVIEW: TeamOverview[] = [
  { rank: 1, name: 'Lucknow Super Giants', code: 'LSG', coach: 'Justin Langer', captain: 'Nicholas Pooran', retainedCount: 18, tradedInCount: 2, releasedCount: 4, squadCount: 18, openSlots: 7, overseasSlots: 3, spentCap: 109.55, remainingPurse: 47.45, badgeColor: '#0D9488', priority: 'Top-order explosive openers, genuine fast bowling backups, middle-order domestic depth' },
  { rank: 2, name: 'Kolkata Knight Riders', code: 'KKR', coach: 'Chandrakant Pandit', captain: 'Shreyas Iyer', retainedCount: 17, tradedInCount: 0, releasedCount: 6, squadCount: 17, openSlots: 8, overseasSlots: 3, spentCap: 115.35, remainingPurse: 41.65, badgeColor: '#4338CA', priority: 'Death-overs spearhead (post-Pathirana release), overseas wicketkeeper, power-hitting top order' },
  { rank: 3, name: 'Sunrisers Hyderabad', code: 'SRH', coach: 'Daniel Vettori', captain: 'Pat Cummins', retainedCount: 18, tradedInCount: 3, releasedCount: 5, squadCount: 18, openSlots: 7, overseasSlots: 3, spentCap: 116.85, remainingPurse: 40.15, badgeColor: '#EA580C', priority: 'Overseas marquee opening batter (Travis Head successor), wrist-spin depth, lower-order finisher' },
  { rank: 4, name: 'Delhi Capitals', code: 'DC', coach: 'Hemang Badani', captain: 'Rishabh Pant', retainedCount: 16, tradedInCount: 1, releasedCount: 4, squadCount: 16, openSlots: 9, overseasSlots: 3, spentCap: 117.50, remainingPurse: 39.50, badgeColor: '#2563EB', priority: 'Overseas marquee fast bowler (Starc replacement), specialist wicketkeeper cover, domestic finishers' },
  { rank: 5, name: 'Mumbai Indians', code: 'MI', coach: 'Mahela Jayawardene', captain: 'Suryakumar Yadav', retainedCount: 16, tradedInCount: 1, releasedCount: 5, squadCount: 16, openSlots: 9, overseasSlots: 2, spentCap: 124.40, remainingPurse: 32.60, badgeColor: '#0284C7', priority: 'Overseas new-ball left-arm quick (Boult replacement), middle-order spin-hitter, domestic seam all-rounder' },
  { rank: 6, name: 'Chennai Super Kings', code: 'CSK', coach: 'Stephen Fleming', captain: 'Ruturaj Gaikwad', retainedCount: 19, tradedInCount: 2, releasedCount: 5, squadCount: 19, openSlots: 6, overseasSlots: 1, spentCap: 128.95, remainingPurse: 28.05, badgeColor: '#D97706', priority: 'Post-Dhoni era transition: domestic wicket-keeper, express overseas death bowler, spin bowling all-rounder' },
  { rank: 7, name: 'Rajasthan Royals', code: 'RR', coach: 'Rahul Dravid', captain: 'Yashasvi Jaiswal', retainedCount: 19, tradedInCount: 2, releasedCount: 4, squadCount: 19, openSlots: 6, overseasSlots: 2, spentCap: 129.95, remainingPurse: 27.05, badgeColor: '#1E40AF', priority: 'Overseas middle-order finisher (Hetmyer replacement), backup all-rounder, domestic pacers' },
  { rank: 8, name: 'Punjab Kings', code: 'PBKS', coach: 'Ricky Ponting', captain: 'Hardik Pandya', retainedCount: 19, tradedInCount: 1, releasedCount: 4, squadCount: 19, openSlots: 6, overseasSlots: 2, spentCap: 138.40, remainingPurse: 18.60, badgeColor: '#B91C1C', priority: 'Death overs specialist bowler (filling Arshdeep void), top-order overseas anchor, wicketkeeping reserves' },
  { rank: 9, name: 'Royal Challengers Bengaluru', code: 'RCB', coach: 'Andy Flower', captain: 'Rajat Patidar', retainedCount: 20, tradedInCount: 0, releasedCount: 5, squadCount: 20, openSlots: 5, overseasSlots: 1, spentCap: 142.85, remainingPurse: 14.15, badgeColor: '#991B1B', priority: 'Replacement dynamic overseas all-rounder (for injured Jacob Bethell), spin attack depth, young domestic batter' },
  { rank: 10, name: 'Gujarat Titans', code: 'GT', coach: 'Ashish Nehra', captain: 'Shubman Gill', retainedCount: 22, tradedInCount: 1, releasedCount: 4, squadCount: 22, openSlots: 3, overseasSlots: 1, spentCap: 148.25, remainingPurse: 8.75, badgeColor: '#0F766E', priority: 'Overseas pace bowler cover, specialist power-finisher backup, local scouting selections' }
];

const BLOCKBUSTER_TRADES: TradeDeal[] = [
  { id: 'TRD-01', player: 'Hardik Pandya', from: 'Mumbai Indians (MI)', to: 'Punjab Kings (PBKS)', role: 'Pace All-Rounder', nat: 'Indian', val: '₹18.00 Cr', type: 'Direct Player Swap', note: 'Straight swap for Arshdeep Singh. Appointed PBKS captain by Ricky Ponting.' },
  { id: 'TRD-02', player: 'Arshdeep Singh', from: 'Punjab Kings (PBKS)', to: 'Mumbai Indians (MI)', role: 'Left-Arm Fast Bowler', nat: 'Indian', val: '₹18.00 Cr', type: 'Direct Player Swap', note: 'Straight swap for Hardik Pandya. Solidifies MI premier death-overs attack with Bumrah.' },
  { id: 'TRD-03', player: 'Rishabh Pant', from: 'Lucknow Super Giants (LSG)', to: 'Delhi Capitals (DC)', role: 'Wicket-Keeper / Batter', nat: 'Indian', val: '₹15.00 Cr', type: 'Direct Player Swap', note: 'Emotional homecoming: Pant returns to DC as captain in swap for Kuldeep Yadav.' },
  { id: 'TRD-04', player: 'Kuldeep Yadav', from: 'Delhi Capitals (DC)', to: 'Lucknow Super Giants (LSG)', role: 'Left-Arm Wrist Spinner', nat: 'Indian', val: '₹13.50 Cr', type: 'Direct Player Swap', note: 'Pairs with Ravi Bishnoi at Ekana Stadium to form lethal twin-spin tandem.' },
  { id: 'TRD-05', player: 'Liam Livingstone', from: 'Sunrisers Hyderabad (SRH)', to: 'Chennai Super Kings (CSK)', role: 'Spin All-Rounder', nat: 'Overseas (ENG)', val: '₹11.50 Cr', type: 'Player Swap + Cash', note: 'Traded to CSK in swap package for Khaleel Ahmed to dominate spin at Chepauk.' },
  { id: 'TRD-06', player: 'Khaleel Ahmed', from: 'Chennai Super Kings (CSK)', to: 'Sunrisers Hyderabad (SRH)', role: 'Left-Arm Fast Bowler', nat: 'Indian', val: '₹6.50 Cr', type: 'Player Swap + Cash', note: 'Returns to SRH to spearhead left-arm powerplay swing bowling.' },
  { id: 'TRD-07', player: 'Jack Edwards', from: 'Sunrisers Hyderabad (SRH)', to: 'Chennai Super Kings (CSK)', role: 'Pace All-Rounder', nat: 'Overseas (AUS)', val: '₹2.00 Cr', type: 'Player Swap', note: 'Swapped for Nathan Ellis; adds seam all-round balance and middle-order firepower.' },
  { id: 'TRD-08', player: 'Nathan Ellis', from: 'Chennai Super Kings (CSK)', to: 'Sunrisers Hyderabad (SRH)', role: 'Death Fast Bowler', nat: 'Overseas (AUS)', val: '₹2.50 Cr', type: 'Player Swap', note: 'Swapped for Jack Edwards; provides Cummins with proven death-overs execution.' },
  { id: 'TRD-09', player: 'Mohammed Shami', from: 'Lucknow Super Giants (LSG)', to: 'Rajasthan Royals (RR)', role: 'Fast Bowler (Swing)', nat: 'Indian', val: '₹10.00 Cr', type: 'All-Cash Transfer', note: 'Rahul Dravid acquires premier strike bowler in all-cash transfer.' },
  { id: 'TRD-10', player: 'Sam Curran', from: 'Rajasthan Royals (RR)', to: 'Lucknow Super Giants (LSG)', role: 'Left-Arm All-Rounder', nat: 'Overseas (ENG)', val: '₹8.50 Cr', type: 'Player Swap', note: 'Traded to LSG for M. Siddharth; completes LSG overseas pace all-rounder quota.' },
  { id: 'TRD-11', player: 'Manimaran Siddharth', from: 'Lucknow Super Giants (LSG)', to: 'Rajasthan Royals (RR)', role: 'Slow Left-Arm Spinner', nat: 'Indian', val: '₹0.50 Cr', type: 'Player Swap', note: 'Traded to RR in Sam Curran deal; economical powerplay spin option.' },
  { id: 'TRD-12', player: 'Harshal Patel', from: 'Sunrisers Hyderabad (SRH)', to: 'Gujarat Titans (GT)', role: 'Fast Bowler (Death)', nat: 'Indian', val: '₹8.00 Cr', type: 'All-Cash Transfer', note: 'Ashish Nehra acquires Purple Cap winner in direct all-cash deal.' }
];

const ROSTERS_DATA: Record<string, { retained: PlayerRecord[]; released: PlayerRecord[] }> = {
  LSG: {
    retained: [
      { name: 'Nicholas Pooran', role: 'Wicket-Keeper / Batter', style: 'LHB / WK', nat: 'Overseas (WI)', val: '₹21.00 Cr', tag: 'Captain / Marquee 1', status: 'RETAINED' },
      { name: 'Mayank Yadav', role: 'Fast Bowler', style: 'Right-arm Express Fast', nat: 'Indian', val: '₹11.00 Cr', tag: 'Retention Marquee 2', status: 'RETAINED' },
      { name: 'Ravi Bishnoi', role: 'Spin Bowler', style: 'Right-arm Leg-break', nat: 'Indian', val: '₹11.00 Cr', tag: 'Retention Marquee 3', status: 'RETAINED' },
      { name: 'Kuldeep Yadav', role: 'Spin Bowler', style: 'Left-arm Wrist Spin', nat: 'Indian', val: '₹13.50 Cr', tag: 'TRADED IN (from DC)', status: 'TRADED IN' },
      { name: 'Sam Curran', role: 'All-Rounder', style: 'LHB / Left-arm Fast Medium', nat: 'Overseas (ENG)', val: '₹8.50 Cr', tag: 'TRADED IN (from RR)', status: 'TRADED IN' },
      { name: 'Avesh Khan', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Indian', val: '₹9.75 Cr', tag: 'Pace Core', status: 'RETAINED' },
      { name: 'David Miller', role: 'Batter (Finisher)', style: 'LHB', nat: 'Overseas (SA)', val: '₹7.50 Cr', tag: 'Overseas Star', status: 'RETAINED' },
      { name: 'Akash Deep', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Indian', val: '₹8.00 Cr', tag: 'Pace Core', status: 'RETAINED' },
      { name: 'Ayush Badoni', role: 'Batter', style: 'RHB / Off-break', nat: 'Indian', val: '₹4.00 Cr', tag: 'Uncapped Retained', status: 'RETAINED' },
      { name: 'Mohsin Khan', role: 'Fast Bowler', style: 'Left-arm Fast Medium', nat: 'Indian', val: '₹4.00 Cr', tag: 'Uncapped Retained', status: 'RETAINED' },
      { name: 'Mitchell Marsh', role: 'All-Rounder', style: 'RHB / Right-arm Medium', nat: 'Overseas (AUS)', val: '₹3.40 Cr', tag: 'Overseas Star', status: 'RETAINED' },
      { name: 'Abdul Samad', role: 'All-Rounder', style: 'RHB / Leg-break', nat: 'Indian', val: '₹4.20 Cr', tag: 'Domestic Core', status: 'RETAINED' },
      { name: 'Shahbaz Ahmed', role: 'All-Rounder', style: 'LHB / Slow Left-arm', nat: 'Indian', val: '₹2.40 Cr', tag: 'Domestic Core', status: 'RETAINED' },
      { name: 'Matthew Breetzke', role: 'Batter / Wicket-Keeper', style: 'RHB / WK', nat: 'Overseas (SA)', val: '₹0.75 Cr', tag: 'Overseas Depth', status: 'RETAINED' },
      { name: 'Aryan Juyal', role: 'Wicket-Keeper / Batter', style: 'RHB / WK', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Reserve', status: 'RETAINED' },
      { name: 'Himmat Singh', role: 'Batter', style: 'RHB', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Reserve', status: 'RETAINED' },
      { name: 'Digvesh Singh', role: 'Spin Bowler', style: 'Right-arm Leg-break', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Reserve', status: 'RETAINED' },
      { name: 'Prince Yadav', role: 'All-Rounder', style: 'RHB / Right-arm Medium', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Reserve', status: 'RETAINED' }
    ],
    released: [
      { name: 'Shamar Joseph', role: 'Fast Bowler', style: 'Right-arm Express Fast', nat: 'Overseas (WI)', val: '₹3.00 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'High economy rate in 2026; released for overseas slot optimization' },
      { name: 'Ashton Turner', role: 'All-Rounder', style: 'RHB / Off-break', nat: 'Overseas (AUS)', val: '₹1.00 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Overseas batting slot restructured' },
      { name: 'Yuvraj Singh (Dodiya)', role: 'Spin Bowler', style: 'Right-arm Off-break', nat: 'Indian', val: '₹0.30 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Domestic roster re-balancing' },
      { name: 'Arshin Kulkarni', role: 'All-Rounder', style: 'RHB / Medium', nat: 'Indian', val: '₹0.20 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Released into mini-auction pool' },
      { name: 'Rishabh Pant', role: 'Wicket-Keeper / Batter', style: 'LHB / WK', nat: 'Indian', val: '₹15.00 Cr', tag: 'TRADED OUT', status: 'TRADED OUT', note: 'Blockbuster swap with DC for Kuldeep Yadav (₹13.50 Cr)' },
      { name: 'Mohammed Shami', role: 'Fast Bowler', style: 'Right-arm Fast', nat: 'Indian', val: '₹10.00 Cr', tag: 'TRADED OUT', status: 'TRADED OUT', note: 'Transferred to Rajasthan Royals for all-cash consideration (₹10.00 Cr)' },
      { name: 'Manimaran Siddharth', role: 'Spin Bowler', style: 'Slow Left-arm', nat: 'Indian', val: '₹0.50 Cr', tag: 'TRADED OUT', status: 'TRADED OUT', note: 'Traded to Rajasthan Royals in Sam Curran player deal' }
    ]
  },

  KKR: {
    retained: [
      { name: 'Cameron Green', role: 'All-Rounder', style: 'RHB / Right-arm Fast Medium', nat: 'Overseas (AUS)', val: '₹25.20 Cr', tag: 'League Top Retained', status: 'RETAINED' },
      { name: 'Venkatesh Iyer', role: 'All-Rounder', style: 'LHB / Right-arm Medium', nat: 'Indian', val: '₹23.75 Cr', tag: 'Marquee Indian Retained', status: 'RETAINED' },
      { name: 'Rinku Singh', role: 'Batter (Finisher)', style: 'LHB', nat: 'Indian', val: '₹13.00 Cr', tag: 'Core Retention 1', status: 'RETAINED' },
      { name: 'Varun Chakaravarthy', role: 'Spin Bowler', style: 'Right-arm Mystery Spin', nat: 'Indian', val: '₹12.00 Cr', tag: 'Core Retention 2', status: 'RETAINED' },
      { name: 'Sunil Narine', role: 'All-Rounder', style: 'LHB / Right-arm Off-break', nat: 'Overseas (WI)', val: '₹12.00 Cr', tag: 'Core Retention 3', status: 'RETAINED' },
      { name: 'Andre Russell', role: 'All-Rounder', style: 'RHB / Right-arm Fast', nat: 'Overseas (WI)', val: '₹12.00 Cr', tag: 'Core Retention 4', status: 'RETAINED' },
      { name: 'Harshit Rana', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Indian', val: '₹4.00 Cr', tag: 'Uncapped Retained', status: 'RETAINED' },
      { name: 'Ramandeep Singh', role: 'All-Rounder', style: 'RHB / Right-arm Medium', nat: 'Indian', val: '₹4.00 Cr', tag: 'Uncapped Retained', status: 'RETAINED' },
      { name: 'Anrich Nortje', role: 'Fast Bowler', style: 'Right-arm Express Fast', nat: 'Overseas (SA)', val: '₹6.50 Cr', tag: 'Overseas Pace Star', status: 'RETAINED' },
      { name: 'Quinton de Kock', role: 'Wicket-Keeper / Batter', style: 'LHB / WK', nat: 'Overseas (SA)', val: '₹3.60 Cr', tag: 'Overseas Star', status: 'RETAINED' },
      { name: 'Angkrish Raghuvanshi', role: 'Batter', style: 'RHB', nat: 'Indian', val: '₹3.00 Cr', tag: 'Top-order Talent', status: 'RETAINED' },
      { name: 'Vaibhav Arora', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Indian', val: '₹1.80 Cr', tag: 'Swing Specialist', status: 'RETAINED' },
      { name: 'Rovman Powell', role: 'Batter (Power Finisher)', style: 'RHB / Medium', nat: 'Overseas (WI)', val: '₹1.50 Cr', tag: 'Overseas Power', status: 'RETAINED' },
      { name: 'Manish Pandey', role: 'Batter', style: 'RHB', nat: 'Indian', val: '₹0.75 Cr', tag: 'Domestic Veteran', status: 'RETAINED' },
      { name: 'Chetan Sakariya', role: 'Fast Bowler', style: 'Left-arm Fast Medium', nat: 'Indian', val: '₹0.50 Cr', tag: 'Domestic Pace', status: 'RETAINED' },
      { name: 'Anukul Roy', role: 'All-Rounder', style: 'LHB / Slow Left-arm', nat: 'Indian', val: '₹0.40 Cr', tag: 'Domestic Core', status: 'RETAINED' },
      { name: 'Luvnith Sisodia', role: 'Wicket-Keeper / Batter', style: 'LHB / WK', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Reserve', status: 'RETAINED' }
    ],
    released: [
      { name: 'Matheesha Pathirana', role: 'Fast Bowler', style: 'Right-arm Fast (Sling)', nat: 'Overseas (SL)', val: '₹18.00 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Massive tactical release to unburden ₹18.00 Cr purse for auction rebuilding' },
      { name: 'Blessing Muzarabani', role: 'Fast Bowler', style: 'Right-arm Fast', nat: 'Overseas (ZIM)', val: '₹0.75 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Signed as replacement fast bowler in 2026; released to open overseas quota' },
      { name: 'Rachin Ravindra', role: 'All-Rounder', style: 'LHB / Slow Left-arm', nat: 'Overseas (NZ)', val: '₹4.00 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Surplus overseas top-order slot released' },
      { name: 'Rahul Tripathi', role: 'Batter', style: 'RHB', nat: 'Indian', val: '₹3.40 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Domestic batting reshuffle' },
      { name: 'Sherfane Rutherford', role: 'Batter', style: 'LHB / Medium', nat: 'Overseas (WI)', val: '₹1.50 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Overseas bench optimization' },
      { name: 'Srikar Bharat', role: 'Wicket-Keeper / Batter', style: 'RHB / WK', nat: 'Indian', val: '₹0.50 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Domestic wicketkeeper released' }
    ]
  },

  RCB: {
    retained: [
      { name: 'Virat Kohli', role: 'Batter', style: 'RHB (Legend Anchor)', nat: 'Indian', val: '₹21.00 Cr', tag: 'Franchise Icon Retained 1', status: 'RETAINED' },
      { name: 'Josh Hazlewood', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Overseas (AUS)', val: '₹12.50 Cr', tag: 'Overseas Bowling Spearhead', status: 'RETAINED' },
      { name: 'Phil Salt', role: 'Wicket-Keeper / Batter', style: 'RHB / WK (Opener)', nat: 'Overseas (ENG)', val: '₹11.50 Cr', tag: 'Explosive Keeper-Opener', status: 'RETAINED' },
      { name: 'Rajat Patidar', role: 'Batter', style: 'RHB (Spin Punisher)', nat: 'Indian', val: '₹11.00 Cr', tag: 'Captain / Title-Winning Core', status: 'RETAINED' },
      { name: 'Jitesh Sharma', role: 'Wicket-Keeper / Batter', style: 'RHB / WK (Finisher)', nat: 'Indian', val: '₹11.00 Cr', tag: 'Elite Death-Overs Finisher', status: 'RETAINED' },
      { name: 'Bhuvneshwar Kumar', role: 'Fast Bowler', style: 'Right-arm Fast (Swing)', nat: 'Indian', val: '₹10.75 Cr', tag: 'Powerplay Seam Master', status: 'RETAINED' },
      { name: 'Rasikh Salam', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Indian', val: '₹6.00 Cr', tag: 'Death Overs Yorker Bowler', status: 'RETAINED' },
      { name: 'Krunal Pandya', role: 'All-Rounder', style: 'LHB / Slow Left-arm', nat: 'Indian', val: '₹5.75 Cr', tag: 'Tactical Spin All-Rounder', status: 'RETAINED' },
      { name: 'Yash Dayal', role: 'Fast Bowler', style: 'Left-arm Fast Medium', nat: 'Indian', val: '₹5.00 Cr', tag: 'Uncapped Hero Core', status: 'RETAINED' },
      { name: 'Tim David', role: 'Batter (Finisher)', style: 'RHB (Power Finisher)', nat: 'Overseas (AUS)', val: '₹3.00 Cr', tag: 'Overseas Power Striker', status: 'RETAINED' },
      { name: 'Suyash Sharma', role: 'Spin Bowler', style: 'Right-arm Leg-break / Googly', nat: 'Indian', val: '₹2.60 Cr', tag: 'Impact Wrist Spinner', status: 'RETAINED' },
      { name: 'Devdutt Padikkal', role: 'Batter', style: 'LHB', nat: 'Indian', val: '₹2.00 Cr', tag: 'Top-Order Classical Batter', status: 'RETAINED' },
      { name: 'Nuwan Thushara', role: 'Fast Bowler', style: 'Right-arm Fast (Sling)', nat: 'Overseas (SL)', val: '₹1.60 Cr', tag: 'Sling Yorker Bowler', status: 'RETAINED' },
      { name: 'Romario Shepherd', role: 'All-Rounder', style: 'RHB / Right-arm Fast Medium', nat: 'Overseas (WI)', val: '₹1.50 Cr', tag: 'Overseas Power All-Rounder', status: 'RETAINED' },
      { name: 'Lungi Ngidi', role: 'Fast Bowler', style: 'Right-arm Fast', nat: 'Overseas (SA)', val: '₹1.00 Cr', tag: 'Overseas Express Bowler', status: 'RETAINED' },
      { name: 'Swapnil Singh', role: 'All-Rounder', style: 'RHB / Slow Left-arm', nat: 'Indian', val: '₹0.50 Cr', tag: 'Impact All-Rounder Core', status: 'RETAINED' },
      { name: 'Manoj Bhandage', role: 'All-Rounder', style: 'LHB / Right-arm Medium', nat: 'Indian', val: '₹0.30 Cr', tag: 'Local Karnataka All-Rounder', status: 'RETAINED' },
      { name: 'Swastik Chikara', role: 'Batter', style: 'RHB / Right-arm Off-break', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Power Talent', status: 'RETAINED' },
      { name: 'Abhinandan Singh', role: 'Fast Bowler', style: 'Right-arm Medium Fast', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Seam Prospect', status: 'RETAINED' },
      { name: 'Mohit Rathee', role: 'All-Rounder', style: 'RHB / Right-arm Leg-break', nat: 'Indian', val: '₹0.30 Cr', tag: 'Domestic Spin All-Rounder', status: 'RETAINED' }
    ],
    released: [
      { name: 'Jacob Bethell', role: 'All-Rounder', style: 'LHB / Slow Left-arm', nat: 'Overseas (ENG)', val: '₹2.60 Cr', tag: 'RELEASED (MED)', status: 'RELEASED', note: 'Ruled out of IPL 2027 following knee surgery; released for overseas flexibility' },
      { name: 'Jacob Duffy', role: 'Fast Bowler', style: 'Right-arm Fast Medium', nat: 'Overseas (NZ)', val: '₹1.00 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Overseas replacement fast bowler released to open pace auction slot' },
      { name: 'Jordan Cox', role: 'Wicket-Keeper / Batter', style: 'RHB / WK', nat: 'Overseas (ENG)', val: '₹0.75 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Overseas backup keeper-batter released to create roster vacancy' },
      { name: 'Richard Gleeson', role: 'Fast Bowler', style: 'Right-arm Express Fast', nat: 'Overseas (ENG)', val: '₹0.50 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Overseas veteran bowler released' },
      { name: 'Mangesh Yadav', role: 'Fast Bowler', style: 'Left-arm Fast Medium', nat: 'Indian', val: '₹0.30 Cr', tag: 'RELEASED', status: 'RELEASED', note: 'Domestic seam reserve released' }
    ]
  }
};

export default function RetentionsPage() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'trades' | 'teams'>('ledger');
  const [selectedTeam, setSelectedTeam] = useState<string>('RCB');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const activeRoster = ROSTERS_DATA[selectedTeam] || ROSTERS_DATA['RCB'];

  const filteredRetained = useMemo(() => {
    return activeRoster.retained.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.style.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || p.role.toLowerCase().includes(roleFilter.toLowerCase());
      return matchesSearch && matchesRole;
    });
  }, [activeRoster, searchQuery, roleFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header & Actions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                IPL 2027 Official Pre-Auction Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Player Retentions, Trades & Purse Hub
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
                Official franchise ledgers, approved trade register, and team-wise contract rosters ahead of the Goa Mini-Auction.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a 
                href="/downloads/IPL_2027_Official_Retentions_Trades_Purse_Dossier.pdf" 
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <FileText className="w-4 h-4" />
                Download PDF Dossier (13 Pages)
              </a>

              <a 
                href="/downloads/IPL_2027_Teamwise_Retentions_Releases_Trades.xlsx" 
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Download Excel Ledger (.xlsx)
              </a>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> Salary Cap Limit
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">₹157.00 Cr</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Per franchise standard limit</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" /> Available Purse
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">₹297.95 Cr</div>
              <div className="text-[11px] text-slate-500 mt-0.5">League aggregate war chest</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Open Vacancies
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">66 Slots</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Includes 21 overseas vacancies</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-indigo-400" /> Retained Players
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1">184 Players</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across all 10 franchises</div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            League Purse Ledger
          </button>

          <button
            onClick={() => setActiveTab('trades')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'trades'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Blockbuster Trades Wire (12)
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Franchise Squad Rosters
          </button>
        </div>

        {/* TAB 1: LEAGUE LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEAMS_OVERVIEW.map((team) => (
                <div 
                  key={team.code}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
                  style={{ borderLeftColor: team.badgeColor, borderLeftWidth: '4px' }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rank #{team.rank}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                        {team.code}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mt-1">{team.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Coach: <strong className="text-slate-200">{team.coach}</strong> | Cap: <strong className="text-slate-200">{team.captain}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80">
                      <div>
                        <div className="text-[11px] uppercase font-semibold text-slate-500">Purse Remaining</div>
                        <div className="text-lg font-bold font-mono text-emerald-400">₹{team.remainingPurse.toFixed(2)} Cr</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase font-semibold text-slate-500">Slots Open</div>
                        <div className="text-lg font-bold font-mono text-slate-200">{team.openSlots} <span className="text-xs text-slate-500">({team.overseasSlots} O/S)</span></div>
                      </div>
                    </div>

                    {/* Progress Bar for Purse Spent */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Spent: ₹{team.spentCap.toFixed(2)} Cr</span>
                        <span>Cap: ₹157.00 Cr</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${(team.spentCap / 157) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                    <strong className="text-slate-300 uppercase tracking-wider text-[10px] block mb-0.5">Auction Strategy:</strong>
                    {team.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BLOCKBUSTER TRADES WIRE */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BLOCKBUSTER_TRADES.map((trade) => (
                <div 
                  key={trade.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div>
                        <span className="text-xs font-mono font-semibold text-slate-500 mr-2">{trade.id}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {trade.type}
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-emerald-400">{trade.val}</div>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-lg font-bold text-white">{trade.player}</h4>
                      <p className="text-xs text-slate-400 font-medium">{trade.role} • {trade.nat}</p>

                      <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs font-semibold">
                        <span className="text-slate-400">{trade.from}</span>
                        <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-white font-bold">{trade.to}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                    <strong className="text-slate-300">Context:</strong> {trade.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FRANCHISE ROSTERS */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* Team Picker Pills */}
            <div className="flex flex-wrap gap-2">
              {TEAMS_OVERVIEW.map((t) => (
                <button
                  key={t.code}
                  onClick={() => setSelectedTeam(t.code)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedTeam === t.code
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.badgeColor }}></span>
                  {t.code}
                </button>
              ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search player, role, style..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {['ALL', 'Batter', 'Wicket-Keeper', 'All-Rounder', 'Bowler'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      roleFilter === r
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Retained Players Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Active Squad Core ({filteredRetained.length})
                </h4>
                <span className="text-xs text-slate-400">Retained & Traded In</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Player</th>
                      <th className="py-2.5 px-4">Role & Style</th>
                      <th className="py-2.5 px-4 text-center">Nationality</th>
                      <th className="py-2.5 px-4 text-right">Valuation</th>
                      <th className="py-2.5 px-4 text-center">Designation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRetained.map((p, idx) => (
                      <tr key={p.name} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-white">{p.name}</td>
                        <td className="py-2.5 px-4 text-slate-300">{p.role} <span className="text-slate-500">({p.style})</span></td>
                        <td className="py-2.5 px-4 text-center text-slate-400">{p.nat}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">{p.val}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'TRADED IN'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {p.tag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Departed Players Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Departed Players ({activeRoster.released.length})
                </h4>
                <span className="text-xs text-slate-400">Released & Traded Out</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Player</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4 text-center">Nationality</th>
                      <th className="py-2.5 px-4 text-right">Prior Val</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4">Tactical Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeRoster.released.map((p, idx) => (
                      <tr key={p.name} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-200">{p.name}</td>
                        <td className="py-2.5 px-4 text-slate-400">{p.role}</td>
                        <td className="py-2.5 px-4 text-center text-slate-400">{p.nat}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">{p.val}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'RELEASED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 text-[11px]">{p.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
