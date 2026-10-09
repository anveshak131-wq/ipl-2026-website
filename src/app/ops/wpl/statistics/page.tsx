'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Flame, 
  Target, 
  Award, 
  Zap, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronRight,
  Shield,
  Sparkles,
  Crown
} from "lucide-react";

interface BattingRecord {
  player: string;
  team: string;
  runs: number;
  innings: number;
  avg: number;
  sr: number;
  highScore: string;
  fifties: number;
  hundreds: number;
  sixes: number;
  fours: number;
}

interface BowlingRecord {
  player: string;
  team: string;
  wickets: number;
  overs: number;
  best: string;
  avg: number;
  econ: number;
  fourWickets: number;
  fiveWickets: number;
}

interface CapHistory {
  season: string;
  orangeCap: { player: string; team: string; stat: string };
  purpleCap: { player: string; team: string; stat: string };
  champion: string;
  runnerUp: string;
}

const BATTING_LEADERS: BattingRecord[] = [
  { player: "Nat Sciver-Brunt", team: "MI-W", runs: 1348, innings: 37, avg: 49.92, sr: 147.2, highScore: "100*", fifties: 12, hundreds: 1, sixes: 34, fours: 172 },
  { player: "Smriti Mandhana", team: "RCB-W", runs: 1215, innings: 35, avg: 41.89, sr: 146.5, highScore: "96", fifties: 10, hundreds: 0, sixes: 39, fours: 168 },
  { player: "Harmanpreet Kaur", team: "MI-W", runs: 1140, innings: 34, avg: 47.50, sr: 143.8, highScore: "82*", fifties: 9, hundreds: 0, sixes: 32, fours: 141 },
  { player: "Meg Lanning", team: "DC-W", runs: 980, innings: 28, avg: 42.60, sr: 136.4, highScore: "72", fifties: 8, hundreds: 0, sixes: 19, fours: 136 },
  { player: "Ellyse Perry", team: "RCB-W", runs: 895, innings: 25, avg: 59.66, sr: 134.1, highScore: "66", fifties: 7, hundreds: 0, sixes: 22, fours: 108 },
  { player: "Shafali Verma", team: "DC-W", runs: 890, innings: 36, avg: 27.81, sr: 156.4, highScore: "84", fifties: 6, hundreds: 0, sixes: 53, fours: 112 },
  { player: "Laura Wolvaardt", team: "DC-W", runs: 785, innings: 22, avg: 43.61, sr: 133.5, highScore: "77", fifties: 6, hundreds: 0, sixes: 15, fours: 98 },
  { player: "Sophie Devine", team: "GG", runs: 760, innings: 26, avg: 31.66, sr: 161.2, highScore: "99", fifties: 5, hundreds: 0, sixes: 44, fours: 87 },
  { player: "Grace Harris", team: "UPW", runs: 710, innings: 27, avg: 37.36, sr: 159.8, highScore: "85", fifties: 5, hundreds: 0, sixes: 36, fours: 79 },
  { player: "Richa Ghosh", team: "RCB-W", runs: 680, innings: 31, avg: 29.56, sr: 151.7, highScore: "90", fifties: 3, hundreds: 0, sixes: 38, fours: 69 },
];

