'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  Trophy, 
  MapPin, 
  Search, 
  Edit3, 
  ExternalLink, 
  Crown, 
  Sparkles,
  Building2,
  SlidersHorizontal,
  X,
  Check
} from "lucide-react";

export interface WPLTeamData {
  id: string;
  name: string;
  shortName: string;
  city: string;
  captain: string;
  coach: string;
  homeGround: string;
  colors: {
    primary: string;
    secondary: string;
  };
  trophies: number[];
  runnerUp: number[];
  description: string;
  owner: string;
}

const INITIAL_WPL_TEAMS: WPLTeamData[] = [
  {
    id: "mi-w",
    name: "Mumbai Indians (WPL)",
    shortName: "MI-W",
    city: "Mumbai, Maharashtra",
    captain: "Harmanpreet Kaur",
    coach: "Lisa Keightley",
    homeGround: "Wankhede Stadium / Brabourne Stadium, Mumbai",
    colors: { primary: "#004BA0", secondary: "#FFD700" },
    trophies: [2023, 2025],
    runnerUp: [],
    description: "Inaugural champion and powerhouse franchise of WPL, celebrated for clutch knockout displays under Harmanpreet Kaur.",
    owner: "Indiawin Sports (Reliance Group)",
  },
  {
    id: "rcb-w",
    name: "Royal Challengers Bengaluru (WPL)",
    shortName: "RCB-W",
    city: "Bengaluru, Karnataka",
    captain: "Smriti Mandhana",
    coach: "Malolan Rangarajan",
    homeGround: "M. Chinnaswamy Stadium, Bengaluru",
    colors: { primary: "#C8102E", secondary: "#FFD700" },
    trophies: [2024, 2026],
    runnerUp: [],
    description: "Defending 2-time champions boasting world-class power hitting, unmatched fan support, and record-breaking tournament run chases.",
    owner: "Royal Challengers Sports Pvt Ltd",
  },
  {
    id: "dc-w",
    name: "Delhi Capitals (WPL)",
    shortName: "DC-W",
    city: "New Delhi, Delhi",
    captain: "Jemimah Rodrigues",
    coach: "Jonathan Batty",
    homeGround: "Arun Jaitley Stadium, New Delhi",
    colors: { primary: "#004BA0", secondary: "#DC2626" },
    trophies: [],
    runnerUp: [2023, 2024, 2025, 2026],
    description: "The most consistent top-of-table league finishers, reaching four consecutive WPL finals with an aggressive top-order core.",
    owner: "JSW GMR Cricket",
  },
  {
    id: "gg",
    name: "Gujarat Giants (WPL)",
    shortName: "GG",
    city: "Ahmedabad, Gujarat",
    captain: "Ashleigh Gardner",
    coach: "Michael Klinger",
    homeGround: "Narendra Modi Stadium, Ahmedabad",
    colors: { primary: "#F97316", secondary: "#FFD700" },
    trophies: [],
    runnerUp: [],
    description: "Representing Gujarat with warrior tenacity, boasting dynamic international all-round depth and emerging young Indian pace.",
    owner: "Adani Sportsline",
  },
  {
    id: "upw",
    name: "UP Warriorz (WPL)",
    shortName: "UPW",
    city: "Lucknow, Uttar Pradesh",
    captain: "Alyssa Healy",
    coach: "Abhishek Nayar",
    homeGround: "BRSABV Ekana Cricket Stadium, Lucknow",
    colors: { primary: "#7C3AED", secondary: "#F59E0B" },
    trophies: [],
    runnerUp: [],
    description: "Fearless Uttar Pradesh squad equipped with master spin variations, explosive wicketkeeping, and clutch tactical finishing.",
    owner: "Capri Global",
  },
];

