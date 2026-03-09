/**
 * IPL Points Table Export Module
 * Supports PDF, Excel, CSV, and Database export formats
 * with year-based filtering and professional styling
 */

// Dynamic imports for client-side only libraries
const importJsPDF = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const jspdfModule = await import('jspdf');
    const jsPDF = (jspdfModule as { jsPDF?: typeof import('jspdf').jsPDF; default?: any }).jsPDF
      || (jspdfModule as { default?: any }).default;
    if (!jsPDF) {
      throw new Error('jsPDF export not found');
    }
    return jsPDF;
  } catch (error) {
    console.error('Failed to import jsPDF:', error);
    return null;
  }
};

const importAutoTable = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const module = await import('jspdf-autotable');
    const autoTable = (module as { autoTable?: any; default?: any }).autoTable || (module as { default?: any }).default;
    if (!autoTable) {
      throw new Error('autoTable export not found');
    }
    return autoTable as (doc: any, options: any) => void;
  } catch (error) {
    console.error('Failed to import autoTable:', error);
    return null;
  }
};

const importXLSX = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const xlsxModule = await import('xlsx');
    const XLSX = (xlsxModule as { default?: any }).default || xlsxModule;
    if (!XLSX || !XLSX.utils) {
      throw new Error('XLSX export not found');
    }
    return XLSX as typeof import('xlsx');
  } catch (error) {
    console.error('Failed to import XLSX:', error);
    return null;
  }
};

// Types for Points Table data
export interface PointsTableTeam {
  id: string;
  name: string;
  shortName: string;
  matchesPlayed: number | null;
  wins: number | null;
  losses: number | null;
  noResult: number | null;
  points: number | null;
  netRunRate: number | null;
  qualified: boolean;
  logo?: string;
}

export interface PointsTableExportData {
  teams: PointsTableTeam[];
  year: number;
  filtered: boolean;
  searchTerm?: string;
  sortBy: string;
}

export interface DatabaseExportRecord {
  id: string;
  team_name: string;
  team_short_name: string;
  season_year: number;
  matches_played: number | null;
  wins: number | null;
  losses: number | null;
  no_result: number | null;
  points: number | null;
  net_run_rate: number | null;
  qualified: boolean;
  export_timestamp: string;
  data_source: string;
}

type ChartSeries = {
  label: string;
  value: number;
  valueLabel?: string;
};

const safeNumber = (value: number | null | undefined, fallback: number = 0) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return value;
};