const BOWLING_LEADERS: BowlingRecord[] = [
  { player: "Amelia Kerr", team: "MI-W", wickets: 54, overs: 134.2, best: "3/24", avg: 17.80, econ: 7.15, fourWickets: 0, fiveWickets: 0 },
  { player: "Sophie Devine", team: "GG", wickets: 42, overs: 118.0, best: "4/37", avg: 21.14, econ: 7.52, fourWickets: 2, fiveWickets: 0 },
  { player: "Hayley Matthews", team: "MI-W", wickets: 41, overs: 116.4, best: "3/10", avg: 20.30, econ: 7.14, fourWickets: 1, fiveWickets: 0 },
  { player: "Sophie Ecclestone", team: "UPW", wickets: 39, overs: 122.0, best: "4/13", avg: 21.84, econ: 6.98, fourWickets: 1, fiveWickets: 0 },
  { player: "Shreyanka Patil", team: "RCB-W", wickets: 38, overs: 98.2, best: "5/23", avg: 19.60, econ: 7.58, fourWickets: 2, fiveWickets: 1 },
  { player: "Nadine de Klerk", team: "RCB-W", wickets: 33, overs: 81.3, best: "4/22", avg: 18.20, econ: 7.38, fourWickets: 2, fiveWickets: 0 },
  { player: "Marizanne Kapp", team: "DC-W", wickets: 32, overs: 112.0, best: "5/15", avg: 22.40, econ: 6.40, fourWickets: 1, fiveWickets: 1 },
  { player: "Rajeshwari Gayakwad", team: "UPW", wickets: 31, overs: 96.0, best: "3/16", avg: 24.10, econ: 7.78, fourWickets: 0, fiveWickets: 0 },
  { player: "Ellyse Perry", team: "RCB-W", wickets: 28, overs: 74.0, best: "6/15", avg: 18.90, econ: 7.16, fourWickets: 0, fiveWickets: 1 },
  { player: "Lauren Bell", team: "RCB-W", wickets: 27, overs: 70.0, best: "3/26", avg: 15.80, econ: 6.09, fourWickets: 0, fiveWickets: 0 },
];

const CAP_HISTORY: CapHistory[] = [
  {
    season: "2026",
    orangeCap: { player: "Smriti Mandhana", team: "RCB-W", stat: "377 runs (SR 153.25)" },
    purpleCap: { player: "Sophie Devine", team: "GG", stat: "17 wickets (Econ 8.28)" },
    champion: "Royal Challengers Bengaluru (2nd Title)",
    runnerUp: "Delhi Capitals",
  },
  {
    season: "2025",
    orangeCap: { player: "Nat Sciver-Brunt", team: "MI-W", stat: "523 runs (SR 151.4)" },
    purpleCap: { player: "Amelia Kerr", team: "MI-W", stat: "18 wickets (Econ 7.2)" },
    champion: "Mumbai Indians (2nd Title)",
    runnerUp: "Delhi Capitals",
  },
  {
    season: "2024",
    orangeCap: { player: "Ellyse Perry", team: "RCB-W", stat: "347 runs (SR 125.7)" },
    purpleCap: { player: "Shreyanka Patil", team: "RCB-W", stat: "13 wickets (Econ 7.3)" },
    champion: "Royal Challengers Bengaluru (1st Title)",
    runnerUp: "Delhi Capitals",
  },
  {
    season: "2023",
    orangeCap: { player: "Meg Lanning", team: "DC-W", stat: "345 runs (SR 139.1)" },
    purpleCap: { player: "Hayley Matthews", team: "MI-W", stat: "16 wickets (Econ 6.8)" },
    champion: "Mumbai Indians (1st Title)",
    runnerUp: "Delhi Capitals",
  },
];

const TEAM_HIGHS = [
  { rank: 1, score: "225/5", team: "UP Warriorz", opponent: "vs RCB-W", venue: "DY Patil Stadium", season: "2025" },
  { rank: 2, score: "223/2", team: "Delhi Capitals", opponent: "vs RCB-W", venue: "Brabourne Stadium", season: "2023" },
  { rank: 3, score: "209/4", team: "Gujarat Giants", opponent: "vs DC-W", venue: "DY Patil Stadium", season: "2026" },
  { rank: 4, score: "207/5", team: "Mumbai Indians", opponent: "vs GG", venue: "DY Patil Stadium", season: "2023" },
  { rank: 5, score: "204/4", team: "Royal Challengers", opponent: "vs DC-W", venue: "Vadodara Stadium (Final)", season: "2026" },
];

