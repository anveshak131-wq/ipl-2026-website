# WPL Scorecard System Development & Maintenance Guide

## Overview
This guide explains how to develop and maintain cricket scorecard pages for the WPL (Women's Premier League). A scorecard is a comprehensive record of a match showing batting statistics, bowling figures, wickets, and other match details.

## Table of Contents
1. [Scorecard Structure](#scorecard-structure)
2. [Data Architecture](#data-architecture)
3. [Admin Scorecard Page](#admin-scorecard-page)
4. [Public Scorecard Page](#public-scorecard-page)
5. [Maintenance & Updates](#maintenance--updates)
6. [Best Practices](#best-practices)

---

## Scorecard Structure

### Key Components of a Cricket Scorecard

A complete cricket scorecard contains:

#### 1. **Match Information**
- Teams competing
- Venue/Ground
- Match date and time
- Toss details (who won, what they chose)
- Weather conditions (optional)
- Umpires (optional)

#### 2. **Batting Statistics**
For each batting team:
- Player name
- Runs scored
- Balls faced
- Fours hit
- Sixes hit
- Dismissal information (how out, bowled by, caught by)
- Strike rate (runs/balls × 100)

#### 3. **Bowling Statistics**
For each bowler:
- Overs bowled (e.g., 4.2 means 4 overs and 2 balls)
- Runs conceded
- Wickets taken
- Maidens (overs with 0 runs)
- Economy rate (runs/overs)
- Dots and extras

#### 4. **Summary Statistics**
- Total runs per team
- Total wickets lost
- Extras (wides, no-balls, byes, leg-byes)
- Powerplay information
- Result and margin

#### 5. **Partnership Information**
- Current/last partnerships between batsmen
- Runs added in partnership
- Balls faced in partnership

---

## Data Architecture

### Data Model (Cloudflare KV Storage)

```javascript
// Scorecard Data Structure
{
  "scorecardId": "unique-id",
  "matchId": "wpl-2026-match-id",
  "league": "wpl",
  
  // Match Information
  "matchInfo": {
    "team1": { id: 11, name: "MI-W" },
    "team2": { id: 14, name: "Gujarat Giants" },
    "venue": "DY Patil Stadium, Mumbai",
    "date": "2026-01-10",
    "time": "10:30 AM",
    "toss": { winner: "MI-W", decision: "bat" },
    "status": "completed" | "live" | "scheduled",
    "weather": "Clear"
  },
  
  // Innings Data
  "innings": [
    {
      "inningsNumber": 1,
      "battingTeamId": 11,
      "batting": [
        {
          "playerId": "player-id",
          "name": "Player Name",
          "runs": 45,
          "balls": 28,
          "fours": 6,
          "sixes": 1,
          "dismissal": {
            "type": "caught", // "bowled", "lbw", "run-out", "not-out"
            "bowlerId": "bowler-id",
            "fielderId": "fielder-id"
          }
        }
      ],
      "bowling": [
        {
          "playerId": "bowler-id",
          "name": "Bowler Name",
          "overs": 4,
          "balls": 2, // 4.2 overs
          "runs": 28,
          "wickets": 1,
          "maidens": 0,
          "dots": 8,
          "wides": 0,
          "noBalls": 0
        }
      ],
      "extras": {
        "wides": 2,
        "noBalls": 1,
        "byes": 0,
        "legByes": 3
      },
      "totalRuns": 154,
      "totalWickets": 6,
      "totalOvers": 20,
      "powerplay": { overs: 6, runs: 48 }
    }
  ],
  
  // Result
  "result": {
    "winner": "MI-W",
    "margin": "by 5 runs" | "by 3 wickets",
    "manOfTheMatch": "player-id"
  }
}
```

### API Endpoints

```javascript
// GET scorecard
GET /api/scorecards/:scorecardId

// GET match scorecards (both innings)
GET /api/scorecards/match/:matchId

// POST new scorecard
POST /api/scorecards
Body: { scorecard data }

// PUT update scorecard (admin only)
PUT /api/scorecards/:scorecardId
Body: { updated fields }

// PUT update single innings
PUT /api/scorecards/:scorecardId/innings/:inningsNumber
Body: { innings data }

// PUT update batting stats
PUT /api/scorecards/:scorecardId/innings/:inningsNumber/batting/:playerIndex
Body: { batting data }

// PUT update bowling stats
PUT /api/scorecards/:scorecardId/innings/:inningsNumber/bowling/:bowlerIndex
Body: { bowling data }
```

---

## Admin Scorecard Page

### Location
`src/app/wpl-admin-2026/scorecard/page.tsx`

### Features

#### 1. **Match Selection**
- Dropdown of all WPL matches
- Filter by team, date, status
- Search by match ID

#### 2. **Scorecard Creation/Editing**
- Create new scorecard for scheduled match
- Pre-populate with match info and player lists
- Tab-based interface:
  - Match Info (basic details)
  - Team 1 Innings (batting, bowling)
  - Team 2 Innings (batting, bowling)
  - Result & Summary

#### 3. **Batting Entry**
- Table with player rows
- Columns: Player Name, Runs, Balls, Fours, Sixes, Dismissal
- Real-time calculation of stats (strike rate)
- Quick buttons: "Not Out", "Bowled", "Caught", "LBW", "Run Out"

#### 4. **Bowling Entry**
- Table with bowler rows
- Columns: Bowler Name, Overs, Runs, Wickets, Maidens, Economy
- Overs format (e.g., 4.2 for 4 overs 2 balls)
- Auto-calculate economy rate

#### 5. **Real-time Validations**
- Total wickets cannot exceed 10
- Total runs must match batting entries
- Wickets must match bowling entries
- Overs must be ≤ 20 (T20 format)

#### 6. **Save & Publish**
- Draft mode (save without publishing)
- Publish to make visible to end users
- Revision history
- Undo/Redo functionality

### Implementation Code

```tsx
// src/app/wpl-admin-2026/scorecard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ScorecardAdminPage() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [activeTab, setActiveTab] = useState('matchInfo');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await api.get('/matches', { league: 'wpl' });
      setMatches(res.data);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  const handleSelectMatch = async (match) => {
    setSelectedMatch(match);
    setLoading(true);
    try {
      // Try to fetch existing scorecard
      const res = await api.get(`/scorecards/match/${match.id}`);
      setScorecard(res.data[0] || initializeScorecard(match));
    } catch (err) {
      // No scorecard exists yet
      setScorecard(initializeScorecard(match));
    }
    setLoading(false);
  };

  const initializeScorecard = (match) => {
    return {
      matchId: match.id,
      matchInfo: {
        team1: match.team1,
        team2: match.team2,
        venue: match.venue,
        date: match.date,
        time: match.time,
        toss: { winner: '', decision: '' }
      },
      innings: [
        {
          inningsNumber: 1,
          battingTeamId: match.team1.id,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
        },
        {
          inningsNumber: 2,
          battingTeamId: match.team2.id,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
        }
      ]
    };
  };

  const handleSaveScorecard = async () => {
    try {
      if (scorecard.id) {
        await api.put(`/scorecards/${scorecard.id}`, scorecard);
      } else {
        await api.post('/scorecards', scorecard);
      }
      alert('Scorecard saved successfully!');
    } catch (err) {
      console.error('Error saving scorecard:', err);
      alert('Error saving scorecard');
    }
  };

  const handleUpdateBatting = (inningsIndex, playerIndex, updates) => {
    const newScorecard = { ...scorecard };
    newScorecard.innings[inningsIndex].batting[playerIndex] = {
      ...newScorecard.innings[inningsIndex].batting[playerIndex],
      ...updates,
      strikeRate: (updates.runs / updates.balls * 100).toFixed(2)
    };
    setScorecard(newScorecard);
  };

  const handleUpdateBowling = (inningsIndex, bowlerIndex, updates) => {
    const newScorecard = { ...scorecard };
    const overs = updates.overs + (updates.balls || 0) / 6;
    newScorecard.innings[inningsIndex].bowling[bowlerIndex] = {
      ...newScorecard.innings[inningsIndex].bowling[bowlerIndex],
      ...updates,
      economyRate: (updates.runs / overs).toFixed(2)
    };
    setScorecard(newScorecard);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">WPL Scorecard Admin</h1>

      {/* Match Selection */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Select Match</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => handleSelectMatch(match)}
              className={`p-4 rounded ${
                selectedMatch?.id === match.id
                  ? 'bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="font-bold">{match.team1.name} vs {match.team2.name}</div>
              <div className="text-sm text-gray-400">{match.date} - {match.venue}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scorecard Editor */}
      {scorecard && (
        <div>
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-700">
            {['matchInfo', 'innings1', 'innings2', 'result'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'matchInfo' && 'Match Info'}
                {tab === 'innings1' && 'Innings 1'}
                {tab === 'innings2' && 'Innings 2'}
                {tab === 'result' && 'Result'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'matchInfo' && (
            <div className="bg-gray-800 p-6 rounded">
              <h3 className="text-xl mb-4">Match Information</h3>
              {/* Match info fields */}
              <input
                type="text"
                placeholder="Toss Winner"
                value={scorecard.matchInfo.toss?.winner || ''}
                className="bg-gray-700 p-2 rounded w-full mb-2 text-white"
              />
              <input
                type="text"
                placeholder="Toss Decision"
                value={scorecard.matchInfo.toss?.decision || ''}
                className="bg-gray-700 p-2 rounded w-full mb-2 text-white"
              />
            </div>
          )}

          {/* Innings Tabs */}
          {['innings1', 'innings2'].includes(activeTab) && (
            <div className="space-y-8">
              {/* Batting Section */}
              <div className="bg-gray-800 p-6 rounded">
                <h3 className="text-xl mb-4">Batting</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-2">Player</th>
                      <th className="text-center p-2">Runs</th>
                      <th className="text-center p-2">Balls</th>
                      <th className="text-center p-2">4s</th>
                      <th className="text-center p-2">6s</th>
                      <th className="text-center p-2">SR</th>
                      <th className="text-center p-2">Dismissal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Batting rows */}
                  </tbody>
                </table>
              </div>

              {/* Bowling Section */}
              <div className="bg-gray-800 p-6 rounded">
                <h3 className="text-xl mb-4">Bowling</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-2">Bowler</th>
                      <th className="text-center p-2">Overs</th>
                      <th className="text-center p-2">Runs</th>
                      <th className="text-center p-2">Wkts</th>
                      <th className="text-center p-2">Economy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Bowling rows */}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSaveScorecard}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold"
            >
              Save Scorecard
            </button>
            <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold">
              Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Public Scorecard Page

### Location
`src/app/wpl/scorecard/:matchId/page.tsx`

### Features

#### 1. **Match Summary Card**
- Team logos/badges
- Final score with wickets
- Result status
- Man of the Match

#### 2. **Batting Scorecard**
- Scrollable table with all batting stats
- Dismissal type clearly shown
- Strike rate color-coded (green: >130, yellow: 100-130, red: <100)
- Highlights top scorer

#### 3. **Bowling Figures**
- All bowlers listed with economy rate
- Wickets taken shown prominently
- Economy rate color-coded

#### 4. **Additional Stats**
- Powerplay runs and wickets
- Death overs performance
- Boundaries distribution
- Extras breakdown

#### 5. **Match Details**
- Toss information
- Weather
- Umpires (if available)
- Venue

### Implementation Code

```tsx
// src/app/wpl/scorecard/[matchId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ScorecardPage({ params }) {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScorecard();
  }, []);

  const fetchScorecard = async () => {
    try {
      const res = await api.get(`/scorecards/match/${params.matchId}`);
      setScorecard(res.data[0]);
    } catch (err) {
      console.error('Error fetching scorecard:', err);
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  if (!scorecard) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Scorecard not found</div>;

  const getStrikeRateColor = (sr) => {
    if (sr >= 130) return 'text-green-400';
    if (sr >= 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {scorecard.matchInfo.team1.name} vs {scorecard.matchInfo.team2.name}
        </h1>
        <p className="text-gray-400">{scorecard.matchInfo.venue} • {scorecard.matchInfo.date}</p>
      </div>

      {/* Result Summary */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{scorecard.matchInfo.team1.name}</h2>
            <p className="text-5xl font-bold text-blue-200">
              {scorecard.innings[0].totalRuns}/{scorecard.innings[0].totalWickets}
            </p>
            <p className="text-gray-300">({scorecard.innings[0].totalOvers} overs)</p>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{scorecard.matchInfo.team2.name}</h2>
            <p className="text-5xl font-bold text-purple-200">
              {scorecard.innings[1].totalRuns}/{scorecard.innings[1].totalWickets}
            </p>
            <p className="text-gray-300">({scorecard.innings[1].totalOvers} overs)</p>
          </div>
        </div>
        {scorecard.result && (
          <div className="text-center mt-6 pt-6 border-t border-gray-600">
            <p className="text-xl text-green-300 font-bold">{scorecard.result.winner} won by {scorecard.result.margin}</p>
          </div>
        )}
      </div>

      {/* Batting Scorecards */}
      {scorecard.innings.map((inning, idx) => (
        <div key={idx} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {inning.battingTeamId === scorecard.matchInfo.team1.id
              ? scorecard.matchInfo.team1.name
              : scorecard.matchInfo.team2.name}{' '}
            Batting
          </h2>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-3">Batter</th>
                  <th className="text-center p-3">Runs</th>
                  <th className="text-center p-3">Balls</th>
                  <th className="text-center p-3">4s</th>
                  <th className="text-center p-3">6s</th>
                  <th className="text-center p-3">SR</th>
                  <th className="text-left p-3">Dismissal</th>
                </tr>
              </thead>
              <tbody>
                {inning.batting.map((batter, bIdx) => (
                  <tr key={bIdx} className="border-t border-gray-600 hover:bg-gray-700">
                    <td className="p-3 font-semibold">{batter.name}</td>
                    <td className="text-center p-3 font-bold">{batter.runs}</td>
                    <td className="text-center p-3">{batter.balls}</td>
                    <td className="text-center p-3">{batter.fours}</td>
                    <td className="text-center p-3 text-yellow-400">
                      {batter.sixes > 0 ? batter.sixes : '-'}
                    </td>
                    <td className={`text-center p-3 font-semibold ${getStrikeRateColor(batter.strikeRate)}`}>
                      {batter.strikeRate}
                    </td>
                    <td className="p-3 text-gray-300 text-sm">
                      {batter.dismissal?.type === 'not-out' ? 'not out' : batter.dismissal?.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="bg-gray-750 p-4 border-t border-gray-600 flex justify-between text-sm">
              <div>
                <span className="text-gray-400">Extras: </span>
                <span className="font-semibold">
                  W-{inning.extras.wides} NB-{inning.extras.noBalls}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">Total: {inning.totalRuns}/{inning.totalWickets}</p>
              </div>
            </div>
          </div>

          {/* Bowling */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-3">
              {inning.battingTeamId === scorecard.matchInfo.team1.id
                ? scorecard.matchInfo.team2.name
                : scorecard.matchInfo.team1.name}{' '}
              Bowling
            </h3>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm md:text-base">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-3">Bowler</th>
                    <th className="text-center p-3">Overs</th>
                    <th className="text-center p-3">Runs</th>
                    <th className="text-center p-3">Wkts</th>
                    <th className="text-center p-3">Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {inning.bowling.map((bowler, bIdx) => (
                    <tr key={bIdx} className="border-t border-gray-600 hover:bg-gray-700">
                      <td className="p-3 font-semibold">{bowler.name}</td>
                      <td className="text-center p-3">{bowler.overs}.{bowler.balls}</td>
                      <td className="text-center p-3">{bowler.runs}</td>
                      <td className="text-center p-3 font-bold text-green-400">{bowler.wickets}</td>
                      <td className="text-center p-3">{bowler.economyRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Match Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-800 p-6 rounded">
          <h3 className="text-lg font-bold mb-4">Match Details</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Toss:</span>
              <span className="ml-2 font-semibold">
                {scorecard.matchInfo.toss?.winner} won, chose to {scorecard.matchInfo.toss?.decision}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Venue:</span>
              <span className="ml-2 font-semibold">{scorecard.matchInfo.venue}</span>
            </div>
            <div>
              <span className="text-gray-400">Date:</span>
              <span className="ml-2 font-semibold">{scorecard.matchInfo.date}</span>
            </div>
          </div>
        </div>

        {scorecard.result?.manOfTheMatch && (
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 p-6 rounded">
            <h3 className="text-lg font-bold mb-4">Man of the Match</h3>
            <p className="text-2xl font-bold text-yellow-300">{scorecard.result.manOfTheMatch}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Maintenance & Updates

### Regular Maintenance Tasks

#### 1. **During Match (Live Updates)**
- Update batting stats after each completed over
- Add wickets immediately
- Update bowling figures in real-time
- Push notifications for key events (wickets, milestones)

#### 2. **Post-Match**
- Complete and verify all statistics
- Add man of the match info
- Publish scorecard publicly
- Archive for historical records

#### 3. **Data Validation**
- Weekly audits of scorecards
- Check for data consistency
- Verify calculations (strike rates, economies)
- Backup scorecard data

### Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Strike rate incorrect | Calculation error | Verify runs and balls entered |
| Economy rate wrong | Overs calculation | Check overs format (4.2 = 4 overs 2 balls) |
| Total runs mismatch | Batting entries don't add up | Audit each player's score |
| Wickets > 10 | Data entry error | Remove phantom wickets |
| Missing scorecard | Not created for match | Admin must create and publish |

### Performance Optimization

```javascript
// Cache scorecards for faster retrieval
const SCORECARD_CACHE_TTL = 3600; // 1 hour

// Index scorecards by match ID and date for quick search
const indexScorecard = (scorecard) => {
  return {
    scorecard_match_${matchId}: scorecard,
    scorecard_date_${date}: scorecard,
    scorecard_league_${league}: scorecard
  };
};

// Batch scorecard operations
const batchUpdateBatting = async (scorecardId, bettingData) => {
  // Update multiple batting entries in single operation
};
```

---

## Best Practices

### 1. **Data Entry**
- ✅ Enter stats immediately after play
- ✅ Double-check player names before saving
- ✅ Use consistent dismissal terminology
- ✅ Record extras correctly (wides, no-balls)

### 2. **Accuracy**
- ✅ Verify totals match the combined batting scores
- ✅ Ensure wickets total to actual dismissals
- ✅ Cross-check with broadcast scorer
- ✅ Round strike rates and economies to 2 decimals

### 3. **User Experience**
- ✅ Display scorecards in readable format
- ✅ Show key statistics prominently (total runs, wickets, SR)
- ✅ Color-code important metrics
- ✅ Provide both mobile and desktop views

### 4. **Security**
- ✅ Only admins can edit scorecards
- ✅ Publish scorecards separately from draft
- ✅ Maintain audit trail of changes
- ✅ Validate all input data

### 5. **Performance**
- ✅ Cache frequently accessed scorecards
- ✅ Lazy load scorecard tables for matches
- ✅ Optimize images (team logos, player photos)
- ✅ Use pagination for long tables

---

## API Implementation Reference

### Scorecard API Handler

Location: `functions/api/scorecards.js`

```javascript
export async function onRequestPost(context) {
  // Create new scorecard
  const { request, env } = context;
  const data = await request.json();
  
  const scorecardId = generateId();
  const scorecard = {
    id: scorecardId,
    ...data,
    createdAt: new Date().toISOString(),
    draft: true
  };
  
  await env.IPL_CACHE.put(
    `scorecard_${scorecardId}`,
    JSON.stringify(scorecard)
  );
  
  return new Response(JSON.stringify(scorecard), { status: 201 });
}

export async function onRequestPut(context) {
  // Update existing scorecard
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const scorecardId = searchParams.get('id');
  
  const data = await request.json();
  const scorecard = {
    ...JSON.parse(await env.IPL_CACHE.get(`scorecard_${scorecardId}`)),
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  await env.IPL_CACHE.put(
    `scorecard_${scorecardId}`,
    JSON.stringify(scorecard)
  );
  
  return new Response(JSON.stringify(scorecard), { status: 200 });
}

export async function onRequestGet(context) {
  // Get scorecard or match scorecards
  const { env } = context;
  const { searchParams } = new URL(context.request.url);
  const scorecardId = searchParams.get('id');
  const matchId = searchParams.get('matchId');
  
  if (scorecardId) {
    const scorecard = JSON.parse(
      await env.IPL_CACHE.get(`scorecard_${scorecardId}`)
    );
    return new Response(JSON.stringify(scorecard), { status: 200 });
  }
  
  if (matchId) {
    // Get all scorecards for a match (usually 2 innings)
    const list = await env.IPL_CACHE.list({ prefix: `scorecard_` });
    const scorecards = [];
    
    for (const item of list.keys) {
      const scorecard = JSON.parse(await env.IPL_CACHE.get(item.name));
      if (scorecard.matchId === matchId) {
        scorecards.push(scorecard);
      }
    }
    
    return new Response(JSON.stringify(scorecards), { status: 200 });
  }
}
```

---

## Example Workflow: Creating a Scorecard

### Step 1: Admin Creates Scorecard
```
Admin visits /wpl-admin-2026/scorecard
Selects match: "MI-W vs Gujarat Giants - Jan 10, 10:30 AM"
System creates empty scorecard
```

### Step 2: Enter Match Info
```
Toss: Gujarat Giants won, chose to bowl
Venue: DY Patil Stadium, Mumbai
Weather: Partly Cloudy
```

### Step 3: Enter MI-W Batting (Innings 1)
```
Smriti Mandhana: 45 runs, 28 balls, 6 fours, 1 six - NOT OUT (SR: 160.7)
Sophie Devine: 38 runs, 22 balls, 4 fours, 2 sixes - BOWLED by Deepti Sharma (SR: 172.7)
...
Total: 154/6 in 20 overs
```

### Step 4: Enter Gujarat Bowling
```
Deepti Sharma: 4 overs, 28 runs, 1 wicket (economy: 7.0)
...
```

### Step 5: Save and Publish
```
Admin clicks "Save Scorecard" → Stored in draft
Admin clicks "Publish" → Visible at /wpl/scorecard/[matchId]
End users can now view the complete scorecard
```

---

## Conclusion

The WPL scorecard system provides a robust framework for capturing, storing, and displaying cricket match statistics. By following this guide, admins can efficiently manage scorecards while ensuring end users have access to accurate, well-formatted match data. Continuous maintenance and adherence to best practices will keep the system performant and reliable.