const getTopSeries = (
  teams: PointsTableTeam[],
  selector: (team: PointsTableTeam) => number,
  limit: number
): ChartSeries[] => {
  return [...teams]
    .map((team) => {
      const rawLabel = team.shortName || team.name || 'Team';
      const label = rawLabel.length > 7 ? rawLabel.slice(0, 7) : rawLabel;
      return {
        label,
        value: safeNumber(selector(team), 0)
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

const drawStatCard = (
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  accent: [number, number, number]
) => {
  doc.setFillColor(255, 250, 244);
  doc.setDrawColor(235, 206, 176);
  doc.rect(x, y, width, height, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(112, 86, 60);
  doc.text(title, x + 4, y + 5);

  doc.setFontSize(12);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(value, x + 4, y + 11);
};

const drawPageBackground = (doc: any, pageWidth: number, pageHeight: number) => {
  doc.setFillColor(241, 245, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(224, 231, 255);
  doc.rect(0, 0, pageWidth, pageHeight * 0.4, 'F');
  doc.setFillColor(236, 253, 245);
  doc.rect(0, pageHeight * 0.4, pageWidth, pageHeight * 0.6, 'F');
  doc.setFillColor(255, 228, 230);
  doc.circle(pageWidth - 22, pageHeight - 18, 16, 'F');
  doc.setFillColor(254, 243, 199);
  doc.circle(20, pageHeight - 12, 12, 'F');
  doc.setFillColor(237, 233, 254);
  doc.triangle(pageWidth * 0.7, 0, pageWidth, 0, pageWidth, pageHeight * 0.28, 'F');
};

const drawHeaderBand = (
  doc: any,
  pageWidth: number,
  headerHeight: number,
  year: number
) => {
  doc.setFillColor(15, 50, 70);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(33, 116, 150);
  doc.rect(0, 0, pageWidth * 0.65, headerHeight, 'F');
  doc.setDrawColor(253, 186, 116);
  doc.setLineWidth(0.6);
  doc.line(0, headerHeight, pageWidth, headerHeight);

  doc.setFont('helvetica');
  doc.setFontSize(10);
  doc.setTextColor(248, 250, 252);
  doc.text('SportsUP18 Admin', 10, 12);

  doc.setFontSize(16);
  doc.setTextColor(248, 250, 252);
  doc.text(`IPL Points Table - Season ${year}`, pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('Generated by SportsUP18', pageWidth - 12, 9, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text('Confidential • Admin Use Only', pageWidth - 12, 15, { align: 'right' });
};

const drawFooter = (
  doc: any,
  pageWidth: number,
  pageHeight: number,
  totalTeams: number,
  pageNumber: number,
  totalPages: number
) => {
  const footerY = pageHeight - 6;
  doc.setFontSize(8);
  doc.setTextColor(112, 86, 60);
  doc.text(`Total Teams: ${totalTeams}`, 14, footerY);
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, footerY, { align: 'right' });

  const copyrightYear = new Date().getFullYear();
  doc.setFontSize(7);
  doc.setTextColor(126, 98, 70);
  doc.text(
    `© ${copyrightYear} SportsUP18. Admin-only. Unauthorized use prohibited.`,
    pageWidth / 2,
    pageHeight - 2,
    { align: 'center' }
  );
};

const drawBarChart = (
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  series: ChartSeries[],
  color: [number, number, number]
) => {
  doc.setFillColor(255, 250, 244);
  doc.setDrawColor(235, 206, 176);
  doc.rect(x, y, width, height, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(70, 44, 24);
  doc.text(title, x + 4, y + 6);

  const chartX = x + 4;
  const chartY = y + 8;
  const chartHeight = height - 16;
  const chartWidth = width - 8;

  const maxValue = Math.max(...series.map((s) => s.value), 1);
  const barGap = 2;
  const barWidth = chartWidth / Math.max(series.length, 1) - barGap;

  doc.setDrawColor(210, 180, 150);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  series.forEach((item, index) => {
    const barHeight = Math.max(2, (item.value / maxValue) * (chartHeight - 4));
    const barX = chartX + index * (barWidth + barGap);
    const barY = chartY + chartHeight - barHeight;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    doc.setFontSize(6);
    doc.setTextColor(102, 78, 55);
    doc.text(item.label, barX + barWidth / 2, chartY + chartHeight + 4, { align: 'center' });
    if (barHeight > 6) {
      doc.setTextColor(255);
      doc.text(item.valueLabel ?? String(item.value), barX + barWidth / 2, barY + 3, { align: 'center' });
    }
  });
};

const drawDivergingBarChart = (
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  series: ChartSeries[],
  positiveColor: [number, number, number],
  negativeColor: [number, number, number]
) => {
  doc.setFillColor(255, 250, 244);
  doc.setDrawColor(235, 206, 176);
  doc.rect(x, y, width, height, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(70, 44, 24);
  doc.text(title, x + 4, y + 6);

  const chartX = x + 4;
  const chartY = y + 8;
  const chartHeight = height - 16;
  const chartWidth = width - 8;
  const zeroY = chartY + chartHeight / 2;
  const maxAbs = Math.max(...series.map((s) => Math.abs(s.value)), 1);
  const barGap = 2;
  const barWidth = chartWidth / Math.max(series.length, 1) - barGap;

  doc.setDrawColor(210, 180, 150);
  doc.line(chartX, zeroY, chartX + chartWidth, zeroY);

  series.forEach((item, index) => {
    const barHeight = Math.max(1, (Math.abs(item.value) / maxAbs) * (chartHeight / 2 - 2));
    const barX = chartX + index * (barWidth + barGap);
    const barY = item.value >= 0 ? zeroY - barHeight : zeroY;

    const [r, g, b] = item.value >= 0 ? positiveColor : negativeColor;
    doc.setFillColor(r, g, b);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    doc.setFontSize(6);
    doc.setTextColor(102, 78, 55);
    doc.text(item.label, barX + barWidth / 2, chartY + chartHeight + 4, { align: 'center' });

    const valueLabel = item.valueLabel ?? (item.value >= 0 ? `+${item.value}` : String(item.value));
    doc.setTextColor(70, 44, 24);
    doc.text(
      valueLabel,
      barX + barWidth / 2,
      item.value >= 0 ? barY - 1 : barY + barHeight + 5,
      { align: 'center' }
    );
  });
};

/**
 * Export points table to CSV format
 */
export function exportPointsTableToCSV(data: PointsTableExportData): void {
  const { teams, year, filtered, searchTerm } = data;
  
  if (teams.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = [
    'Rank',
    'Team Name',
    'Short Name',
    'Matches Played',
    'Wins',
    'Losses',
    'No Result',
    'Points',
    'Net Run Rate',
    'Qualified'
  ];

  const csvContent = [
    `IPL Points Table - Season ${year}${filtered ? ' (Filtered)' : ''}`,
    `Generated on: ${new Date().toLocaleString()}`,
    searchTerm && `Search Term: ${searchTerm}`,
    '',
    headers.join(','),
    ...teams.map((team, index) => {
      const rank = index + 1;
      return [
        rank,
        `"${team.name}"`,
        `"${team.shortName}"`,
        team.matchesPlayed || 0,
        team.wins || 0,
        team.losses || 0,
        team.noResult || 0,
        team.points || 0,
        team.netRunRate !== null ? team.netRunRate.toFixed(3) : '0.000',
        team.qualified ? 'Yes' : 'No'
      ].join(',');
    })
  ].filter(Boolean).join('\n');

  downloadFile(csvContent, `ipl-points-table-${year}${filtered ? '-filtered' : ''}.csv`, 'text/csv');
}

/**
 * Export points table to Excel format
 */
export async function exportPointsTableToExcel(data: PointsTableExportData): Promise<void> {
  const { teams, year, filtered, searchTerm } = data;
  
  if (teams.length === 0) {
    alert('No data to export');
    return;
  }

  const XLSX = await importXLSX();
  if (!XLSX) {
    alert('Excel export is not available in this environment');
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for worksheet
  const wsData: (string | number)[][] = [
    [`IPL Points Table - Season ${year}${filtered ? ' (Filtered)' : ''}`],
    [`Generated on: ${new Date().toLocaleString()}`]
  ];
  
  if (searchTerm) {
    wsData.push([`Search Term: ${searchTerm}`]);
  }
  
  wsData.push([]);
  wsData.push(['Rank', 'Team Name', 'Short Name', 'Matches Played', 'Wins', 'Losses', 'No Result', 'Points', 'Net Run Rate', 'Qualified']);
  
  teams.forEach((team, index) => {
    wsData.push([
      index + 1,
      team.name,
      team.shortName,
      team.matchesPlayed || 0,
      team.wins || 0,
      team.losses || 0,
      team.noResult || 0,
      team.points || 0,
      team.netRunRate !== null ? parseFloat(team.netRunRate.toFixed(3)) : 0,
      team.qualified ? 'Yes' : 'No'
    ]);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Rank
    { wch: 25 }, // Team Name
    { wch: 15 }, // Short Name
    { wch: 15 }, // Matches Played
    { wch: 8 },  // Wins
    { wch: 10 }, // Losses
    { wch: 12 }, // No Result
    { wch: 10 }, // Points
    { wch: 15 }, // Net Run Rate
    { wch: 12 }  // Qualified
  ];

  // Style the header row
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col }); // Header is at row 4 (0-indexed)
    if (!ws[cellAddress]) ws[cellAddress] = {};
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFD700' } }, // Gold background
      alignment: { horizontal: 'center' }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, `IPL ${year} Points`);

  // Save the file using a blob for better browser compatibility
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `ipl-points-table-${year}${filtered ? '-filtered' : ''}.xlsx`);
}

/**
 * Export points table to PDF format — Page 1: table + badges, Page 2: charts + insights
 */
export async function exportPointsTableToPDF(data: PointsTableExportData): Promise<void> {
  const { teams, year, filtered, searchTerm } = data;

  if (teams.length === 0) {
    alert('No data to export');
    return;
  }

  const jsPDF = await importJsPDF();
  if (!jsPDF) {
    alert('PDF export is not available in this environment');
    return;
  }
  const autoTable = await importAutoTable();
  if (!autoTable) {
    alert('PDF table export is not available in this environment');
    return;
  }

  // ── Palette (Cosmic Purple) ──────────────────────────────────────────────────
  type RGB = [number, number, number];
  const BG:       RGB = [10,   5,  28];
  const HDRFILL:  RGB = [42,  18,  95];
  const HDRFILL2: RGB = [28,  12,  65];
  const ROW1:     RGB = [22,  14,  52];
  const ROW2:     RGB = [14,   8,  36];
  const QUAL:     RGB = [32,  20,  80];
  const GRID:     RGB = [75,  45, 140];
  const VIOLET:   RGB = [210, 110, 255];
  const MAGENTA:  RGB = [255,  70, 155];
  const WHITE:    RGB = [248, 242, 255];
  const MUTED:    RGB = [195, 178, 240];
  const DIM:      RGB = [120, 100, 170];
  const MINT:     RGB = [80,  255, 180];
  const CORAL:    RGB = [255, 110, 140];
  const TEAL:     RGB = [120, 255, 210];
  const SKYBLUE:  RGB = [80,  170, 255];
  const AMBER:    RGB = [255, 200,  60];


  // Team brand colours
  const TEAM_COLORS: Record<string, RGB> = {
    MI:   [90,  160, 255],  CSK:  [255, 220,  60],  RCB:  [255, 100, 100],
    KKR:  [200, 130, 255],  SRH:  [255, 160,  50],  DC:   [90,  170, 255],
    PBKS: [255,  80,  80],  RR:   [255, 120, 200],  GT:   [90,  210, 230],
    LSG:  [90,  230, 190],  DD:   [90,  160, 255],  KTK:  [200, 130, 255],
    PWI:  [255,  80,  80],  DEC:  [255, 160,  50],  COC:  [90,  210, 230],
    RPS:  [255, 120, 200],
  };
  const tclr = (s: string): RGB => TEAM_COLORS[(s||'').toUpperCase().trim()] ?? VIOLET;
  const lerpRGB = (a: RGB, b: RGB, t: number): RGB => [
    Math.round(a[0]+(b[0]-a[0])*t),
    Math.round(a[1]+(b[1]-a[1])*t),
    Math.round(a[2]+(b[2]-a[2])*t),
  ];

  // ── Document ──────────────────────────────────────────────────────────────────
  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const MX = 13;
  const CW = PW - MX * 2;
  const HDR_H   = 40;
  const FTR_H   = 12;
  const CONTENT_TOP = HDR_H + 2;

  // ── Utility draw helpers ──────────────────────────────────────────────────────
  const fill   = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const txt    = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const rr     = (x: number, y: number, w: number, h: number, r: number, mode: 'F'|'S'|'FD') =>
    doc.roundedRect(x, y, w, h, r, r, mode);

  const gradH = (x: number, y: number, w: number, h: number, c1: RGB, c2: RGB, n = 30) => {
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      fill(lerpRGB(c1, c2, i / (n - 1)));
      doc.rect(x + i * sw, y, sw + 0.5, h, 'F');
    }
  };

  // ── Header (drawn on every page) ──────────────────────────────────────────────
  const paintHeader = (pageNum: number) => {
    fill(HDRFILL); doc.rect(0, 0, PW, HDR_H, 'F');
    gradH(0, 0, PW, 3, VIOLET, MAGENTA);
    gradH(0, 0, 6, HDR_H, VIOLET, MAGENTA, 10);
    gradH(PW - 6, 0, 6, HDR_H, MAGENTA, VIOLET, 10);
    fill(GRID); doc.rect(0, HDR_H - 0.5, PW, 0.5, 'F');
    // Diagonal slash decorations
    stroke(VIOLET); doc.setLineWidth(0.15);
    for (let i = 0; i < 6; i++) {
      const sx = PW - 55 + i * 9;
      doc.line(sx, 0, sx + HDR_H * 0.65, HDR_H);
    }
    // Left: IPL + year
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
    txt(VIOLET); doc.text('IPL', MX + 8, HDR_H / 2 + 5);
    const iplW = doc.getTextWidth('IPL');
    txt(WHITE); doc.text(String(year), MX + 8 + iplW + 3, HDR_H / 2 + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    txt(MUTED); doc.text('INDIAN PREMIER LEAGUE', MX + 8, HDR_H / 2 + 11);
    // Right: title
    doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    txt(WHITE); doc.text('POINTS TABLE', PW - MX - 8, HDR_H / 2 + 3, { align: 'right' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    txt(MUTED); doc.text(`Season ${year}  ·  Page ${pageNum}`, PW - MX - 8, HDR_H / 2 + 10, { align: 'right' });
  };

  // ── Footer (drawn on every page) ──────────────────────────────────────────────
  const paintFooter = (pageNum: number, totalPages: number) => {
    const FY = PH - FTR_H;
    fill(HDRFILL2); doc.rect(0, FY, PW, FTR_H, 'F');
    gradH(0, FY, PW, 0.6, VIOLET, MAGENTA);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    txt(DIM); doc.text(`IPL ${year} · Points Table`, MX, FY + 4.5);
    txt(MUTED); doc.text(`${pageNum} / ${totalPages}`, PW / 2, FY + 4.5, { align: 'center' });
    txt(DIM); doc.text(new Date().toLocaleString(), PW - MX, FY + 4.5, { align: 'right' });
    txt(DIM); doc.setFontSize(5.5);
    doc.text(
      `© ${new Date().getFullYear()} SportsUp99. All rights reserved. For internal use only.`,
      PW / 2, FY + 9, { align: 'center' }
    );
  };

  // ── Section title bar ─────────────────────────────────────────────────────────
  const sectionTitle = (y: number, label: string, accent: RGB = VIOLET): number => {
    fill(HDRFILL2); doc.rect(MX, y, CW, 7, 'F');
    fill(accent); doc.rect(MX, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    txt(accent); doc.text(label, MX + 6, y + 5);
    return y + 10;
  };

  // ── Stat badges ───────────────────────────────────────────────────────────────
  const totalTeams   = teams.length;
  const qualCount    = teams.filter(t => t.qualified).length;
  const topTeam      = teams[0];
  const totalPts     = teams.reduce((s, t) => s + safeNumber(t.points, 0), 0);
  const avgNRR       = teams.length
    ? teams.reduce((s, t) => s + safeNumber(t.netRunRate, 0), 0) / teams.length
    : 0;

  interface Badge { label: string; value: string; accent: RGB }
  const BADGES: Badge[] = [
    { label: 'TEAMS',     value: String(totalTeams),                      accent: VIOLET  },
    { label: 'QUALIFIED', value: String(qualCount),                        accent: TEAL    },
    { label: 'SEASON',    value: String(year),                             accent: SKYBLUE },
    { label: 'LEADER',    value: topTeam?.shortName || topTeam?.name || '—', accent: tclr(topTeam?.shortName || '') },
    { label: 'AVG NRR',   value: (avgNRR >= 0 ? '+' : '') + avgNRR.toFixed(3), accent: avgNRR >= 0 ? MINT : CORAL },
    { label: 'TOTAL PTS', value: String(totalPts),                         accent: AMBER   },
  ];

  const badgeH   = 18;
  const badgesY  = CONTENT_TOP + 2;
  const bPerRow  = 3;
  const bW       = (CW - (bPerRow - 1) * 3) / bPerRow;
  const badgeRows = Math.ceil(BADGES.length / bPerRow);

  const drawBadges = () => {
    BADGES.forEach((b, i) => {
      const col = i % bPerRow;
      const row = Math.floor(i / bPerRow);
      const bx  = MX + col * (bW + 3);
      const by  = badgesY + row * (badgeH + 3);
      fill(HDRFILL2); rr(bx, by, bW, badgeH, 2, 'F');
      stroke(b.accent); doc.setLineWidth(0.5); rr(bx, by, bW, badgeH, 2, 'S');
      fill(b.accent); rr(bx, by, 3.5, badgeH, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      txt(b.accent); doc.text(b.label, bx + 6, by + 6.5);
      doc.setFontSize(12); txt(WHITE);
      doc.text(b.value, bx + 6, by + 14.5);
    });
  };

  let tableY = badgesY + badgeRows * (badgeH + 3) + 4;
  if (filtered || searchTerm) tableY += 7;

  // ── Table ─────────────────────────────────────────────────────────────────────
  const tableHeaders = ['#', 'Team', 'M', 'W', 'L', 'NR', 'Pts', 'NRR', 'Status'];
  const tableBody = teams.map((team, idx) => {
    const nrr = safeNumber(team.netRunRate, 0);
    return [
      String(idx + 1),
      team.shortName || team.name || '—',
      String(safeNumber(team.matchesPlayed, 0)),
      String(safeNumber(team.wins, 0)),
      String(safeNumber(team.losses, 0)),
      String(safeNumber(team.noResult, 0)),
      String(safeNumber(team.points, 0)),
      (nrr >= 0 ? '+' : '') + nrr.toFixed(3),
      team.qualified ? 'Qualified' : '—',
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: tableY,
    margin: { top: CONTENT_TOP + 2, left: MX, right: MX, bottom: FTR_H + 4 },
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3.8, bottom: 3.8, left: 3.5, right: 3 },
      lineWidth: 0.2,
      lineColor: GRID,
      overflow: 'linebreak',
      textColor: WHITE,
      fillColor: ROW1,
    },
    headStyles: {
      fillColor: HDRFILL,
      textColor: VIOLET,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 4.5, bottom: 4.5, left: 3.5, right: 3 },
    },
    alternateRowStyles: { fillColor: ROW2 },
    columnStyles: {
      0: { cellWidth: 11, halign: 'center' },
      1: { cellWidth: 34, halign: 'left'   },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 26, halign: 'center' },
      8: { cellWidth: 35, halign: 'center' },
    },
    didParseCell: (cd: any) => {
      if (cd.section !== 'body') return;
      const ri   = cd.row.index;
      const ci   = cd.column.index;
      const team = teams[ri];
      const isQ  = team?.qualified;
      cd.cell.styles.fillColor  = isQ ? QUAL : (ri % 2 === 0 ? ROW1 : ROW2);
      cd.cell.styles.textColor  = WHITE;
      cd.cell.styles.fontStyle  = 'normal';
      if (ci === 0) { cd.cell.styles.textColor = isQ ? VIOLET : MUTED; if (isQ) cd.cell.styles.fontStyle = 'bold'; }
      if (ci === 1) { cd.cell.styles.textColor = tclr(team?.shortName || ''); cd.cell.styles.fontStyle = 'bold'; }
      if (ci === 6 && isQ) { cd.cell.styles.textColor = VIOLET; cd.cell.styles.fontStyle = 'bold'; }
      if (ci === 7) { const nrr = safeNumber(team?.netRunRate, 0); cd.cell.styles.textColor = nrr >= 0 ? MINT : CORAL; cd.cell.styles.fontStyle = 'bold'; }
      if (ci === 8) { cd.cell.styles.textColor = isQ ? TEAL : DIM; if (isQ) cd.cell.styles.fontStyle = 'bold'; }
    },
    willDrawPage: (pd: any) => {
      fill(BG); doc.rect(0, 0, PW, PH, 'F');
      paintHeader(pd.pageNumber);
      if (pd.pageNumber === 1) {
        drawBadges();
        if (filtered || searchTerm) {
          const noteY = badgesY + badgeRows * (badgeH + 3) + 3;
          doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); txt(VIOLET);
          const note = filtered ? `Filtered${searchTerm ? ` — "${searchTerm}"` : ''}` : `Search: "${searchTerm}"`;
          doc.text(note, MX, noteY);
        }
      }
    },
    didDrawPage: (pd: any) => {
      paintFooter(pd.pageNumber, doc.internal.getNumberOfPages());
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — Analytics & Charts
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  fill(BG); doc.rect(0, 0, PW, PH, 'F');
  paintHeader(2);
  paintFooter(2, doc.internal.getNumberOfPages());

  let cy = CONTENT_TOP + 4;

  // Helper: solid horizontal bar (with optional glow halo for emphasis)
  const hBar = (x: number, y: number, w: number, h: number, color: RGB, glow = false) => {
    if (glow) { fill(lerpRGB(color, BG, 0.5)); doc.rect(x, y - 0.8, w, h + 1.6, 'F'); }
    fill(color); doc.rect(x, y, w, h, 'F');
  };

  const BAR_LBL_W  = 30;
  const BAR_AREA_W = CW - BAR_LBL_W - 26;
  const BAR_AREA_X = MX + BAR_LBL_W;
  const barH       = Math.min(6.5, 60 / Math.max(1, teams.length));
  const barGap     = 1.0;

  // ── Chart 1: Points Bar Chart ─────────────────────────────────────────────────
  cy = sectionTitle(cy, `CHART 1 — POINTS COMPARISON (Season ${year})`, VIOLET);
  const CHART1_H = 68;
  const maxPts   = Math.max(1, ...teams.map(t => safeNumber(t.points, 0)));

  fill(HDRFILL2); doc.rect(MX, cy, CW, CHART1_H, 'F');

  // X axis grid + tick labels
  [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
    const tick = Math.round(frac * maxPts);
    const tx   = BAR_AREA_X + frac * BAR_AREA_W;
    stroke(GRID); doc.setLineWidth(0.15);
    doc.line(tx, cy + 2, tx, cy + CHART1_H - 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(DIM);
    doc.text(String(tick), tx, cy + CHART1_H - 4, { align: 'center' });
  });

  teams.forEach((team, i) => {
    const pts  = safeNumber(team.points, 0);
    const w    = (pts / maxPts) * BAR_AREA_W;
    const by2  = cy + 6 + i * (barH + barGap);
    const clr  = tclr(team.shortName || '');
    const isQ  = team.qualified;
    doc.setFont('helvetica', isQ ? 'bold' : 'normal'); doc.setFontSize(6.5);
    txt(isQ ? clr : MUTED);
    doc.text((team.shortName || team.name || '?').substring(0, 8), BAR_AREA_X - 2, by2 + barH * 0.72, { align: 'right' });
    hBar(BAR_AREA_X, by2, Math.max(1, w), barH, clr, isQ);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5);
    if (w > 4) { txt(WHITE); doc.text(String(pts), BAR_AREA_X + w - 1.5, by2 + barH * 0.72, { align: 'right' }); }
    else { txt(clr); doc.text(String(pts), BAR_AREA_X + w + 2, by2 + barH * 0.72); }
  });

  // Legend (right column)
  const LEG_X = MX + CW - 24;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6); txt(VIOLET);
  doc.text('LEGEND', LEG_X, cy + 8);
  teams.slice(0, 10).forEach((team, i) => {
    const clr = tclr(team.shortName || '');
    const ly  = cy + 12 + i * 5.5;
    fill(clr); doc.rect(LEG_X, ly - 3.5, 4, 3.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(MUTED);
    doc.text((team.shortName || '?').substring(0, 5), LEG_X + 5.5, ly - 0.5);
    if (team.qualified) { txt(TEAL); doc.text('✓', LEG_X + 18, ly - 0.5); }
  });
  cy += CHART1_H + 5;

  // ── Chart 2: Stacked Win / Loss / NR Bars ────────────────────────────────────
  cy = sectionTitle(cy, `CHART 2 — WIN / LOSS / NO RESULT BREAKDOWN (Season ${year})`, MINT);
  const CHART2_H = 68;
  const maxM     = Math.max(1, ...teams.map(t => safeNumber(t.matchesPlayed, 0)));

  fill(HDRFILL2); doc.rect(MX, cy, CW, CHART2_H, 'F');
  [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
    const tx2 = BAR_AREA_X + frac * BAR_AREA_W;
    stroke(GRID); doc.setLineWidth(0.15);
    doc.line(tx2, cy + 2, tx2, cy + CHART2_H - 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(DIM);
    doc.text(String(Math.round(frac * maxM)), tx2, cy + CHART2_H - 4, { align: 'center' });
  });

  teams.forEach((team, i) => {
    const played = safeNumber(team.matchesPlayed, 0);
    const wins   = safeNumber(team.wins, 0);
    const losses = safeNumber(team.losses, 0);
    const nr     = safeNumber(team.noResult, 0);
    const by2    = cy + 6 + i * (barH + barGap);
    const scale  = BAR_AREA_W / maxM;
    const isQ    = team.qualified;
    doc.setFont('helvetica', isQ ? 'bold' : 'normal'); doc.setFontSize(6.5);
    txt(isQ ? tclr(team.shortName || '') : MUTED);
    doc.text((team.shortName || team.name || '?').substring(0, 8), BAR_AREA_X - 2, by2 + barH * 0.72, { align: 'right' });
    let sx = BAR_AREA_X;
    if (wins   > 0) { hBar(sx, by2, wins   * scale, barH, MINT);  sx += wins   * scale; }
    if (losses > 0) { hBar(sx, by2, losses * scale, barH, CORAL); sx += losses * scale; }
    if (nr     > 0) { hBar(sx, by2, nr     * scale, barH, DIM); }
    if (played > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(MUTED);
      doc.text(`${wins}W ${losses}L${nr > 0 ? ` ${nr}NR` : ''}`, BAR_AREA_X + played * scale + 2, by2 + barH * 0.72);
    }
  });

  const L2X = MX + CW - 24;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6); txt(MINT); doc.text('LEGEND', L2X, cy + 8);
  ([[MINT, 'Wins'], [CORAL, 'Losses'], [DIM, 'No Result']] as [RGB, string][]).forEach(([c, l], i) => {
    fill(c); doc.rect(L2X, cy + 12 + i * 6 - 3.5, 4, 3.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(MUTED);
    doc.text(l, L2X + 5.5, cy + 12 + i * 6 - 0.5);
  });
  cy += CHART2_H + 5;

  // ── Chart 3: NRR Diverging Bars ───────────────────────────────────────────────
  cy = sectionTitle(cy, 'CHART 3 — NET RUN RATE (Above / Below Zero)', CORAL);
  const CHART3_H = 62;
  const maxNRR   = Math.max(0.01, ...teams.map(t => Math.abs(safeNumber(t.netRunRate, 0))));
  const CENTER_X = BAR_AREA_X + BAR_AREA_W / 2;
  const HALF_W   = BAR_AREA_W / 2;

  fill(HDRFILL2); doc.rect(MX, cy, CW, CHART3_H, 'F');
  stroke(GRID); doc.setLineWidth(0.4);
  doc.line(CENTER_X, cy + 2, CENTER_X, cy + CHART3_H - 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(DIM);
  doc.text(`-${maxNRR.toFixed(2)}`, CENTER_X - HALF_W, cy + CHART3_H - 4, { align: 'left' });
  doc.text('0', CENTER_X, cy + CHART3_H - 4, { align: 'center' });
  doc.text(`+${maxNRR.toFixed(2)}`, CENTER_X + HALF_W, cy + CHART3_H - 4, { align: 'right' });

  teams.forEach((team, i) => {
    const nrr  = safeNumber(team.netRunRate, 0);
    const bw3  = (Math.abs(nrr) / maxNRR) * HALF_W;
    const by2  = cy + 5 + i * (barH + barGap);
    const isQ  = team.qualified;
    const clr: RGB = nrr >= 0 ? MINT : CORAL;
    doc.setFont('helvetica', isQ ? 'bold' : 'normal'); doc.setFontSize(6.5);
    txt(isQ ? tclr(team.shortName || '') : MUTED);
    doc.text((team.shortName || '?').substring(0, 8), CENTER_X - 2, by2 + barH * 0.72, { align: 'right' });
    if (nrr >= 0) hBar(CENTER_X, by2, Math.max(0.5, bw3), barH, clr, isQ);
    else          hBar(CENTER_X - Math.max(0.5, bw3), by2, Math.max(0.5, bw3), barH, clr, isQ);
    const nrrStr = (nrr >= 0 ? '+' : '') + nrr.toFixed(3);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); txt(clr);
    if (nrr >= 0) doc.text(nrrStr, CENTER_X + bw3 + 2, by2 + barH * 0.72);
    else          doc.text(nrrStr, CENTER_X - bw3 - 2, by2 + barH * 0.72, { align: 'right' });
  });

  const L3X = MX + CW - 28;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6); txt(CORAL); doc.text('LEGEND', L3X, cy + 8);
  ([[MINT, 'Positive NRR'], [CORAL, 'Negative NRR']] as [RGB, string][]).forEach(([c, l], i) => {
    fill(c); doc.rect(L3X, cy + 12 + i * 7 - 3.5, 4, 3.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); txt(MUTED);
    doc.text(l, L3X + 5.5, cy + 12 + i * 7 - 0.5);
  });
  cy += CHART3_H + 6;

  // ── Chart Explanations ────────────────────────────────────────────────────────
  cy = sectionTitle(cy, 'CHART EXPLANATIONS & DATA INSIGHTS', AMBER);

  const writePara = (title: string, body: string, accent: RGB) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); txt(accent);
    doc.text(title, MX, cy); cy += 5.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); txt(WHITE);
    const lines = doc.splitTextToSize(body, CW);
    doc.text(lines, MX, cy);
    cy += lines.length * 4.5 + 4;
  };

  const topPts      = safeNumber(topTeam?.points, 0);
  const bottomTeam  = teams[teams.length - 1];
  const bottomPts   = safeNumber(bottomTeam?.points, 0);
  const ptsDiff     = topPts - bottomPts;
  const bestNRR     = [...teams].sort((a, b) => safeNumber(b.netRunRate, 0) - safeNumber(a.netRunRate, 0))[0];
  const worstNRR    = [...teams].sort((a, b) => safeNumber(a.netRunRate, 0) - safeNumber(b.netRunRate, 0))[0];
  const bestWinRate = [...teams].sort((a, b) => {
    const ra = safeNumber(a.matchesPlayed, 0) > 0 ? safeNumber(a.wins, 0) / safeNumber(a.matchesPlayed, 0) : 0;
    const rb = safeNumber(b.matchesPlayed, 0) > 0 ? safeNumber(b.wins, 0) / safeNumber(b.matchesPlayed, 0) : 0;
    return rb - ra;
  })[0];
  const bwrPct = safeNumber(bestWinRate?.matchesPlayed, 0) > 0
    ? Math.round((safeNumber(bestWinRate.wins, 0) / safeNumber(bestWinRate.matchesPlayed, 0)) * 100) : 0;

  writePara(
    'Chart 1 — Points Comparison',
    `Each horizontal bar represents total league points accumulated by a team in IPL ${year}. ` +
    `Bars are coloured with each team's brand colour; qualified teams are highlighted with a glow. ` +
    `The scale runs from 0 to ${maxPts} points (season maximum). ` +
    `${topTeam?.shortName || topTeam?.name || 'The leader'} topped the table with ${topPts} pts, ` +
    `while ${bottomTeam?.shortName || bottomTeam?.name || 'the bottom team'} finished last with ${bottomPts} pts ` +
    `— a gap of ${ptsDiff} points between 1st and last. Tick marks at 0, 25%, 50%, 75%, 100% of ${maxPts}.`,
    VIOLET
  );

  writePara(
    'Chart 2 — Win / Loss / No Result Breakdown',
    `Each stacked bar shows the composition of matches — Wins (mint), Losses (coral), No Results (grey). ` +
    `A mint-heavy bar indicates a dominant season; a balanced or coral bar indicates struggle. ` +
    `${bestWinRate?.shortName || bestWinRate?.name || 'The top team'} had the best win rate at ${bwrPct}% ` +
    `(${safeNumber(bestWinRate?.wins, 0)}W from ${safeNumber(bestWinRate?.matchesPlayed, 0)} games). ` +
    `Data: wins, losses, no-result counts from IPL ${year} season records.`,
    MINT
  );

  writePara(
    'Chart 3 — Net Run Rate (NRR)',
    `NRR = (runs scored per over) − (runs conceded per over) across all matches. ` +
    `Bars extending right (mint) = positive NRR; bars extending left (coral) = negative. ` +
    `Centre line = NRR 0.000. ` +
    `${bestNRR?.shortName || bestNRR?.name || 'The top team'} led with NRR ` +
    `${(safeNumber(bestNRR?.netRunRate, 0) >= 0 ? '+' : '')}${safeNumber(bestNRR?.netRunRate, 0).toFixed(3)}, ` +
    `while ${worstNRR?.shortName || worstNRR?.name || 'the bottom team'} trailed at ${safeNumber(worstNRR?.netRunRate, 0).toFixed(3)}. ` +
    `NRR is the primary tiebreaker when teams are level on points — a critical metric for playoff qualification.`,
    CORAL
  );

  // Copyright block
  cy += 2;
  fill(HDRFILL2); doc.rect(MX, cy, CW, 12, 'F');
  stroke(VIOLET); doc.setLineWidth(0.4); doc.rect(MX, cy, CW, 12, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); txt(VIOLET);
  doc.text(`© ${new Date().getFullYear()} SportsUp99 — IPL ${year} Points Table Report`, MX + 4, cy + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); txt(DIM);
  doc.text(
    `This report is generated by SportsUp99 admin tools. All IPL data belongs to BCCI / IPL. For internal use only.`,
    MX + 4, cy + 10
  );

  // Re-stamp footers with final page count
  const totalPgs = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPgs; p++) {
    doc.setPage(p);
    paintFooter(p, totalPgs);
  }

  const pdfBlob = doc.output('blob');
  downloadBlob(pdfBlob, `ipl-points-table-${year}${filtered ? '-filtered' : ''}.pdf`);
}

/**
 * Export points table to database format (JSON)
 */
export function exportPointsTableToDatabase(data: PointsTableExportData): void {
  const { teams, year, filtered, searchTerm, sortBy } = data;
  
  if (teams.length === 0) {
    alert('No data to export');
    return;
  }

  const timestamp = new Date().toISOString();
  
  // Transform data for database format
  const dbRecords: DatabaseExportRecord[] = teams.map((team, index) => ({
    id: `${year}-${team.id}`,
    team_name: team.name,
    team_short_name: team.shortName,
    season_year: year,
    matches_played: team.matchesPlayed,
    wins: team.wins,
    losses: team.losses,
    no_result: team.noResult,
    points: team.points,
    net_run_rate: team.netRunRate,
    qualified: team.qualified,
    export_timestamp: timestamp,
    data_source: 'ipl-admin-points-table',
    rank: index + 1
  }));

  // Create export object with metadata
  const exportData = {
    metadata: {
      export_type: 'points_table_database_export',
      season_year: year,
      export_timestamp: timestamp,
      total_records: teams.length,
      filtered: filtered,
      search_term: searchTerm || null,
      sort_by: sortBy,
      source: 'ipl-admin-points-table'
    },
    data: dbRecords
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `ipl-points-table-${year}${filtered ? '-filtered' : ''}-database.json`, 'application/json');
}

/**
 * Export all formats at once (ZIP file would require additional library)
 */
export function exportPointsTableAllFormats(data: PointsTableExportData): void {
  // For now, export formats one by one
  // In a future enhancement, we could use JSZip to bundle all formats
  exportPointsTableToCSV(data);
  setTimeout(() => exportPointsTableToExcel(data), 500);
  setTimeout(() => exportPointsTableToPDF(data), 1000);
  setTimeout(() => exportPointsTableToDatabase(data), 1500);
}

/**
 * Helper function to download files
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.setAttribute('rel', 'noopener');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();

  // Give the browser time to start the download before revoking.
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(baseName: string, year: number, format: string, filtered?: boolean): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filterSuffix = filtered ? '-filtered' : '';
  return `${baseName}-${year}${filterSuffix}-${timestamp}.${format}`;
}

/**
 * Validate export data
 */
export function validateExportData(data: PointsTableExportData): boolean {
  if (!data || !data.teams || !Array.isArray(data.teams)) {
    return false;
  }
  
  if (!data.year || data.year < 2008 || data.year > new Date().getFullYear() + 1) {
    return false;
  }
  
  return true;
}

/**
 * Get export statistics
 */
export function getExportStatistics(data: PointsTableExportData): {
  totalTeams: number;
  qualifiedTeams: number;
  totalPoints: number;
  averageNRR: number;
  completeTeams: number;
} {
  const { teams } = data;
  
  const qualifiedTeams = teams.filter(t => t.qualified).length;
  const totalPoints = teams.reduce((sum, t) => sum + (t.points || 0), 0);
  const validNRR = teams.filter(t => t.netRunRate !== null).map(t => t.netRunRate!);
  const averageNRR = validNRR.length > 0 ? validNRR.reduce((sum, nrr) => sum + nrr, 0) / validNRR.length : 0;
  const completeTeams = teams.filter(t => 
    t.matchesPlayed !== null && 
    t.wins !== null && 
    t.losses !== null && 
    t.points !== null
  ).length;
  
  return {
    totalTeams: teams.length,
    qualifiedTeams,
    totalPoints,
    averageNRR: parseFloat(averageNRR.toFixed(3)),
    completeTeams
  };
}