export default function WPLStatisticsOpsPage() {
  const [activeTab, setActiveTab] = useState<"batting" | "bowling" | "caps" | "team_records">("batting");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");

  const filteredBatting = useMemo(() => {
    return BATTING_LEADERS.filter((b) => {
      const matchTeam = teamFilter === "ALL" || b.team === teamFilter;
      const matchSearch = !search || b.player.toLowerCase().includes(search.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [search, teamFilter]);

  const filteredBowling = useMemo(() => {
    return BOWLING_LEADERS.filter((b) => {
      const matchTeam = teamFilter === "ALL" || b.team === teamFilter;
      const matchSearch = !search || b.player.toLowerCase().includes(search.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [search, teamFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#131722] to-pink-950/40 border border-purple-500/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Tournament Analytics & Records Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              WPL Statistics & Record Book
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                2023–2026 All-Time
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect verified statistical milestones, cap leaderboards, historic totals, and player records across all four WPL editions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/ops/wpl/teams"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all"
            >
              <Shield className="w-4 h-4 text-pink-300" />
              View Franchises
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Record Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">All-Time Runs</div>
            <div className="text-base font-black text-white mt-0.5">1,348 runs</div>
            <div className="text-[11px] text-amber-300 font-medium truncate">Nat Sciver-Brunt (MI)</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">All-Time Wickets</div>
            <div className="text-base font-black text-white mt-0.5">54 wickets</div>
            <div className="text-[11px] text-purple-300 font-medium truncate">Amelia Kerr (MI)</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Best Bowling</div>
            <div className="text-base font-black text-white mt-0.5">6 / 15</div>
            <div className="text-[11px] text-pink-300 font-medium truncate">Ellyse Perry (RCB)</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Highest Total</div>
            <div className="text-base font-black text-white mt-0.5">225 / 5</div>
            <div className="text-[11px] text-emerald-300 font-medium truncate">UPW vs RCB (2025)</div>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("batting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "batting"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Award className="w-4 h-4" /> Batting Leaderboard
        </button>

        <button
          onClick={() => setActiveTab("bowling")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "bowling"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Target className="w-4 h-4" /> Bowling Leaderboard
        </button>

        <button
          onClick={() => setActiveTab("caps")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "caps"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Trophy className="w-4 h-4" /> Orange & Purple Cap Roll of Honor
        </button>

        <button
          onClick={() => setActiveTab("team_records")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "team_records"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Shield className="w-4 h-4" /> Historic Team Totals
        </button>
      </div>

      {/* Search and Filter Row (for Batting & Bowling) */}
      {(activeTab === "batting" || activeTab === "bowling") && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111620] border border-white/10 rounded-xl p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player name..."
              className="w-full bg-[#0B0E14] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Franchises</option>
              <option value="MI-W">Mumbai Indians (MI-W)</option>
              <option value="RCB-W">Royal Challengers (RCB-W)</option>
              <option value="DC-W">Delhi Capitals (DC-W)</option>
              <option value="GG">Gujarat Giants (GG)</option>
              <option value="UPW">UP Warriorz (UPW)</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab: BATTING */}
      {activeTab === "batting" && (
        <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151B28]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              All-Time Leading Run Scorers
            </h3>
            <span className="text-xs text-slate-400">Showing {filteredBatting.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1017] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-3.5 pl-4">Rank</th>
                  <th className="p-3.5">Player</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5 text-right font-bold text-slate-200">Runs</th>
                  <th className="p-3.5 text-right">Innings</th>
                  <th className="p-3.5 text-right">Avg</th>
                  <th className="p-3.5 text-right">SR</th>
                  <th className="p-3.5 text-right">High Score</th>
                  <th className="p-3.5 text-right">50s / 100s</th>
                  <th className="p-3.5 text-right pr-4">6s / 4s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredBatting.map((b, idx) => (
                  <tr key={b.player} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      {idx === 0 && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      {b.player}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-purple-300 font-semibold text-[11px] border border-white/10">
                        {b.team}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-400 text-sm">{b.runs}</td>
                    <td className="p-3.5 text-right text-slate-400">{b.innings}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-200">{b.avg}</td>
                    <td className="p-3.5 text-right font-semibold text-purple-300">{b.sr}</td>
                    <td className="p-3.5 text-right font-bold text-white">{b.highScore}</td>
                    <td className="p-3.5 text-right text-slate-300">{b.fifties} / {b.hundreds}</td>
                    <td className="p-3.5 text-right pr-4 text-slate-400">{b.sixes} / {b.fours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: BOWLING */}
      {activeTab === "bowling" && (
        <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151B28]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              All-Time Leading Wicket Takers
            </h3>
            <span className="text-xs text-slate-400">Showing {filteredBowling.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1017] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-3.5 pl-4">Rank</th>
                  <th className="p-3.5">Player</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5 text-right font-bold text-slate-200">Wickets</th>
                  <th className="p-3.5 text-right">Overs</th>
                  <th className="p-3.5 text-right">Best Bowling</th>
                  <th className="p-3.5 text-right">Avg</th>
                  <th className="p-3.5 text-right">Economy</th>
                  <th className="p-3.5 text-right pr-4">4w / 5w</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredBowling.map((bw, idx) => (
                  <tr key={bw.player} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      {idx === 0 && <Crown className="w-3.5 h-3.5 text-purple-400" />}
                      {bw.player}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-pink-300 font-semibold text-[11px] border border-white/10">
                        {bw.team}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-purple-400 text-sm">{bw.wickets}</td>
                    <td className="p-3.5 text-right text-slate-400">{bw.overs}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-300">{bw.best}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-200">{bw.avg}</td>
                    <td className="p-3.5 text-right font-semibold text-cyan-300">{bw.econ}</td>
                    <td className="p-3.5 text-right pr-4 text-slate-400">{bw.fourWickets} / {bw.fiveWickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: CAPS ROLL OF HONOR */}
      {activeTab === "caps" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CAP_HISTORY.map((cap) => (
            <div key={cap.season} className="rounded-2xl bg-[#121722] border border-white/10 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-black text-sm">
                    {cap.season}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Season {cap.season} Honours</h4>
                    <p className="text-[11px] text-slate-400">Champions: <strong className="text-amber-300">{cap.champion}</strong></p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  Finalist: {cap.runnerUp}
                </div>
              </div>

              {/* Orange Cap */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Crown className="w-3.5 h-3.5" /> Orange Cap (Most Runs)
                  </div>
                  <div className="text-sm font-black text-white">{cap.orangeCap.player}</div>
                  <div className="text-xs text-slate-400">{cap.orangeCap.team}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {cap.orangeCap.stat}
                  </div>
                </div>
              </div>

              {/* Purple Cap */}
              <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/20 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5" /> Purple Cap (Most Wickets)
                  </div>
                  <div className="text-sm font-black text-white">{cap.purpleCap.player}</div>
                  <div className="text-xs text-slate-400">{cap.purpleCap.team}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    {cap.purpleCap.stat}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: HISTORIC TEAM TOTALS */}
      {activeTab === "team_records" && (
        <div className="rounded-2xl bg-[#121722] border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151B28]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              Highest Match Innings Totals
            </h3>
            <span className="text-xs text-slate-400">All 200+ Team Scores</span>
          </div>

          <div className="divide-y divide-white/5">
            {TEAM_HIGHS.map((item) => (
              <div key={item.rank} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5">
                  <span className="w-7 h-7 rounded-lg bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center font-bold text-xs">
                    #{item.rank}
                  </span>
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <span className="text-rose-400 text-base">{item.score}</span>
                      <span>—</span>
                      <span>{item.team}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.opponent} • {item.venue}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-xs">
                    WPL {item.season}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
