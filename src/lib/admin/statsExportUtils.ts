import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type RGB = [number, number, number];

interface ExportPlayer {
  id?: string | number;
  name?: string;
  role?: string;
  allrounderType?: string;
  teamId?: string | number;
  league?: string;
  age?: string | number;
  dateOfBirth?: string;
  nationality?: string;
  jerseyNumber?: string | number;
  isCaptain?: boolean;
  bowlingStyle?: string;
  battingStyle?: string;
  transferInfo?: {
    acquiredVia?: string;
    transferFee?: string | number;
    notes?: string;
    lastAuctionYear?: string | number;
  };
  stats?: Record<string, unknown>;
}

interface ExportTeam {
  id?: string | number;
  name?: string;
  shortName?: string;
}

type ExportKind = 'batting' | 'bowling';

interface ExportOptions {
  kind: ExportKind;
  league: string;
  teamLabel: string;
  searchQuery: string;
}

interface ExportRow {
  id: string;
  name: string;
  role: string;
  allrounderType: string;
  teamId: string;
  teamName: string;
  teamShortName: string;
  league: string;
  age: number | string;
  dateOfBirth: string;
  nationality: string;
  jerseyNumber: number | string;
  isCaptain: string;
  battingStyle: string;
  bowlingStyle: string;
  matches: number;
  battingInnings: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
  highest: number | string;
  battingAverage: string;
  battingStrikeRate: string;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  bowlingInnings: number;
  balls: number;
  overs: string;
  maidens: number;
  wickets: number;
  runsConceded: number;
  bowlingAverage: string;
  bowlingStrikeRate: string;
  economy: string;
  bestBowling: string;
  fiveWickets: number;
  transferAcquiredVia: string;
  transferFee: number | string;
  transferNotes: string;
  lastAuctionYear: number | string;
}

type Column = readonly [string, keyof ExportRow];

const formatNumber = (value: unknown, digits = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return digits > 0 ? Number(0).toFixed(digits) : '0';
  return parsed.toFixed(digits);
};

