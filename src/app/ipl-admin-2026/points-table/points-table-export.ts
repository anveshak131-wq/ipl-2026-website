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

const loadLogoDataUrl = async (path: string, targetWidth: number, targetHeight: number): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(path, { cache: 'force-cache' });
    if (!res.ok) return null;
    const svgText = await res.text();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';

    const dataUrl = await new Promise<string | null>((resolve) => {
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth * scale;
        canvas.height = targetHeight * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });

    return dataUrl;
  } catch {
    return null;
  }
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
  const zeroY = chartY + chartHeight / 2;
  const maxAbs = Math.max(...series.map((s) => Math.abs(s.value)), 1);
  const barGap = 2;
  const barWidth = chartWidth / Math.max(series.length, 1) - barGap;

  doc.setDrawColor(200);
  doc.line(chartX, zeroY, chartX + chartWidth, zeroY);

  series.forEach((item, index) => {
    const barHeight = Math.max(1, (Math.abs(item.value) / maxAbs) * (chartHeight / 2 - 2));
    const barX = chartX + index * (barWidth + barGap);
    const barY = item.value >= 0 ? zeroY - barHeight : zeroY;

    const [r, g, b] = item.value >= 0 ? positiveColor : negativeColor;
    doc.setFillColor(r, g, b);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    doc.setFontSize(6);
    doc.setTextColor(80);
    doc.text(item.label, barX + barWidth / 2, chartY + chartHeight + 4, { align: 'center' });

    const valueLabel = item.valueLabel ?? (item.value >= 0 ? `+${item.value}` : String(item.value));
    doc.setTextColor(60);
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

  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background design (soft gradient bands + accents)
  doc.setFillColor(243, 246, 251);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(232, 238, 246);
  doc.rect(0, 0, pageWidth, pageHeight * 0.45, 'F');
  doc.setFillColor(236, 244, 252);
  doc.rect(0, pageHeight * 0.45, pageWidth, pageHeight * 0.55, 'F');
  doc.setFillColor(226, 232, 240);
  doc.circle(pageWidth - 22, pageHeight - 18, 16, 'F');
  doc.setFillColor(219, 234, 254);
  doc.circle(20, pageHeight - 12, 12, 'F');
  doc.setFillColor(224, 231, 245);
  doc.triangle(pageWidth * 0.7, 0, pageWidth, 0, pageWidth, pageHeight * 0.28, 'F');

  // Header band
  const headerHeight = 24;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth * 0.65, headerHeight, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.6);
  doc.line(0, headerHeight, pageWidth, headerHeight);

  // Add custom font for better appearance
  doc.setFont('helvetica');

  // Header content (text-only, no logo)
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('SportsUP18 Admin', 10, 12);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`IPL Points Table - Season ${year}`, pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('Generated by SportsUP18', pageWidth - 12, 9, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text('Confidential • Admin Use Only', pageWidth - 12, 15, { align: 'right' });

  const bodyTextColor: [number, number, number] = [15, 23, 42];
  const mutedTextColor: [number, number, number] = [71, 85, 105];

  // Metadata below header
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  const metadataY = headerHeight + 6;
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, metadataY, { align: 'center' });
  if (filtered) {
    doc.setTextColor(185, 28, 28);
    doc.text('(Filtered Results)', pageWidth / 2, metadataY + 5, { align: 'center' });
  }
  if (searchTerm) {
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(`Search Term: ${searchTerm}`, pageWidth / 2, metadataY + 10, { align: 'center' });
  }

  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = metadataY + (searchTerm ? 14 : filtered ? 10 : 6);

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
  const winRateSeries = [...teams]
    .map((team) => {
      const played = safeNumber(team.matchesPlayed, 0);
      const wins = safeNumber(team.wins, 0);
      const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
      const rawLabel = team.shortName || team.name || 'Team';
      const label = rawLabel.length > 7 ? rawLabel.slice(0, 7) : rawLabel;
      return { label, value: winRate, valueLabel: `${winRate}%` };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, chartLimit);

  const nrrSeries: ChartSeries[] = [...teams]
    .map((team) => {
      const nrr = safeNumber(team.netRunRate, 0);
      const rawLabel = team.shortName || team.name || 'Team';
      const label = rawLabel.length > 7 ? rawLabel.slice(0, 7) : rawLabel;
      const valueLabel = nrr >= 0 ? `+${nrr.toFixed(2)}` : nrr.toFixed(2);
      return { label, value: Number(nrr.toFixed(2)), valueLabel };
    })
    .sort((a, b) => b.value - a.value);

  drawBarChart(doc, marginX, cursorY, chartWidth, chartHeight, 'Top Points', pointsSeries, [37, 99, 235]);
  drawBarChart(doc, marginX + chartWidth + chartGap, cursorY, chartWidth, chartHeight, 'Top Win %', winRateSeries, [16, 185, 129]);
  drawDivergingBarChart(
    doc,
    marginX + (chartWidth + chartGap) * 2,
    cursorY,
    chartWidth,
    chartHeight,
    'Net Run Rate',
    nrrSeries,
    [59, 130, 246],
    [239, 68, 68]
  );

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
      lineColor: [200, 200, 200],
      textColor: bodyTextColor,
      fillColor: [248, 250, 252]
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
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.row.index < 4) {
        data.cell.styles.fillColor = [255, 247, 214]; // Soft gold
        data.cell.styles.textColor = [30, 41, 59]; // Slate-800
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Add footer
  const finalY = (doc as any).lastAutoTable.finalY || cursorY + 40;
  const footerY = Math.min(finalY + 10, pageHeight - 8);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Total Teams: ${teams.length}`, 14, footerY);
  doc.text(`Page 1 of 1`, pageWidth - 14, footerY, { align: 'right' });

  // Copyright notice
  const copyrightYear = new Date().getFullYear();
  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text(`© ${copyrightYear} SportsUP18. Admin-only. Unauthorized use prohibited.`, pageWidth / 2, pageHeight - 4, { align: 'center' });

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
