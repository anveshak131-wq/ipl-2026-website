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
 * Export points table to PDF format
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

  // ── Dark Palette ──────────────────────────────────────────────────────────────
  const C_BG:      [number, number, number] = [8,   10,  18];
  const C_BGHDR:   [number, number, number] = [14,  19,  33];
  const C_ROW1:    [number, number, number] = [14,  18,  30];
  const C_ROW2:    [number, number, number] = [20,  25,  42];
  const C_QUAL:    [number, number, number] = [10,  30,  20];
  const C_GRID:    [number, number, number] = [35,  45,  75];
  const C_GOLD:    [number, number, number] = [245, 158, 11];
  const C_RED:     [number, number, number] = [239,  68, 68];
  const C_WHITE:   [number, number, number] = [230, 235, 255];
  const C_MUTED:   [number, number, number] = [110, 120, 155];
  const C_GREEN:   [number, number, number] = [52,  211, 153];
  const C_REDTXT:  [number, number, number] = [248, 113, 113];
  const C_EMERALD: [number, number, number] = [16,  185, 129];

  // Team brand colours
  const TEAM_COLORS: Record<string, [number, number, number]> = {
    MI:   [80,  140, 220],  CSK:  [252, 210,  50],  RCB:  [240,  90,  90],
    KKR:  [160, 100, 220],  SRH:  [255, 140,  40],  DC:   [80,  140, 220],
    PBKS: [220,  60,  60],  RR:   [240, 100, 160],  GT:   [100, 180, 200],
    LSG:  [80,  200, 180],  DD:   [80,  140, 220],  KTK:  [160, 100, 220],
    PWI:  [220,  60,  60],  DEC:  [255, 140,  40],  COC:  [100, 180, 200],
    RPS:  [240, 100, 160]
  };
  const teamColor = (shortName: string): [number, number, number] =>
    TEAM_COLORS[(shortName || '').toUpperCase().trim()] ?? C_GOLD;

  // Portrait A4
  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const MX = 12;
  const HDR_H = 32;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const paintBg = () => {
    doc.setFillColor(C_BG[0], C_BG[1], C_BG[2]);
    doc.rect(0, 0, PW, PH, 'F');
  };

  const paintHeader = () => {
    // Header bg
    doc.setFillColor(C_BGHDR[0], C_BGHDR[1], C_BGHDR[2]);
    doc.rect(0, 0, PW, HDR_H, 'F');
    // Gold top rule
    doc.setFillColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.rect(0, 0, PW, 1.5, 'F');
    // Gold left accent stripe
    doc.setFillColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.rect(0, 0, 4, HDR_H, 'F');
    // Red right accent stripe
    doc.setFillColor(C_RED[0], C_RED[1], C_RED[2]);
    doc.rect(PW - 4, 0, 4, HDR_H, 'F');
    // Bottom separator
    doc.setFillColor(C_GRID[0], C_GRID[1], C_GRID[2]);
    doc.rect(0, HDR_H - 0.5, PW, 0.5, 'F');

    // Left: "IPL" + year
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.text('IPL', MX + 4, HDR_H / 2 + 3);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text(String(year), MX + 22, HDR_H / 2 + 3);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text('INDIAN PREMIER LEAGUE', MX + 4, HDR_H / 2 + 8.5);

    // Right: "POINTS TABLE"
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text('POINTS TABLE', PW - MX - 4, HDR_H / 2 + 3, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`Season ${year}`, PW - MX - 4, HDR_H / 2 + 8.5, { align: 'right' });
  };

  const paintFooter = (pageNum: number, totalPages: number) => {
    const FY = PH - 8;
    doc.setFillColor(C_BGHDR[0], C_BGHDR[1], C_BGHDR[2]);
    doc.rect(0, FY - 2, PW, 10, 'F');
    doc.setFillColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.rect(0, FY - 2, PW, 0.6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`IPL ${year} · Points Table`, MX, FY + 3);
    doc.text(`Page ${pageNum} / ${totalPages}`, PW - MX, FY + 3, { align: 'right' });
    doc.text(new Date().toLocaleString(), PW / 2, FY + 3, { align: 'center' });
  };

  // ── First page ────────────────────────────────────────────────────────────────
  paintBg();
  paintHeader();

  let cursorY = HDR_H + 7;

  // ── Stat badges ───────────────────────────────────────────────────────────────
  const totalTeams = teams.length;
  const qualifiedCount = teams.filter(t => t.qualified).length;
  const topTeam = teams[0]; // already sorted by points→NRR

  interface Badge { label: string; value: string; accent: [number, number, number] }
  const badges: Badge[] = [
    { label: 'TOTAL TEAMS', value: String(totalTeams),   accent: C_GOLD },
    { label: 'QUALIFIED',   value: String(qualifiedCount), accent: C_EMERALD },
    { label: 'SEASON',      value: String(year),          accent: [80, 140, 220] },
    { label: 'LEADER',      value: topTeam?.shortName || topTeam?.name || '—',
      accent: teamColor(topTeam?.shortName || '') }
  ];

  const badgeW = (PW - MX * 2 - 9) / 4;
  const badgeH = 16;
  badges.forEach((b, i) => {
    const bx = MX + i * (badgeW + 3);
    doc.setFillColor(C_BGHDR[0], C_BGHDR[1], C_BGHDR[2]);
    doc.roundedRect(bx, cursorY, badgeW, badgeH, 1.5, 1.5, 'F');
    // Left colour pip
    doc.setFillColor(b.accent[0], b.accent[1], b.accent[2]);
    doc.roundedRect(bx, cursorY, 3, badgeH, 1, 1, 'F');
    // Label
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(b.accent[0], b.accent[1], b.accent[2]);
    doc.text(b.label, bx + 5.5, cursorY + 5);
    // Value
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text(b.value, bx + 5.5, cursorY + 12.5);
  });

  cursorY += badgeH + 5;

  // Filter notice
  if (filtered || searchTerm) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    const note = filtered
      ? `Filtered Results${searchTerm ? ` — "${searchTerm}"` : ''}`
      : `Search: "${searchTerm}"`;
    doc.text(note, MX, cursorY);
    cursorY += 5;
  }

  // ── Table ─────────────────────────────────────────────────────────────────────
  const tableHeaders = ['#', 'Team', 'M', 'W', 'L', 'NR', 'Pts', 'NRR', 'Status'];
  const tableBody = teams.map((team, idx) => {
    const nrr = safeNumber(team.netRunRate, 0);
    const nrrStr = nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3);
    return [
      String(idx + 1),
      team.shortName || team.name || '—',
      String(safeNumber(team.matchesPlayed, 0)),
      String(safeNumber(team.wins, 0)),
      String(safeNumber(team.losses, 0)),
      String(safeNumber(team.noResult, 0)),
      String(safeNumber(team.points, 0)),
      nrrStr,
      team.qualified ? 'Qualified' : '—'
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: cursorY,
    margin: { top: HDR_H + 7, left: MX, right: MX, bottom: 14 },
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      lineWidth: 0.18,
      lineColor: C_GRID,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: C_BGHDR,
      textColor: C_GOLD,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 }
    },
    alternateRowStyles: { fillColor: C_ROW2 },
    columnStyles: {
      0: { cellWidth: 11, halign: 'center' },   // #
      1: { cellWidth: 32, halign: 'left'   },   // Team
      2: { cellWidth: 14, halign: 'center' },   // M
      3: { cellWidth: 14, halign: 'center' },   // W
      4: { cellWidth: 14, halign: 'center' },   // L
      5: { cellWidth: 14, halign: 'center' },   // NR
      6: { cellWidth: 16, halign: 'center' },   // Pts
      7: { cellWidth: 25, halign: 'center' },   // NRR
      8: { cellWidth: 32, halign: 'center' }    // Status
    },
    didParseCell: (cellData: any) => {
      if (cellData.section === 'body') {
        const rowIdx = cellData.row.index;
        const colIdx = cellData.column.index;
        const team = teams[rowIdx];
        const isQual = team?.qualified;

        // Row background
        cellData.cell.styles.fillColor = isQual ? C_QUAL : (rowIdx % 2 === 0 ? C_ROW1 : C_ROW2);
        cellData.cell.styles.textColor = C_WHITE;
        cellData.cell.styles.fontStyle = 'normal';

        // Rank column
        if (colIdx === 0) {
          cellData.cell.styles.textColor = isQual ? C_GOLD : C_MUTED;
          if (isQual) cellData.cell.styles.fontStyle = 'bold';
        }
        // Team name: brand colour + bold
        if (colIdx === 1) {
          cellData.cell.styles.textColor = teamColor(team?.shortName || '');
          cellData.cell.styles.fontStyle = 'bold';
        }
        // Points: gold for qualified
        if (colIdx === 6 && isQual) {
          cellData.cell.styles.textColor = C_GOLD;
          cellData.cell.styles.fontStyle = 'bold';
        }
        // NRR: green/red
        if (colIdx === 7) {
          const nrr = safeNumber(team?.netRunRate, 0);
          cellData.cell.styles.textColor = nrr >= 0 ? C_GREEN : C_REDTXT;
          cellData.cell.styles.fontStyle = 'bold';
        }
        // Status: emerald / muted
        if (colIdx === 8) {
          if (isQual) {
            cellData.cell.styles.textColor = C_EMERALD;
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = C_MUTED;
          }
        }
      }
    },
    willDrawPage: (pd: any) => {
      paintBg();
      if (pd.pageNumber > 1) paintHeader();
    },
    didDrawPage: (pd: any) => {
      const totalPages = doc.internal.getNumberOfPages();
      paintFooter(pd.pageNumber, totalPages);
    }
  });

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
