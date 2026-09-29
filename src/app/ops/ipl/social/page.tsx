'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import { Match, Player, Team } from '@/types';
import { Clipboard, Download, Image as ImageIcon, Save, Share2, Sparkles, Upload } from 'lucide-react';

type TemplateKind = 'result' | 'playing11' | 'milestone' | 'points' | 'upcoming' | 'player';
type ThemeKind = 'stadium' | 'midnight' | 'gold';

interface Draft {
  id: string;
  title: string;
  template: TemplateKind;
  theme: ThemeKind;
  caption: string;
  createdAt: string;
}

const templates: Array<{ id: TemplateKind; label: string; description: string }> = [
  { id: 'result', label: 'Match result', description: 'Final score and player of the match' },
  { id: 'playing11', label: 'Playing XI', description: 'Lineup announcement for match day' },
  { id: 'milestone', label: 'Milestone', description: 'Celebrate a player achievement' },
  { id: 'points', label: 'Points table', description: 'Share the current standings' },
  { id: 'upcoming', label: 'Upcoming match', description: 'Promote the next fixture' },
  { id: 'player', label: 'Player card', description: 'Share a player profile snapshot' },
];

const themes: Array<{ id: ThemeKind; label: string; accent: string; surface: string }> = [
  { id: 'stadium', label: 'Stadium', accent: '#52d6aa', surface: '#102d2a' },
  { id: 'midnight', label: 'Midnight', accent: '#9a8cff', surface: '#171b3c' },
  { id: 'gold', label: 'Champions', accent: '#f2c866', surface: '#302516' },
];

const sampleTeams: Team[] = [
  { id: '1', name: 'Royal Challengers Bengaluru', shortName: 'RCB', colors: { primary: '#d71920', secondary: '#f6c344' } },
  { id: '2', name: 'Mumbai Indians', shortName: 'MI', colors: { primary: '#1d4ed8', secondary: '#58b4ff' } },
];

const samplePlayers: Player[] = [
  { id: 'p1', name: 'Virat Kohli', teamId: '1', league: 'ipl', role: 'Batsman', age: '37', stats: { runs: 82, average: 41.23, strikeRate: 148.76, wickets: 0 } } as Player,
  { id: 'p2', name: 'Jasprit Bumrah', teamId: '2', league: 'ipl', role: 'Bowler', age: '32', stats: { runs: 12, average: 12.0, strikeRate: 100.0, wickets: 4 } } as Player,
];

const sampleMatches: Match[] = [
  { id: 'sample-1', league: 'ipl', date: new Date().toISOString(), time: '19:30', venue: 'M. Chinnaswamy Stadium', team1: sampleTeams[0], team2: sampleTeams[1], status: 'completed', team1Score: '187/5', team2Score: '181/8', result: 'RCB won by 6 runs' } as unknown as Match,
];

const escapeXml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] || char));
const asNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const formatRate = (value: unknown) => asNumber(value).toFixed(2);

