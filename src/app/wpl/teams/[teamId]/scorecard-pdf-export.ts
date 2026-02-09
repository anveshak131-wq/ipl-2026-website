/**
 * Professional Scorecard PDF Export for End-User Pages
 * Self-contained: dynamically loads jsPDF from CDN, generates a
 * beautifully designed cricket scorecard PDF.
 *
 * Design inspired by ESPNcricinfo / ICC match-summary PDFs.
 */

// ─── helpers ───────────────────────────────────────────────────────
function loadJsPDF(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'));
    const w = window as any;
    const ctor = w.jspdf?.jsPDF ?? w.jsPDF;
    if (ctor) return resolve(ctor);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const c = (window as any).jspdf?.jsPDF ?? (window as any).jsPDF;
      if (c) resolve(c);
      else reject(new Error('jsPDF loaded but constructor not found'));
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
    document.head.appendChild(script);
  });
}

const str = (v: any) => (v == null ? '' : String(v));

// Strip characters outside Latin-1 that Helvetica cannot render (e.g. emoji)
const safe = (s: string) => s.replace(/[^\x00-\xFF]/g, '').replace(/\s{2,}/g, ' ').trim();

// ─── colour palette (WPL-inspired) ────────────────────────────────
const C = {
  purple : [75, 0, 130]   as [number, number, number],
  pink   : [219, 39, 119]  as [number, number, number],
  dark   : [15, 23, 42]    as [number, number, number],
  darkBg : [30, 27, 75]    as [number, number, number],
  slate  : [51, 65, 85]    as [number, number, number],
  white  : [255, 255, 255] as [number, number, number],
  gold   : [234, 179, 8]   as [number, number, number],
  green  : [16, 185, 129]  as [number, number, number],
  red    : [239, 68, 68]   as [number, number, number],
  cyan   : [6, 182, 212]   as [number, number, number],
  light  : [241, 245, 249] as [number, number, number],
  muted  : [148, 163, 184] as [number, number, number],
  orange : [249, 115, 22]  as [number, number, number],
};