const escapeSql = (value: unknown) => String(value ?? '').replace(/'/g, "''");

const getTeamMeta = (teams: ExportTeam[], teamId: string) =>
  teams.find((team) => String(team.id) === String(teamId));

const getBattingAverage = (player: ExportPlayer) => {
  const raw = player.stats?.battingAverage;
  if (raw && raw !== '0' && raw !== '-') return String(raw);
  if (Number(player.stats?.average) > 0) return formatNumber(player.stats?.average, 2);
  const runs = Number(player.stats?.runs) || 0;
  const innings = Number(player.stats?.battingInnings) || 0;
  const notOuts = Number(player.stats?.notOuts) || 0;
  const dismissals = innings - notOuts;
  return dismissals > 0 && runs > 0 ? formatNumber(runs / dismissals, 2) : '-';
};

const getBattingStrikeRate = (player: ExportPlayer) => {
  const raw = player.stats?.battingStrikeRate;
  if (raw && raw !== '0' && raw !== '-') return String(raw);
  if (Number(player.stats?.strikeRate) > 0) return formatNumber(player.stats?.strikeRate, 1);
  const runs = Number(player.stats?.runs) || 0;
  const ballsFaced = Number(player.stats?.ballsFaced) || 0;
  return ballsFaced > 0 && runs > 0 ? formatNumber((runs * 100) / ballsFaced, 1) : '-';
};

const getBowlingAverage = (player: ExportPlayer) => {
  const raw = player.stats?.bowlingAverage;
  if (typeof raw === 'string' && raw !== '0' && raw !== '-') return raw;
  if (typeof raw === 'number' && raw > 0) return formatNumber(raw, 2);
  const wickets = Number(player.stats?.wickets) || 0;
  const runsConceded = Number(player.stats?.runsConceded) || 0;
  return wickets > 0 ? formatNumber(runsConceded / wickets, 2) : '-';
};

const getBowlingStrikeRate = (player: ExportPlayer) => {
  const raw = player.stats?.bowlingStrikeRate;
  if (raw && raw !== '0' && raw !== '-') return String(raw);
  const wickets = Number(player.stats?.wickets) || 0;
  const balls = Number(player.stats?.balls) || 0;
  return wickets > 0 && balls > 0 ? formatNumber(balls / wickets, 1) : '-';
};

const getEconomy = (player: ExportPlayer) => {
  const raw = player.stats?.economy;
  if (typeof raw === 'string' && raw !== '0' && raw !== '-') return raw;
  if (typeof raw === 'number' && raw > 0) return formatNumber(raw, 2);
  const balls = Number(player.stats?.balls) || 0;
  const runsConceded = Number(player.stats?.runsConceded) || 0;
  return balls > 0 ? formatNumber((runsConceded * 6) / balls, 2) : '-';
};

const toOvers = (ballsValue: unknown) => {
  const balls = Number(ballsValue) || 0;
  return `${Math.floor(balls / 6)}.${balls % 6}`;
};

const buildExportRows = (players: ExportPlayer[], teams: ExportTeam[]): ExportRow[] =>
  players.map((player) => {
    const team = getTeamMeta(teams, String(player.teamId ?? ''));
    const transferInfo = player.transferInfo || {};

    return {
      id: String(player.id ?? ''),
      name: player.name || '',
      role: player.role || '',
      allrounderType: player.allrounderType || '',
      teamId: String(player.teamId ?? ''),
      teamName: team?.name || 'Unknown',
      teamShortName: team?.shortName || 'Unknown',
      league: player.league || 'ipl',
      age: player.age ?? '',
      dateOfBirth: player.dateOfBirth || '',
      nationality: player.nationality || '',
      jerseyNumber: player.jerseyNumber ?? '',
      isCaptain: player.isCaptain ? 'Yes' : 'No',
      battingStyle: player.battingStyle || '',
      bowlingStyle: player.bowlingStyle || '',
      matches: Number(player.stats?.matches) || 0,
      battingInnings: Number(player.stats?.battingInnings) || 0,
      notOuts: Number(player.stats?.notOuts) || 0,
      runs: Number(player.stats?.runs) || 0,
      ballsFaced: Number(player.stats?.ballsFaced) || 0,
      highest: (player.stats?.highest as string | number) ?? '',
      battingAverage: getBattingAverage(player),
      battingStrikeRate: getBattingStrikeRate(player),
      fours: Number(player.stats?.fours) || 0,
      sixes: Number(player.stats?.sixes) || 0,
      fifties: Number(player.stats?.fifties) || 0,
      hundreds: Number(player.stats?.hundreds) || 0,
      bowlingInnings: Number(player.stats?.bowlingInnings) || 0,
      balls: Number(player.stats?.balls) || 0,
      overs: toOvers(player.stats?.balls),
      maidens: Number(player.stats?.maidens) || 0,
      wickets: Number(player.stats?.wickets) || 0,
      runsConceded: Number(player.stats?.runsConceded) || 0,
      bowlingAverage: getBowlingAverage(player),
      bowlingStrikeRate: getBowlingStrikeRate(player),
      economy: getEconomy(player),
      bestBowling: String(player.stats?.bestBowling || ''),
      fiveWickets: Number(player.stats?.fiveWickets) || 0,
      transferAcquiredVia: String(transferInfo.acquiredVia || ''),
      transferFee: transferInfo.transferFee ?? '',
      transferNotes: transferInfo.notes || '',
      lastAuctionYear: transferInfo.lastAuctionYear ?? ''
    };
  });

const battingColumns: readonly Column[] = [
  ['ID', 'id'],
  ['Name', 'name'],
  ['Role', 'role'],
  ['All-rounder Type', 'allrounderType'],
  ['Team ID', 'teamId'],
  ['Team Name', 'teamName'],
  ['Team Short Name', 'teamShortName'],
  ['League', 'league'],
  ['Age', 'age'],
  ['Date of Birth', 'dateOfBirth'],
  ['Nationality', 'nationality'],
  ['Jersey Number', 'jerseyNumber'],
  ['Captain', 'isCaptain'],
  ['Batting Style', 'battingStyle'],
  ['Bowling Style', 'bowlingStyle'],
  ['Matches', 'matches'],
  ['Batting Innings', 'battingInnings'],
  ['Not Outs', 'notOuts'],
  ['Runs', 'runs'],
  ['Balls Faced', 'ballsFaced'],
  ['Highest Score', 'highest'],
  ['Batting Average', 'battingAverage'],
  ['Batting Strike Rate', 'battingStrikeRate'],
  ['Fours', 'fours'],
  ['Sixes', 'sixes'],
  ['Fifties', 'fifties'],
  ['Hundreds', 'hundreds'],
  ['Transfer Acquired Via', 'transferAcquiredVia'],
  ['Transfer Fee', 'transferFee'],
  ['Transfer Notes', 'transferNotes'],
  ['Last Auction Year', 'lastAuctionYear']
] as const;

const bowlingColumns: readonly Column[] = [
  ['ID', 'id'],
  ['Name', 'name'],
  ['Role', 'role'],
  ['All-rounder Type', 'allrounderType'],
  ['Team ID', 'teamId'],
  ['Team Name', 'teamName'],
  ['Team Short Name', 'teamShortName'],
  ['League', 'league'],
  ['Age', 'age'],
  ['Date of Birth', 'dateOfBirth'],
  ['Nationality', 'nationality'],
  ['Jersey Number', 'jerseyNumber'],
  ['Captain', 'isCaptain'],
  ['Batting Style', 'battingStyle'],
  ['Bowling Style', 'bowlingStyle'],
  ['Matches', 'matches'],
  ['Bowling Innings', 'bowlingInnings'],
  ['Balls', 'balls'],
  ['Overs', 'overs'],
  ['Maidens', 'maidens'],
  ['Wickets', 'wickets'],
  ['Runs Conceded', 'runsConceded'],
  ['Bowling Average', 'bowlingAverage'],
  ['Bowling Strike Rate', 'bowlingStrikeRate'],
  ['Economy', 'economy'],
  ['Best Bowling', 'bestBowling'],
  ['Five Wickets', 'fiveWickets'],
  ['Transfer Acquired Via', 'transferAcquiredVia'],
  ['Transfer Fee', 'transferFee'],
  ['Transfer Notes', 'transferNotes'],
  ['Last Auction Year', 'lastAuctionYear']
] as const;

const getColumns = (kind: ExportKind): readonly Column[] => (kind === 'batting' ? battingColumns : bowlingColumns);

const downloadBlob = (content: BlobPart, mimeType: string, filename: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const buildCsv = (rows: ExportRow[], kind: ExportKind) => {
  const columns = getColumns(kind);
  const header = columns.map(([label]) => `"${label}"`).join(',');
  const body = rows.map((row) =>
    columns
      .map(([, key]) => `"${String(row[key as keyof ExportRow] ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...body].join('\n');
};

const buildSql = (rows: ExportRow[], kind: ExportKind) => {
  const tableName = kind === 'batting' ? 'batting_stats_export' : 'bowling_stats_export';
  const columns = getColumns(kind);
  const columnNames = columns.map(([, key]) => key).join(', ');
  const values = rows.map((row) => {
    const tuple = columns.map(([, key]) => `'${escapeSql(row[key as keyof ExportRow])}'`).join(', ');
    return `(${tuple})`;
  });

  return [
    `-- ${kind === 'batting' ? 'Batting' : 'Bowling'} stats export generated on ${new Date().toISOString()}`,
    `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.map(([, key]) => `${key} TEXT`).join(', ')});`,
    `DELETE FROM ${tableName};`,
    values.length ? `INSERT INTO ${tableName} (${columnNames}) VALUES\n${values.join(',\n')};` : `-- No rows matched current filters.`
  ].join('\n\n');
};

const buildFilename = (kind: ExportKind, format: 'pdf' | 'csv' | 'sql', options: ExportOptions) => {
  const date = new Date().toISOString().split('T')[0];
  const teamSegment = options.teamLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'all-teams';
  return `${options.league}-${kind}-stats-${teamSegment}-${date}.${format}`;
};

const buildPdf = (rows: ExportRow[], options: ExportOptions) => {
  try {
    console.log('Building PDF with rows:', rows.length, 'options:', options);
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const isBatting = options.kind === 'batting';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    console.log('PDF document created, dimensions:', { pageWidth, pageHeight });
  const palette = isBatting
    ? {
        bg: [13, 20, 27] as RGB,
        panel: [25, 38, 46] as RGB,
        accent: [60, 110, 113] as RGB,
        accentSoft: [176, 138, 82] as RGB,
        text: [235, 238, 240] as RGB,
        muted: [160, 171, 178] as RGB,
        grid: [49, 68, 78] as RGB
      }
    : {
        bg: [20, 18, 15] as RGB,
        panel: [38, 34, 28] as RGB,
        accent: [111, 119, 74] as RGB,
        accentSoft: [171, 105, 68] as RGB,
        text: [242, 239, 233] as RGB,
        muted: [182, 176, 164] as RGB,
        grid: [82, 72, 59] as RGB
      };

  const setFill = (color: RGB) => doc.setFillColor(color[0], color[1], color[2]);
  const setText = (color: RGB) => doc.setTextColor(color[0], color[1], color[2]);
  const setDraw = (color: RGB) => doc.setDrawColor(color[0], color[1], color[2]);

  const totalPrimary = rows.reduce((sum, row) => sum + (isBatting ? Number(row.runs) : Number(row.wickets)), 0);
  const leaders = [...rows]
    .sort((a, b) => (isBatting ? Number(b.runs) - Number(a.runs) : Number(b.wickets) - Number(a.wickets)))
    .slice(0, 3)
    .map((row) => `${row.name} (${isBatting ? row.runs : row.wickets})`)
    .join(' • ') || 'No data';

  setFill(palette.bg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  setFill(palette.panel);
  doc.roundedRect(24, 24, pageWidth - 48, 98, 18, 18, 'F');
  setFill(palette.accent);
  doc.circle(70, 70, 22, 'F');
  setFill(palette.accentSoft);
  doc.circle(pageWidth - 78, 58, 14, 'F');
  doc.circle(pageWidth - 110, 88, 28, 'F');

  setText(palette.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(isBatting ? 'Batting Canvas Export' : 'Bowling Canvas Export', 108, 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  setText(palette.muted);
  doc.text(`League ${options.league.toUpperCase()}  |  Team ${options.teamLabel}  |  Search ${options.searchQuery || 'None'}`, 108, 88);
  doc.text(`Generated ${new Date().toLocaleString()}`, 108, 106);

  const cards = [
    { label: 'Players', value: String(rows.length) },
    { label: isBatting ? 'Runs' : 'Wickets', value: String(totalPrimary) },
    { label: 'Leaders', value: leaders }
  ];

  cards.forEach((card, index) => {
    const x = 24 + index * ((pageWidth - 48 - 24) / 3);
    const width = (pageWidth - 48 - 24) / 3 - 8;
    setFill(palette.panel);
    doc.roundedRect(x, 138, width, 56, 14, 14, 'F');
    setDraw(palette.grid);
    doc.roundedRect(x, 138, width, 56, 14, 14, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(index === 2 ? 10 : 20);
    setText(palette.text);
    doc.text(card.value, x + 14, 162, { maxWidth: width - 28 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setText(palette.muted);
    doc.text(card.label, x + 14, 183, { maxWidth: width - 28 });
  });

  const columns = getColumns(options.kind);
  
  // Split columns into groups to fit on one page
  const maxColumnsPerPage = 8; // Limit columns to fit comfortably
  const columnGroups: typeof columns[] = [];
  
  // Always include ID, Name, Team in every group
  const essentialColumns = columns.filter(([label]) => 
    label === 'ID' || label === 'Name' || label === 'Team Name' || label === 'Team ID'
  );
  
  const otherColumns = columns.filter(([label]) => 
    label !== 'ID' && label !== 'Name' && label !== 'Team Name' && label !== 'Team ID'
  );
  
  // Create column groups
  for (let i = 0; i < otherColumns.length; i += maxColumnsPerPage - essentialColumns.length) {
    const group = [...essentialColumns, ...otherColumns.slice(i, i + maxColumnsPerPage - essentialColumns.length)];
    columnGroups.push(group);
  }
  
  // Generate table for each column group
  let currentY = 214;
  
  columnGroups.forEach((columnGroup, groupIndex) => {
    // Add page break if not first group
    if (groupIndex > 0) {
      doc.addPage();
      currentY = 60; // Reset Y position for new page
    }
    
    // Add page header with column group info
    setText(palette.muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Player Statistics - Part ${groupIndex + 1}`, 24, currentY - 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Columns: ${columnGroup.map(([label]) => label).join(', ')}`, 24, currentY - 10);
    
    // Create table for this column group
    autoTable(doc, {
      startY: currentY,
      head: [columnGroup.map(([label]) => label)],
      body: rows.map((row) => 
        columnGroup.map(([, key]) => String(row[key as keyof ExportRow] ?? ''))
      ),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: palette.text,
        fillColor: palette.bg,
        lineColor: palette.grid,
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [palette.accent[0], palette.accent[1], palette.accent[2]],
        textColor: [palette.text[0], palette.text[1], palette.text[2]],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [palette.panel[0], palette.panel[1], palette.panel[2]]
      },
      margin: { left: 24, right: 24, top: 24, bottom: 40 },
      columnStyles: columnGroup.reduce((styles, [label], index) => {
        // Make ID and Name columns wider
        if (label === 'ID' || label === 'Name') {
          styles[index] = { cellWidth: 60 };
        } else if (label === 'Team Name') {
          styles[index] = { cellWidth: 80 };
        }
        return styles;
      }, {} as Record<number, any>),
      didDrawPage: (data) => {
        setText(palette.muted);
        doc.setFontSize(8);
        doc.text(`${isBatting ? 'Batting' : 'Bowling'} Stats - Part ${groupIndex + 1}`, 24, pageHeight - 12);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 24, pageHeight - 12, { align: 'right' });
        
        // Add player info footer on each page
        if (data.pageNumber === Math.ceil(data.table.rowCount / data.table.rows.length)) {
          doc.setFontSize(9);
          doc.text(`Total Players: ${rows.length}`, 24, pageHeight - 24);
        }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 30;
  });

  console.log('PDF generation completed successfully');
  return doc.output('arraybuffer');
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const exportStatsData = (
  format: 'pdf' | 'csv' | 'sql',
  players: ExportPlayer[],
  teams: ExportTeam[],
  options: ExportOptions
) => {
  try {
    console.log('Export started:', { format, playersCount: players.length, teamsCount: teams.length, options });
    
    const rows = buildExportRows(players, teams);
    const filename = buildFilename(options.kind, format, options);
    
    console.log('Export rows built:', { rowsCount: rows.length, filename });

    if (format === 'csv') {
      console.log('Building CSV export...');
      downloadBlob(buildCsv(rows, options.kind), 'text/csv;charset=utf-8', filename);
      return;
    }

    if (format === 'sql') {
      console.log('Building SQL export...');
      downloadBlob(buildSql(rows, options.kind), 'application/sql;charset=utf-8', filename);
      return;
    }

    console.log('Building PDF export...');
    const pdfBuffer = buildPdf(rows, options);
    console.log('PDF built successfully, buffer size:', pdfBuffer.byteLength);
    downloadBlob(pdfBuffer, 'application/pdf', filename);
    console.log('PDF download completed');
  } catch (error) {
    console.error('Export failed:', error);
    throw error; // Re-throw to let the calling component handle it
  }
};