function teamName(team: any, fallback: string) { return team?.shortName || team?.name || fallback; }
function matchDate(match: any) { return match?.date ? new Date(match.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '18 APR'; }
function scoreParts(value: unknown) {
  const text = String(value || '187/5');
  const match = text.match(/^(.*?)\s*\((.*?)\)$/);
  return { score: match?.[1]?.trim() || text, detail: match?.[2]?.trim() || '' };
}

function getSvgMarkup(template: TemplateKind, theme: ThemeKind, data: { match: any; player: any; teams: Team[]; players: Player[]; caption: string; league: string }) {
  const selectedTheme = themes.find((item) => item.id === theme) || themes[0];
  const team1 = data.match?.team1 || data.teams[0] || sampleTeams[0];
  const team2 = data.match?.team2 || data.teams[1] || sampleTeams[1];
  const player = data.player || data.players[0] || samplePlayers[0];
  const playerStats: any = player?.stats || {};
  const title = template === 'result' ? 'MATCH RESULT' : template === 'playing11' ? 'PLAYING XI' : template === 'milestone' ? 'MILESTONE' : template === 'points' ? 'POINTS TABLE' : template === 'upcoming' ? 'NEXT MATCH' : 'PLAYER SPOTLIGHT';
  let body = '';
  if (template === 'result') {
    const firstScore = scoreParts(data.match?.team1Score);
    const secondScore = scoreParts(data.match?.team2Score);
    body = `<rect x="80" y="245" width="470" height="205" rx="18" fill="#ffffff" opacity=".06"/><rect x="650" y="245" width="470" height="205" rx="18" fill="#ffffff" opacity=".06"/><text x="112" y="292" class="team">${escapeXml(teamName(team1, 'RCB'))}</text><text x="112" y="374" class="score">${escapeXml(firstScore.score)}</text>${firstScore.detail ? `<text x="112" y="416" class="score-meta">${escapeXml(firstScore.detail)}</text>` : ''}<text x="682" y="292" class="team">${escapeXml(teamName(team2, 'MI'))}</text><text x="682" y="374" class="score">${escapeXml(secondScore.score)}</text>${secondScore.detail ? `<text x="682" y="416" class="score-meta">${escapeXml(secondScore.detail)}</text>` : ''}<text x="80" y="505" class="winner">${escapeXml(data.match?.result || 'RCB won by 6 runs')}</text>`;
  }
  if (template === 'upcoming') body = `<text x="80" y="305" class="team">${escapeXml(teamName(team1, 'RCB'))}</text><text x="535" y="305" class="team">${escapeXml(teamName(team2, 'MI'))}</text><text x="80" y="380" class="big">${escapeXml(matchDate(data.match))}</text><text x="535" y="380" class="big">${escapeXml(data.match?.time || '19:30')}</text><text x="80" y="445" class="winner">${escapeXml(data.match?.venue || 'M. Chinnaswamy Stadium')}</text>`;
  if (template === 'milestone') body = `<text x="80" y="310" class="big">${escapeXml(player?.name || 'Virat Kohli')}</text><text x="80" y="390" class="score">${asNumber(playerStats.runs) || 1000}</text><text x="80" y="445" class="winner">RUNS THIS SEASON</text>`;
  if (template === 'player') body = `<text x="80" y="300" class="big">${escapeXml(player?.name || 'Virat Kohli')}</text><text x="80" y="375" class="winner">${escapeXml(player?.role || 'Batter')}</text><text x="80" y="450" class="team">AVG ${formatRate(playerStats.average || 41.23)}   SR ${formatRate(playerStats.strikeRate || 148.76)}</text>`;
  if (template === 'playing11') body = `<text x="80" y="300" class="big">${escapeXml(teamName(team1, 'RCB'))}</text><text x="80" y="380" class="team">1  ${escapeXml(data.players[0]?.name || 'Virat Kohli')}</text><text x="80" y="430" class="team">2  ${escapeXml(data.players[1]?.name || 'Rajat Patidar')}</text><text x="80" y="480" class="team">3  ${escapeXml(data.players[2]?.name || 'Faf du Plessis')}</text>`;
  if (template === 'points') body = `<text x="80" y="300" class="team">1  RCB                         12 PTS</text><text x="80" y="360" class="team">2  MI                          10 PTS</text><text x="80" y="420" class="team">3  CSK                          8 PTS</text><text x="80" y="480" class="team">4  KKR                          8 PTS</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#07151f"/><stop offset=".52" stop-color="${selectedTheme.surface}"/><stop offset="1" stop-color="#050b12"/></linearGradient><linearGradient id="light" x1="0" x2="1"><stop stop-color="${selectedTheme.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${selectedTheme.accent}" stop-opacity=".26"/><stop offset="1" stop-color="${selectedTheme.accent}" stop-opacity="0"/></linearGradient><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#fff" stroke-opacity=".055" stroke-width="1"/></pattern><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="1200" height="675" fill="url(#bg)"/><rect width="1200" height="675" fill="url(#grid)"/><ellipse cx="900" cy="38" rx="360" ry="95" fill="${selectedTheme.accent}" opacity=".13" filter="url(#glow)"/><path d="M-80 585 L1280 430 L1280 675 H-80Z" fill="#02070d" opacity=".42"/><path d="M-80 596 L1280 441" stroke="${selectedTheme.accent}" stroke-width="2" opacity=".35"/><path d="M-80 622 L1280 467" stroke="#fff" stroke-width="1" opacity=".08"/><rect x="44" y="38" width="1112" height="570" rx="26" fill="none" stroke="#fff" stroke-opacity=".12"/><rect x="80" y="118" width="10" height="72" rx="5" fill="${selectedTheme.accent}"/><rect x="80" y="205" width="1040" height="3" fill="url(#light)"/><text x="80" y="92" class="eyebrow">SPORTSUP99  /  ${escapeXml(data.league.toUpperCase())} 2026</text><text x="112" y="170" class="title">${title}</text>${body}<text x="80" y="610" class="footer">${escapeXml(data.caption || 'Cricket, captured in the moment.')}</text><style>.eyebrow{font:600 20px Arial;letter-spacing:5px;fill:${selectedTheme.accent}}.title{font:800 62px Arial;fill:#fff;letter-spacing:1px}.score{font:800 68px Arial;fill:#fff}.score-meta{font:600 22px Arial;fill:#9fb9b1}.big{font:800 58px Arial;fill:#fff}.team{font:700 34px Arial;fill:#dcebe7}.winner{font:600 27px Arial;fill:${selectedTheme.accent}}.footer{font:500 18px Arial;fill:#8fa8a1}</style></svg>`;
}

export default function SocialStudioPage() {
  const { currentLeague } = useLeague();
  const [template, setTemplate] = useState<TemplateKind>('result');
  const [theme, setTheme] = useState<ThemeKind>('stadium');
  const [matches, setMatches] = useState<Match[]>(sampleMatches);
  const [players, setPlayers] = useState<Player[]>(samplePlayers);
  const [teams, setTeams] = useState<Team[]>(sampleTeams);
  const [selectedMatchId, setSelectedMatchId] = useState('sample-1');
  const [selectedPlayerId, setSelectedPlayerId] = useState('p1');
  const [caption, setCaption] = useState('A result worth remembering. #IPL2026 #SportsUP99');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notice, setNotice] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [matchData, playerData, teamData] = await Promise.all([api.getMatches(currentLeague).catch(() => []), api.getPlayers(undefined, currentLeague).catch(() => []), api.getTeams(currentLeague).catch(() => [])]);
        if (matchData.length) { setMatches(matchData); setSelectedMatchId(matchData[0].id); }
        if (playerData.length) { setPlayers(playerData); setSelectedPlayerId(playerData[0].id); }
        if (teamData.length) setTeams(teamData);
      } catch { setNotice('Using sample data until live data is available.'); }
    };
    load();
    try { setDrafts(JSON.parse(localStorage.getItem('social-studio-drafts') || '[]')); } catch { setDrafts([]); }
  }, [currentLeague]);

  const selectedMatch = matches.find((match: any) => String(match.id) === String(selectedMatchId)) || matches[0];
  const selectedPlayer = players.find((player: any) => String(player.id) === String(selectedPlayerId)) || players[0];
  const svg = useMemo(() => getSvgMarkup(template, theme, { match: selectedMatch, player: selectedPlayer, teams, players, caption, league: currentLeague }), [caption, currentLeague, players, selectedMatch, selectedPlayer, teams, template, theme]);

  const download = useCallback((format: 'svg' | 'png') => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    if (format === 'svg') {
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `sportsup-${template}.svg`; link.click(); URL.revokeObjectURL(url); setNotice('SVG downloaded.'); return;
    }
    const image = new Image(); image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 675; const context = canvas.getContext('2d'); if (!context) return; context.drawImage(image, 0, 0); canvas.toBlob((png) => { if (!png) return; const url = URL.createObjectURL(png); const link = document.createElement('a'); link.href = url; link.download = `sportsup-${template}.png`; link.click(); URL.revokeObjectURL(url); setNotice('PNG downloaded.'); }); }; image.src = URL.createObjectURL(blob);
  }, [svg, template]);

  const copyImage = async () => { try { await navigator.clipboard.writeText(caption); setNotice('Caption copied. Use Share to send the graphic from your device.'); } catch { setNotice('Copy is unavailable in this browser.'); } };
  const saveDraft = () => { const next = [{ id: crypto.randomUUID(), title: `${templates.find((item) => item.id === template)?.label} - ${new Date().toLocaleDateString()}`, template, theme, caption, createdAt: new Date().toISOString() }, ...drafts].slice(0, 12); setDrafts(next); localStorage.setItem('social-studio-drafts', JSON.stringify(next)); setNotice('Draft saved locally.'); };
  const share = async () => { if (navigator.share) { await navigator.share({ title: 'SportsUP99 graphic', text: caption }).catch(() => undefined); } else copyImage(); };

  return <main className="min-h-screen bg-[#06110f] px-4 py-8 text-white lg:px-8"><div className="mx-auto max-w-[1500px]"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm uppercase tracking-[0.22em] text-emerald-300">Content tools</p><h1 className="text-4xl font-black tracking-tight">Social Studio</h1><p className="mt-2 text-sm text-white/55">Turn match data into ready-to-share graphics.</p></div><div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200"><Sparkles className="h-4 w-4" /> Live data + sample fallback</div></header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,320px)_minmax(520px,1fr)_minmax(260px,300px)]">
      <section className="space-y-5"><Panel title="1. Choose a format"><div className="space-y-2">{templates.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${template === item.id ? 'border-emerald-300/60 bg-emerald-300/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'}`}><div className="font-semibold">{item.label}</div><div className="mt-1 text-xs text-white/45">{item.description}</div></button>)}</div></Panel><Panel title="2. Choose the data"><label className="block text-xs text-white/50">Match<select value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c211e] px-3 py-2 text-sm">{matches.map((match: any) => <option key={match.id} value={match.id}>{teamName(match.team1, 'RCB')} vs {teamName(match.team2, 'MI')}</option>)}</select></label><label className="mt-4 block text-xs text-white/50">Player<select value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c211e] px-3 py-2 text-sm">{players.map((player: any) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label><label className="mt-4 block text-xs text-white/50">Caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-[#0c211e] px-3 py-2 text-sm text-white" /></label></Panel></section>
      <section className="min-w-0"><div ref={previewRef} className="overflow-hidden rounded-2xl border border-white/10 bg-[#102d2a] shadow-2xl shadow-black/30"><div className="aspect-[1200/675] w-full" dangerouslySetInnerHTML={{ __html: svg }} /></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => download('png')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#04110e] hover:bg-emerald-400"><Download className="h-4 w-4" /> Download PNG</button><button type="button" onClick={() => download('svg')} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"><ImageIcon className="h-4 w-4" /> SVG</button><button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"><Share2 className="h-4 w-4" /> Share</button><button type="button" onClick={copyImage} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"><Clipboard className="h-4 w-4" /> Copy caption</button></div>{notice && <p className="mt-3 text-sm text-emerald-300">{notice}</p>}</section>
      <section className="space-y-5"><Panel title="3. Brand theme"><div className="grid grid-cols-3 gap-2">{themes.map((item) => <button key={item.id} type="button" onClick={() => setTheme(item.id)} className={`rounded-lg border p-2 text-center text-xs ${theme === item.id ? 'border-emerald-300/60' : 'border-white/10'}`}><span className="mx-auto mb-2 block h-8 w-8 rounded-full" style={{ background: item.accent }} />{item.label}</button>)}</div></Panel><Panel title="Saved drafts"><div className="space-y-2">{drafts.length === 0 ? <p className="text-sm text-white/40">No drafts yet.</p> : drafts.slice(0, 5).map((draft) => <div key={draft.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-sm font-semibold">{draft.title}</p><p className="mt-1 text-xs text-white/40">{new Date(draft.createdAt).toLocaleString()}</p></div>)}</div><button type="button" onClick={saveDraft} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-300/20"><Save className="h-4 w-4" /> Save current draft</button></Panel><Panel title="Sample gallery"><div className="grid grid-cols-1 gap-2">{['match-result', 'playing-xi', 'player-card'].map((sample) => <img key={sample} src={`/social-samples/${sample}.svg`} alt={`${sample.replace('-', ' ')} sample`} className="w-full rounded-lg border border-white/10" />)}</div></Panel><Panel title="Publishing note"><p className="text-sm leading-6 text-white/55">Export first, then publish through your preferred social channel. The graphic uses a frozen preview and keeps the caption ready to paste.</p><button type="button" onClick={() => setNotice('A future release can connect this studio to social platform APIs.')} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><Upload className="h-4 w-4" /> Configure publishing</button></Panel></section>
    </div></div></main>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-white/65">{title}</h2>{children}</section>; }