// ─── main export fn ───────────────────────────────────────────────
export async function exportScorecardAsPDF(data: any): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();   // 595
  const H = doc.internal.pageSize.getHeight();  // 842
  const M = 40; // margin
  let y = 0;

  // ─── Utility closures ──────────────────────────────────────────
  const setC = (c: [number, number, number]) => doc.setTextColor(...c);
  const setF = (c: [number, number, number]) => doc.setFillColor(...c);
  const rect = (x: number, yy: number, w: number, h: number, s = 'F') => {
    if (w > 0 && h > 0) doc.rect(x, yy, w, h, s);
  };
  const text = (
    t: string, x: number, yy: number,
    color: [number, number, number],
    size: number,
    weight: 'normal' | 'bold' | 'italic' = 'normal',
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    setC(color);
    doc.setFontSize(size);
    doc.setFont('helvetica', weight);
    doc.text(safe(String(t)), x, yy, { align });
  };

  const needPage = (needed: number) => {
    if (y + needed > H - 60) {
      addFooter();
      doc.addPage();
      y = 40;
    }
  };

  // ─── Extract data ──────────────────────────────────────────────
  const mi = data.matchInfo || {};
  const team1 = mi.team1?.shortName || mi.team1?.name || str(mi.team1) || 'Team 1';
  const team2 = mi.team2?.shortName || mi.team2?.name || str(mi.team2) || 'Team 2';
  const venue = mi.venue || 'Venue TBD';
  const date  = mi.date  || new Date().toISOString().split('T')[0];
  const tossText = mi.toss ? `${mi.toss.winner} won the toss and chose to ${mi.toss.decision}` : '';
  const resultWinner = data.result?.winner || mi.result?.winner || '';
  const resultMargin = data.result?.margin || mi.result?.margin || '';
  const resultMOM    = data.result?.manOfTheMatch || mi.result?.manOfTheMatch || '';
  const resultText = resultWinner ? `${resultWinner} won by ${resultMargin}` : 'Result Pending';

  // Also check innings-level data (from admin scorecards)
  const innings: any[] = data.innings || [];
  const hasInningsData = innings.length > 0;

  // ═══════════════════════════════════════════════════════════════
  // PAGE 1 — Header & Match Info
  // ═══════════════════════════════════════════════════════════════

  // ── gradient header band ───────────────────────────────────────
  setF(C.purple);
  rect(0, 0, W, 120);
  // second half slightly different
  setF(C.darkBg);
  rect(0, 60, W, 60);

  // decorative accent line
  setF(C.pink);
  rect(0, 118, W, 4);

  // Title
  text('MATCH SCORECARD', W / 2, 45, C.white, 22, 'bold', 'center');
  text('SportsUP  ·  Women\'s Premier League 2026', W / 2, 70, C.gold, 10, 'italic', 'center');
  text(`Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W / 2, 90, C.muted, 8, 'normal', 'center');

  y = 140;

  // ── Match Info Card ────────────────────────────────────────────
  const cardH = 120 + (tossText ? 18 : 0) + (resultMOM ? 18 : 0);
  setF(C.light);
  rect(M, y, W - 2 * M, cardH, 'F');
  doc.setDrawColor(...C.purple);
  doc.setLineWidth(1.5);
  doc.rect(M, y, W - 2 * M, cardH);

  const infoX = M + 20;
  y += 25;
  text('MATCH INFORMATION', infoX, y, C.purple, 12, 'bold');

  y += 22;
  text(`${team1}  vs  ${team2}`, infoX, y, C.dark, 14, 'bold');
  y += 18;
  text(`Venue: ${venue}`, infoX, y, C.slate, 10, 'normal');
  text(`Date: ${date}`, infoX + 260, y, C.slate, 10, 'normal');
  if (tossText) { y += 16; text(`Toss: ${tossText}`, infoX, y, C.slate, 9, 'italic'); }
  y += 18;

  // result badge
  const badgeW = 300;
  const badgeX = infoX;
  setF(resultWinner ? C.green : C.orange);
  rect(badgeX, y - 2, badgeW, 22, 'F');
  text(`Result: ${resultText}`, badgeX + 8, y + 13, C.white, 10, 'bold');
  if (resultMOM) {
    y += 26;
    text(`Man of the Match: ${resultMOM}`, infoX, y + 4, C.purple, 10, 'bold');
  }
  y += 28;

  // ═══════════════════════════════════════════════════════════════
  // FALL OF WICKETS  (per innings)
  // ═══════════════════════════════════════════════════════════════
  if (hasInningsData) {
    innings.forEach((inn: any, innIdx: number) => {
      const fowArr: any[] = inn.fallOfWickets || [];
      if (fowArr.length === 0) return;
      const iTeam = inn.teamName || inn.teamId || (innIdx === 0 ? team1 : team2);
      y += 15;
      needPage(40 + fowArr.length * 22);
      drawSectionHeader(doc, y, W, M, `FALL OF WICKETS - ${iTeam}`, C.red);
      y += 30;

      const cols = ['#', 'Player', 'Score', 'Over'];
      const colW = [40, 200, 120, 120];
      let cx = M;
      setF(C.dark);
      rect(M, y, W - 2 * M, 20, 'F');
      cols.forEach((h, i) => {
        text(h, cx + 6, y + 14, C.white, 8, 'bold');
        cx += colW[i];
      });
      y += 20;

      fowArr.forEach((f: any, idx: number) => {
        needPage(22);
        setF(idx % 2 === 0 ? C.light : C.white);
        rect(M, y, W - 2 * M, 20, 'F');
        cx = M;
        const vals = [
          str(idx + 1),
          str(f.player || f.batsman || ''),
          str(f.score || f.runs || ''),
          str(f.over || ''),
        ];
        vals.forEach((v, i) => {
          text(v, cx + 6, y + 14, C.dark, 8, 'normal');
          cx += colW[i];
        });
        y += 20;
      });

      doc.setDrawColor(...C.slate);
      doc.setLineWidth(0.5);
      doc.rect(M, y - 20 * fowArr.length - 20, W - 2 * M, 20 * fowArr.length + 20);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // POWERPLAYS  (per innings)
  // ═══════════════════════════════════════════════════════════════
  if (hasInningsData) {
    innings.forEach((inn: any, innIdx: number) => {
      const ppItems: { type: string; overs: string; runs: any }[] = [];
      if (inn.powerplays?.mandatory) ppItems.push({ type: 'Mandatory', overs: str(inn.powerplays.mandatory.overs), runs: inn.powerplays.mandatory.runs ?? '-' });
      if (inn.powerplays?.optional)  ppItems.push({ type: 'Optional',  overs: str(inn.powerplays.optional.overs),  runs: inn.powerplays.optional.runs  ?? '-' });
      if (inn.powerplay)             ppItems.push({ type: 'Powerplay', overs: str(inn.powerplay.overs), runs: inn.powerplay.runs ?? '-' });
      if (ppItems.length === 0) return;

      const iTeam = inn.teamName || inn.teamId || (innIdx === 0 ? team1 : team2);
      y += 25;
      needPage(40 + ppItems.length * 46);
      drawSectionHeader(doc, y, W, M, `POWERPLAYS - ${iTeam}`, C.cyan);
      y += 30;

      ppItems.forEach((p, idx) => {
        needPage(50);
        setF(idx % 2 === 0 ? C.light : C.white);
        rect(M, y, W - 2 * M, 36, 'F');
        doc.setDrawColor(...C.cyan);
        doc.setLineWidth(0.8);
        doc.rect(M, y, W - 2 * M, 36);

        setF(C.cyan);
        rect(M, y, 4, 36, 'F');

        text(p.type, M + 14, y + 16, C.dark, 10, 'bold');
        const rx = W - M - 160;
        text(`Overs: ${p.overs || '-'}`, rx, y + 16, C.slate, 9, 'normal');
        text(`${p.runs} runs`, rx, y + 30, C.purple, 9, 'bold');

        y += 42;
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PARTNERSHIPS  (per innings)
  // ═══════════════════════════════════════════════════════════════
  if (hasInningsData) {
    innings.forEach((inn: any, innIdx: number) => {
      const pArr: any[] = inn.partnerships || [];
      if (pArr.length === 0) return;
      const iTeam = inn.teamName || inn.teamId || (innIdx === 0 ? team1 : team2);

      y += 25;
      needPage(40 + pArr.length * 55);
      drawSectionHeader(doc, y, W, M, `PARTNERSHIPS - ${iTeam}`, C.green);
      y += 30;

      const maxRuns = Math.max(...pArr.map((p: any) => Number(p.totalRuns || p.runs) || 0), 1);
      const barAreaW = W - 2 * M - 20;

      pArr.forEach((p: any, idx: number) => {
        needPage(55);
        const totalRuns  = Number(p.totalRuns || p.runs) || 0;
        const b1r = str(p.batsman1Runs ?? p.runs1 ?? '');
        const b1b = str(p.batsman1Balls ?? p.balls1 ?? '');
        const b2r = str(p.batsman2Runs ?? p.runs2 ?? '');
        const b2b = str(p.batsman2Balls ?? p.balls2 ?? '');
        const barW = (totalRuns / maxRuns) * (barAreaW * 0.45);

        setF(idx % 2 === 0 ? C.light : C.white);
        rect(M, y, W - 2 * M, 48, 'F');

        // partnership label
        text(`${idx + 1}. ${str(p.batsman1)} & ${str(p.batsman2)}`, M + 10, y + 16, C.dark, 9, 'bold');
        // detail line
        const detail = `${str(p.batsman1)}: ${b1r}(${b1b})   ${str(p.batsman2)}: ${b2r}(${b2b})`;
        text(detail, M + 10, y + 32, C.muted, 7, 'normal');

        // bar
        const barX = M + 280;
        setF(C.green);
        rect(barX, y + 6, barW, 14, 'F');
        text(`${totalRuns} runs`, barX + barW + 8, y + 16, C.dark, 8, 'bold');

        y += 52;
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // INNINGS BATTING / BOWLING (if available)
  // ═══════════════════════════════════════════════════════════════
  if (hasInningsData) {
    innings.forEach((inn: any, innIdx: number) => {
      const battingTeam = inn.teamName || inn.teamId || `Innings ${innIdx + 1}`;
      const batting: any[] = inn.batting || [];
      const bowling: any[] = inn.bowling || [];
      const total = inn.totalRuns ?? inn.total ?? '–';
      const wickets = inn.wickets ?? '–';
      const overs = inn.overs ?? '–';

      // Batting table
      if (batting.length > 0) {
        needPage(50 + batting.length * 20);
        y += 25;
        drawSectionHeader(doc, y, W, M, `${battingTeam} - BATTING  (${total}/${wickets}, ${overs} ov)`, C.purple);
        y += 30;

        const bCols = ['Batter', 'Dismissal', 'R', 'B', '4s', '6s', 'SR'];
        const bColW = [130, 140, 35, 35, 30, 30, 50];
        let cx = M;
        setF(C.purple);
        rect(M, y, W - 2 * M, 20, 'F');
        bCols.forEach((h, i) => {
          text(h, cx + 4, y + 14, C.white, 8, 'bold');
          cx += bColW[i];
        });
        y += 20;

        batting.forEach((b: any, bi: number) => {
          needPage(22);
          setF(bi % 2 === 0 ? C.light : C.white);
          rect(M, y, W - 2 * M, 20, 'F');
          cx = M;
          const runs_b  = Number(b.runs) || 0;
          const balls_b = Number(b.balls) || 0;
          const sr_b    = balls_b > 0 ? ((runs_b / balls_b) * 100).toFixed(1) : '0.0';
          // Handle dismissal — can be object { type, details } or string
          let dismissalStr = 'not out';
          if (typeof b.dismissal === 'object' && b.dismissal) {
            dismissalStr = b.dismissal.details || b.dismissal.type || 'not out';
          } else if (typeof b.dismissal === 'string' && b.dismissal) {
            dismissalStr = b.dismissal;
          } else if (b.howOut) {
            dismissalStr = str(b.howOut);
          }
          const vals = [
            str(b.name || b.batsman),
            dismissalStr,
            str(runs_b),
            str(balls_b),
            str(b.fours ?? b['4s'] ?? 0),
            str(b.sixes ?? b['6s'] ?? 0),
            sr_b,
          ];
          vals.forEach((v, i) => {
            const isBold = i === 0 || i === 2;
            text(v, cx + 4, y + 14, C.dark, 8, isBold ? 'bold' : 'normal');
            cx += bColW[i];
          });
          y += 20;
        });
      }

      // Extras + Total row
      if (batting.length > 0) {
        const ex = inn.extras || {};
        needPage(24);
        setF(C.light);
        rect(M, y, W - 2 * M, 20, 'F');
        text('Extras', M + 4, y + 14, C.slate, 8, 'bold');
        text(`W ${ex.wides||0}  NB ${ex.noBalls||0}  B ${ex.byes||0}  LB ${ex.legByes||0}`, M + 134, y + 14, C.slate, 8, 'normal');
        y += 20;
        setF(C.purple);
        rect(M, y, W - 2 * M, 20, 'F');
        text(`TOTAL: ${total}/${wickets}  (${overs} ov)`, M + 4, y + 14, C.white, 9, 'bold');
        y += 22;
      }

      // Bowling table
      if (bowling.length > 0) {
        needPage(50 + bowling.length * 20);
        y += 15;
        drawSectionHeader(doc, y, W, M, `${battingTeam} - BOWLING`, C.red);
        y += 30;

        const wCols = ['Bowler', 'O', 'M', 'R', 'W', 'Econ', 'Dots'];
        const wColW = [150, 40, 35, 40, 35, 55, 50];
        let cx = M;
        setF(C.red);
        rect(M, y, W - 2 * M, 20, 'F');
        wCols.forEach((h, i) => {
          text(h, cx + 4, y + 14, C.white, 8, 'bold');
          cx += wColW[i];
        });
        y += 20;

        bowling.forEach((bw: any, bi: number) => {
          needPage(22);
          setF(bi % 2 === 0 ? C.light : C.white);
          rect(M, y, W - 2 * M, 20, 'F');
          cx = M;
          const bwOvers = Number(bw.overs) || 0;
          const bwRuns  = Number(bw.runs)  || 0;
          const econ = bw.economyRate ?? bw.economy ?? (bwOvers > 0 ? (bwRuns / bwOvers).toFixed(1) : '-');
          const vals = [
            str(bw.name || bw.bowler),
            str(bw.overs ?? 0),
            str(bw.maidens ?? 0),
            str(bwRuns),
            str(bw.wickets ?? 0),
            str(econ),
            str(bw.dots ?? '-'),
          ];
          vals.forEach((v, i) => {
            const isBold = i === 0 || i === 4;
            text(v, cx + 4, y + 14, C.dark, 8, isBold ? 'bold' : 'normal');
            cx += wColW[i];
          });
          y += 20;
        });
      }
    });
  }

  // ── footer on last page ────────────────────────────────────────
  addFooter();

  // ── save ───────────────────────────────────────────────────────
  const fname = `${team1}_vs_${team2}_Scorecard_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname.replace(/\s+/g, '_'));

  // ═══════════════════════════════════════════════════════════════
  // local helpers
  // ═══════════════════════════════════════════════════════════════

  function addFooter() {
    const fy = H - 30;
    setF(C.dark);
    rect(0, fy - 10, W, 40, 'F');
    setF(C.pink);
    rect(0, fy - 12, W, 2, 'F');
    text('SportsUP  ·  sportsup18.pages.dev', W / 2, fy + 6, C.muted, 8, 'normal', 'center');
    text('© 2026 SportsUP. All rights reserved.', W / 2, fy + 18, C.muted, 7, 'italic', 'center');
  }
}

// ─── section header strip ────────────────────────────────────────
function drawSectionHeader(
  doc: any, y: number, W: number, M: number,
  title: string, accent: [number, number, number]
) {
  doc.setFillColor(...accent);
  doc.rect(M, y, 4, 20, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accent);
  doc.text(safe(title), M + 14, y + 15);
}


