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
  ducks: number;
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
  fourWickets: number;
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
  const runs = Number(player.stats?.runs) || 0;
  const innings = Number(player.stats?.battingInnings) || 0;
  const notOuts = Number(player.stats?.notOuts) || 0;
  const dismissals = Math.max(innings - notOuts, 0);
  return dismissals > 0 ? formatNumber(runs / dismissals, 2) : '-';
};

const getBattingStrikeRate = (player: ExportPlayer) => {
  const runs = Number(player.stats?.runs) || 0;
  const ballsFaced = Number(player.stats?.ballsFaced) || 0;
  return ballsFaced > 0 ? formatNumber((runs * 100) / ballsFaced, 1) : '-';
};

const getBowlingAverage = (player: ExportPlayer) => {
  const wickets = Number(player.stats?.wickets) || 0;
  const runsConceded = Number(player.stats?.runsConceded) || 0;
  return wickets > 0 ? formatNumber(runsConceded / wickets, 2) : '-';
};

const getBowlingStrikeRate = (player: ExportPlayer) => {
  const wickets = Number(player.stats?.wickets) || 0;
  const balls = Number(player.stats?.balls) || 0;
  return wickets > 0 && balls > 0 ? formatNumber(balls / wickets, 1) : '-';
};

const getEconomy = (player: ExportPlayer) => {
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
      ducks: Number(player.stats?.ducks) || 0,
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
      fourWickets: Number(player.stats?.fourWickets) || 0,
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
  ['Ducks', 'ducks'],
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
  ['Four Wickets', 'fourWickets'],
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
  if (!rows || rows.length === 0) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text(
      'No data available for export',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() / 2,
      { align: 'center' }
    );
    return doc.output('arraybuffer');
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const isBatting = options.kind === 'batting';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

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

  const title = isBatting ? 'Batting Canvas Export' : 'Bowling Canvas Export';
  const filterLine = `League ${options.league.toUpperCase()}  |  Team ${options.teamLabel}  |  Search ${options.searchQuery || 'None'}`;
  const generatedAt = new Date().toLocaleString();

  const totalPrimary = rows.reduce((sum, row) => sum + (isBatting ? Number(row.runs) : Number(row.wickets)), 0);
  const leaders = [...rows]
    .sort((a, b) => (isBatting ? Number(b.runs) - Number(a.runs) : Number(b.wickets) - Number(a.wickets)))
    .slice(0, 3)
    .map((row) => `${row.name} (${isBatting ? row.runs : row.wickets})`)
    .join(' • ') || 'No data';

  const cards = [
    { label: 'Players', value: String(rows.length) },
    { label: isBatting ? 'Runs' : 'Wickets', value: String(totalPrimary) },
    { label: 'Leaders', value: leaders }
  ];

  const marginX = 24;
  const footerHeight = 26;
  const tableTop = 140;
  const firstPageTableTop = 214;

  const keyColumns: readonly Column[] = [
    ['ID', 'id'],
    ['Player', 'name'],
    ['Team', 'teamShortName']
  ];
  // Keep the PDF compact: repeat ID/Player/Team short code, and omit long team name from the table.
  const keyKeys = new Set<keyof ExportRow>(['id', 'name', 'teamShortName', 'teamName']);
  const extraColumns = getColumns(options.kind).filter(([, key]) => !keyKeys.has(key));

  const usableWidth = pageWidth - marginX * 2;
  const keyColumnWidths = { id: 56, name: 182, team: 72 };
  const keyWidthTotal = keyColumnWidths.id + keyColumnWidths.name + keyColumnWidths.team;
  const extraMinWidth = 88;
  const extrasPerPart = Math.max(1, Math.floor((usableWidth - keyWidthTotal) / extraMinWidth));

  const parts: Column[][] = [];
  for (let i = 0; i < extraColumns.length; i += extrasPerPart) parts.push(extraColumns.slice(i, i + extrasPerPart));
  if (parts.length === 0) parts.push([]);

  type TeamBucket = { shortName: string; displayName: string; rows: ExportRow[] };
  const teamBuckets = new Map<string, TeamBucket>();
  rows.forEach((row) => {
    const shortName = String(row.teamShortName || '').trim().toUpperCase();
    const displayName = String(row.teamName || shortName || 'Unknown').trim();
    const key = shortName || displayName.toUpperCase() || 'UNKNOWN';
    const existing = teamBuckets.get(key);
    if (existing) {
      existing.rows.push(row);
      if (!existing.displayName && displayName) existing.displayName = displayName;
      return;
    }
    teamBuckets.set(key, { shortName: shortName || key, displayName, rows: [row] });
  });

  const preferredTeamOrder = ['RCB', 'MI', 'SRH', 'GT', 'PBKS', 'DC', 'LSG', 'RR', 'KKR', 'CSK'] as const;
  const teamOrderIndex = new Map<string, number>(preferredTeamOrder.map((code, idx) => [code, idx]));

  const teamKeys = Array.from(teamBuckets.keys()).sort((a, b) => {
    const ia = teamOrderIndex.get(a) ?? Number.POSITIVE_INFINITY;
    const ib = teamOrderIndex.get(b) ?? Number.POSITIVE_INFINITY;
    if (ia !== ib) return ia - ib;
    const da = teamBuckets.get(a)?.displayName || a;
    const db = teamBuckets.get(b)?.displayName || b;
    return da.localeCompare(db);
  });
  const rowsPerPage = 15;

  const drawHeader = (
    teamName: string,
    batchIndex: number,
    batchTotal: number,
    partIndex: number,
    partsTotal: number,
    batchRangeLabel: string,
    includeSummary: boolean
  ) => {
    setFill(palette.bg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    setFill(palette.panel);
    doc.roundedRect(marginX, 24, pageWidth - marginX * 2, 94, 18, 18, 'F');

    setFill(palette.accent);
    doc.circle(70, 68, 22, 'F');
    setFill(palette.accentSoft);
    doc.circle(pageWidth - 78, 54, 14, 'F');
    doc.circle(pageWidth - 110, 82, 28, 'F');

    setText(palette.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(title, 108, 64);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    setText(palette.muted);
    doc.text(filterLine, 108, 84, { maxWidth: pageWidth - 310 });

    doc.setFontSize(10);
    doc.text(generatedAt, pageWidth - marginX, 64, { align: 'right' });
    doc.text(`Part ${partIndex + 1}/${partsTotal}`, pageWidth - marginX, 84, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setText(palette.text);
    doc.text(`Team: ${teamName}`, 108, 104, { maxWidth: pageWidth - 310 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setText(palette.muted);
    doc.text(`Batch ${batchIndex + 1}/${batchTotal}  |  Players ${batchRangeLabel}`, pageWidth - marginX, 104, { align: 'right' });

    if (!includeSummary) return;

    cards.forEach((card, index) => {
      const x = marginX + index * ((pageWidth - marginX * 2 - 24) / 3);
      const width = (pageWidth - marginX * 2 - 24) / 3 - 8;
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
  };

  let hasDrawnFirstSummary = false;

  teamKeys.forEach((teamKey) => {
    const bucket = teamBuckets.get(teamKey);
    if (!bucket) return;

    const teamName = bucket.shortName || bucket.displayName || teamKey;
    const teamRows = bucket.rows;
    const batchTotal = Math.max(1, Math.ceil(teamRows.length / rowsPerPage));

    for (let batchIndex = 0; batchIndex < teamRows.length; batchIndex += rowsPerPage) {
      const batchStart = batchIndex;
      const batchEnd = Math.min(batchIndex + rowsPerPage, teamRows.length);
      const batchRows = teamRows.slice(batchStart, batchEnd);
      const batchNumber = Math.floor(batchStart / rowsPerPage);
      const batchRangeLabel = `${batchStart + 1}-${batchEnd} of ${teamRows.length}`;

      parts.forEach((partExtraColumns, partIndex) => {
        if (hasDrawnFirstSummary || batchStart !== 0 || partIndex !== 0 || teamKey !== teamKeys[0]) {
          doc.addPage();
        }

        const includeSummary = !hasDrawnFirstSummary && teamKey === teamKeys[0] && batchStart === 0 && partIndex === 0;
        const partColumns: Column[] = [...keyColumns, ...partExtraColumns];
        const startY = includeSummary ? firstPageTableTop : tableTop;

        const extraCount = partExtraColumns.length;
        const extraWidth = extraCount ? Math.floor((usableWidth - keyWidthTotal) / extraCount) : 0;
        const extraColumnStyles = partExtraColumns.reduce((styles, _, idx) => {
          styles[idx + keyColumns.length] = { cellWidth: extraWidth };
          return styles;
        }, {} as Record<number, any>);

        const partStartPage = (doc as any).internal.getCurrentPageInfo().pageNumber as number;

        autoTable(doc, {
          startY,
          margin: { left: marginX, right: marginX, top: tableTop, bottom: footerHeight },
          head: [partColumns.map(([label]) => label)],
          body: batchRows.map((row) => partColumns.map(([, key]) => String(row[key] ?? ''))),
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
            textColor: [palette.text[0], palette.text[1], palette.text[2]],
            fillColor: [palette.bg[0], palette.bg[1], palette.bg[2]],
            lineColor: [palette.grid[0], palette.grid[1], palette.grid[2]],
            lineWidth: 0.5,
            overflow: 'ellipsize'
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
          columnStyles: {
            0: { cellWidth: keyColumnWidths.id },
            1: { cellWidth: keyColumnWidths.name },
            2: { cellWidth: keyColumnWidths.team },
            ...extraColumnStyles
          },
          pageBreak: 'avoid',
          willDrawPage: (data) => {
            drawHeader(
              teamName,
              batchNumber,
              batchTotal,
              partIndex,
              parts.length,
              batchRangeLabel,
              includeSummary && data.pageNumber === partStartPage
            );
          },
          didDrawPage: (data) => {
            setText(palette.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(`${isBatting ? 'Batting' : 'Bowling'} Stats`, marginX, pageHeight - 12);
            doc.text(`Team: ${teamName}`, marginX + 86, pageHeight - 12, { maxWidth: pageWidth - 260 });
            doc.text(`Page ${data.pageNumber}`, pageWidth - marginX, pageHeight - 12, { align: 'right' });
          }
        });

        if (includeSummary) hasDrawnFirstSummary = true;
      });
    }
  });

  return doc.output('arraybuffer');
};

export const exportStatsData = (
  format: 'pdf' | 'csv' | 'sql',
  players: ExportPlayer[],
  teams: ExportTeam[],
  options: ExportOptions
) => {
  const rows = buildExportRows(players, teams);
  const filename = buildFilename(options.kind, format, options);

  if (format === 'csv') {
    downloadBlob(buildCsv(rows, options.kind), 'text/csv;charset=utf-8', filename);
    return;
  }

  if (format === 'sql') {
    downloadBlob(buildSql(rows, options.kind), 'application/sql;charset=utf-8', filename);
    return;
  }

  downloadBlob(buildPdf(rows, options), 'application/pdf', filename);
};
