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
  doc.setFillColor(247, 249, 252);
  doc.setDrawColor(224, 230, 238);
  doc.rect(x, y, width, height, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text(title, x + 4, y + 5);

  doc.setFontSize(12);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(value, x + 4, y + 11);
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
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(224, 230, 238);
  doc.rect(x, y, width, height, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(title, x + 4, y + 6);

  const chartX = x + 4;
  const chartY = y + 8;
  const chartHeight = height - 16;
  const chartWidth = width - 8;

  const maxValue = Math.max(...series.map((s) => s.value), 1);
  const barGap = 2;
  const barWidth = chartWidth / Math.max(series.length, 1) - barGap;

  doc.setDrawColor(200);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  series.forEach((item, index) => {
    const barHeight = Math.max(2, (item.value / maxValue) * (chartHeight - 4));
    const barX = chartX + index * (barWidth + barGap);
    const barY = chartY + chartHeight - barHeight;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    doc.setFontSize(6);
    doc.setTextColor(80);
    doc.text(item.label, barX + barWidth / 2, chartY + chartHeight + 4, { align: 'center' });
    if (barHeight > 6) {
      doc.setTextColor(255);
      doc.text(item.valueLabel ?? String(item.value), barX + barWidth / 2, barY + 3, { align: 'center' });
    }
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

  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add custom font for better appearance
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185); // Blue color
  doc.text(`IPL Points Table - Season ${year}`, pageWidth / 2, 18, { align: 'center' });
  
  if (filtered) {
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0); // Red for filtered
    doc.text('(Filtered Results)', pageWidth / 2, 26, { align: 'center' });
  }
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 34, { align: 'center' });
  if (searchTerm) {
    doc.text(`Search Term: ${searchTerm}`, pageWidth / 2, 40, { align: 'center' });
  }

  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = searchTerm ? 44 : 40;

  // Summary stats
  const totalTeams = teams.length;
  const qualifiedTeams = teams.filter(t => t.qualified).length;
  const avgNRR =
    teams.length > 0
      ? teams.reduce((sum, t) => sum + safeNumber(t.netRunRate, 0), 0) / teams.length
      : 0;
  const topTeam = [...teams].sort((a, b) => {
    const pointsDiff = safeNumber(b.points, 0) - safeNumber(a.points, 0);
    if (pointsDiff !== 0) return pointsDiff;
    return safeNumber(b.netRunRate, 0) - safeNumber(a.netRunRate, 0);
  })[0];

  const statCardHeight = 14;
  const statGap = 4;
  const statWidth = (contentWidth - statGap * 3) / 4;
  const stats = [
    { title: 'Total Teams', value: String(totalTeams), color: [59, 130, 246] as [number, number, number] },
    { title: 'Qualified', value: String(qualifiedTeams), color: [16, 185, 129] as [number, number, number] },
    { title: 'Avg NRR', value: avgNRR.toFixed(3), color: [234, 179, 8] as [number, number, number] },
    { title: 'Top Team', value: topTeam?.shortName || topTeam?.name || '-', color: [220, 38, 38] as [number, number, number] }
  ];

  stats.forEach((stat, index) => {
    const x = marginX + index * (statWidth + statGap);
    drawStatCard(doc, x, cursorY, statWidth, statCardHeight, stat.title, stat.value, stat.color);
  });

  cursorY += statCardHeight + 6;

  // Charts
  const chartHeight = 34;
  const chartGap = 6;
  const chartWidth = (contentWidth - chartGap * 2) / 3;
  const chartLimit = Math.min(teams.length, 6);

  const pointsSeries = getTopSeries(teams, (t) => safeNumber(t.points, 0), chartLimit);
  const winsSeries = getTopSeries(teams, (t) => safeNumber(t.wins, 0), chartLimit);
  const qualificationSeries: ChartSeries[] = [
    { label: 'Qualified', value: qualifiedTeams, valueLabel: String(qualifiedTeams) },
    { label: 'Not Qual.', value: Math.max(totalTeams - qualifiedTeams, 0), valueLabel: String(Math.max(totalTeams - qualifiedTeams, 0)) }
  ];

  drawBarChart(doc, marginX, cursorY, chartWidth, chartHeight, 'Top Points', pointsSeries, [37, 99, 235]);
  drawBarChart(doc, marginX + chartWidth + chartGap, cursorY, chartWidth, chartHeight, 'Top Wins', winsSeries, [16, 185, 129]);
  drawBarChart(doc, marginX + (chartWidth + chartGap) * 2, cursorY, chartWidth, chartHeight, 'Qualification Split', qualificationSeries, [234, 88, 12]);

  cursorY += chartHeight + 8;

  // Table headers
  const headers = [
    'Rank',
    'Team',
    'Played',
    'Won',
    'Lost',
    'NR',
    'Points',
    'NRR',
    'Qualified'
  ];

  // Table data
  const tableData = teams.map((team, index) => [
    index + 1,
    team.shortName,
    team.matchesPlayed || 0,
    team.wins || 0,
    team.losses || 0,
    team.noResult || 0,
    team.points || 0,
    team.netRunRate !== null ? team.netRunRate.toFixed(3) : '0.000',
    team.qualified ? 'Yes' : 'No'
  ]);

  // Add table using autoTable
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: cursorY,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' }, // Rank
      1: { cellWidth: 40, halign: 'left' },  // Team
      2: { cellWidth: 20, halign: 'center' }, // Played
      3: { cellWidth: 15, halign: 'center' }, // Won
      4: { cellWidth: 15, halign: 'center' }, // Lost
      5: { cellWidth: 15, halign: 'center' }, // NR
      6: { cellWidth: 20, halign: 'center' }, // Points
      7: { cellWidth: 25, halign: 'center' }, // NRR
      8: { cellWidth: 25, halign: 'center' }  // Qualified
    },
    didDrawCell: (data: any) => {
      // Highlight top 4 teams (playoff qualifiers)
      if (data.section === 'body' && data.row.index < 4) {
        doc.setFillColor(255, 215, 0, 0.1); // Light gold background
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      }
    }
  });

  // Add footer
  const finalY = (doc as any).lastAutoTable.finalY || cursorY + 40;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Total Teams: ${teams.length}`, 14, finalY + 10);
  doc.text(`Page 1 of 1`, 280, finalY + 10, { align: 'right' });

  // Save the PDF using a blob for better browser compatibility
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