export default function WPLTeamsOpsPage() {
  const [teams, setTeams] = useState<WPLTeamData[]>(INITIAL_WPL_TEAMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<WPLTeamData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<WPLTeamData | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.captain.toLowerCase().includes(q) ||
        t.coach.toLowerCase().includes(q)
    );
  }, [teams, searchQuery]);

  const totalTrophies = useMemo(() => {
    return teams.reduce((acc, t) => acc + t.trophies.length, 0);
  }, [teams]);

  const handleEditClick = (team: WPLTeamData) => {
    setEditForm({ ...team });
    setIsEditing(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setTeams((prev) =>
      prev.map((t) => (t.id === editForm.id ? editForm : t))
    );

    if (selectedTeam?.id === editForm.id) {
      setSelectedTeam(editForm);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#131722] to-pink-950/40 border border-purple-500/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              {"Women's Premier League Ops"}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Franchise Management
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                {teams.length} Teams
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Configure official WPL team credentials, home grounds, coaching staff, colors, and squad rosters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ops/wpl/players"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-sm font-semibold transition-all shadow-lg shadow-purple-900/20"
            >
              <Users className="w-4 h-4 text-pink-300" />
              Manage Squads
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{teams.length}</div>
            <div className="text-xs text-slate-400 font-medium">Active Franchises</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{totalTrophies}</div>
            <div className="text-xs text-slate-400 font-medium">Titles Awarded</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{teams.length}</div>
            <div className="text-xs text-slate-400 font-medium">Designated Captains</div>
          </div>
        </div>

        <div className="rounded-xl bg-[#121620] border border-white/5 p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{teams.length}</div>
            <div className="text-xs text-slate-400 font-medium">Home Venues</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111620] border border-white/10 rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, shortcode, city, captain, coach..."
            className="w-full bg-[#0B0E14] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 px-2">
          <span>Showing <strong className="text-white">{filteredTeams.length}</strong> of {teams.length} teams</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="group rounded-2xl bg-[#121722] border border-white/10 hover:border-purple-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-purple-900/10"
          >
            <div 
              className="p-5 border-b border-white/5 relative"
              style={{
                background: `linear-gradient(135deg, ${team.colors.primary}25 0%, transparent 80%)`
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-md border border-white/20"
                    style={{
                      backgroundColor: team.colors.primary,
                      color: team.colors.secondary === "#FFD700" ? "#FFD700" : "#FFFFFF"
                    }}
                  >
                    {team.shortName}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {team.city}
                    </div>
                  </div>
                </div>

                {team.trophies.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    {team.trophies.length}x
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 space-y-3.5 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-[#0E121A] p-2.5 border border-white/5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> Captain
                  </div>
                  <div className="font-bold text-white text-xs truncate">{team.captain}</div>
                </div>

                <div className="rounded-xl bg-[#0E121A] p-2.5 border border-white/5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-purple-400" /> Head Coach
                  </div>
                  <div className="font-bold text-white text-xs truncate">{team.coach}</div>
                </div>
              </div>

              <div className="rounded-xl bg-[#0E121A] p-2.5 border border-white/5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                  Home Venue
                </div>
                <div className="font-medium text-slate-200 text-xs truncate">{team.homeGround}</div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Franchise Palette:</span>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: team.colors.primary }}
                    title={`Primary: ${team.colors.primary}`}
                  />
                  <div 
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: team.colors.secondary }}
                    title={`Secondary: ${team.colors.secondary}`}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#0D1017] flex items-center justify-between gap-2">
              <button
                onClick={() => handleEditClick(team)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                Configure
              </button>

              <Link
                href={`/ops/wpl/players?team=${team.shortName.toLowerCase()}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
              >
                Squad
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {isEditing && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#121622] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#151B28]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  Edit {editForm.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update leadership and venue records</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Franchise Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Short Code</label>
                  <input
                    type="text"
                    value={editForm.shortName}
                    onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Captain</label>
                  <input
                    type="text"
                    value={editForm.captain}
                    onChange={(e) => setEditForm({ ...editForm, captain: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Head Coach</label>
                  <input
                    type="text"
                    value={editForm.coach}
                    onChange={(e) => setEditForm({ ...editForm, coach: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Home Stadium</label>
                <input
                  type="text"
                  value={editForm.homeGround}
                  onChange={(e) => setEditForm({ ...editForm, homeGround: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.colors.primary}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          colors: { ...editForm.colors, primary: e.target.value }
                        })
                      }
                      className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.colors.primary}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          colors: { ...editForm.colors, primary: e.target.value }
                        })
                      }
                      className="flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Secondary Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.colors.secondary}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          colors: { ...editForm.colors, secondary: e.target.value }
                        })
                      }
                      className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.colors.secondary}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          colors: { ...editForm.colors, secondary: e.target.value }
                        })
                      }
                      className="flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
