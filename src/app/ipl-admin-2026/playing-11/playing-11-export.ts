import { Match, Player } from '@/types';

export type ImpactSelection = {
  playerId?: string;
  substitutionTime?: string;
  original?: string;
  impact?: string;
  substitutedAt?: number;
};

export interface Playing11ExportPayload {
  match: Match;
  players: Player[];
  playing11: {
    team1: string[];
    team2: string[];
  };
  impact: {
    team1?: ImpactSelection | null;
    team2?: ImpactSelection | null;
  };
}

type ExportRow = {
  record_type: 'playing11' | 'impact_player';
  match_id: string;
  match_number: string;
  league: string;
  match_date: string;
  match_time: string;
  venue: string;
  team_side: 'team1' | 'team2';
  team_id: string;
  team_name: string;
  team_short_name: string;
  player_id: string;
  player_name: string;
  player_role: string;
  allrounder_type: string;
  age: string | number;
  date_of_birth: string;
  nationality: string;
  jersey_number: string | number;
  is_captain: boolean;
  batting_style: string;
  bowling_style: string;
  is_playing11: boolean;
  is_impact_player: boolean;
  impact_substitution_time: string;
  impact_original_player_id: string;
  impact_substituted_at: string;
  matches: string | number;
  runs: string | number;
  wickets: string | number;
  average: string | number;
  bowling_average: string | number;
  strike_rate: string | number;
  economy: string | number;
  highest: string | number;
  fours: string | number;
  sixes: string | number;
  fifties: string | number;
  hundreds: string | number;
  best_bowling: string;
  exported_at: string;
  player_raw: string;
};

type ExportColumn = { key: keyof ExportRow; label: string };

const exportColumns: ExportColumn[] = [
  { key: 'record_type', label: 'Record Type' },
  { key: 'match_id', label: 'Match ID' },
  { key: 'match_number', label: 'Match Number' },
  { key: 'league', label: 'League' },
  { key: 'match_date', label: 'Match Date' },
  { key: 'match_time', label: 'Match Time' },
  { key: 'venue', label: 'Venue' },
  { key: 'team_side', label: 'Team Side' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'team_name', label: 'Team Name' },
  { key: 'team_short_name', label: 'Team Short Name' },
  { key: 'player_id', label: 'Player ID' },
  { key: 'player_name', label: 'Player Name' },
  { key: 'player_role', label: 'Player Role' },
  { key: 'allrounder_type', label: 'Allrounder Type' },
  { key: 'age', label: 'Age' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'jersey_number', label: 'Jersey Number' },
  { key: 'is_captain', label: 'Captain' },
  { key: 'batting_style', label: 'Batting Style' },
  { key: 'bowling_style', label: 'Bowling Style' },
  { key: 'is_playing11', label: 'Is Playing 11' },
  { key: 'is_impact_player', label: 'Is Impact Player' },
  { key: 'impact_substitution_time', label: 'Impact Substitution Time' },
  { key: 'impact_original_player_id', label: 'Impact Original Player ID' },
  { key: 'impact_substituted_at', label: 'Impact Substituted At' },
  { key: 'matches', label: 'Matches' },
  { key: 'runs', label: 'Runs' },
  { key: 'wickets', label: 'Wickets' },
  { key: 'average', label: 'Batting Average' },
  { key: 'bowling_average', label: 'Bowling Average' },
  { key: 'strike_rate', label: 'Strike Rate' },
  { key: 'economy', label: 'Economy' },
  { key: 'highest', label: 'Highest' },
  { key: 'fours', label: 'Fours' },
  { key: 'sixes', label: 'Sixes' },
  { key: 'fifties', label: 'Fifties' },
  { key: 'hundreds', label: 'Hundreds' },
  { key: 'best_bowling', label: 'Best Bowling' },
  { key: 'exported_at', label: 'Exported At' }
];

const importJsPDF = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const jspdfModule = await import('jspdf');
    return (jspdfModule as { jsPDF?: typeof import('jspdf').jsPDF; default?: any }).jsPDF
      || (jspdfModule as { default?: any }).default
      || null;
  } catch (error) {
    console.error('Failed to import jsPDF:', error);
    return null;
  }
};

const importAutoTable = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const module = await import('jspdf-autotable');
    return (module as { autoTable?: any; default?: any }).autoTable
      || (module as { default?: any }).default
      || null;
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

const safeString = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const toCsvValue = (value: unknown) => {
  const text = safeString(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const toSpreadsheetValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
};

const sanitizeFilename = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
};

const buildFilename = (match: Match, suffix: string, extension: string) => {
  const team1 = sanitizeFilename(match.team1.shortName || match.team1.name || 'team1');
  const team2 = sanitizeFilename(match.team2.shortName || match.team2.name || 'team2');
  const date = match.date ? new Date(match.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const base = `playing11_${team1}_vs_${team2}_${date}${suffix ? `_${suffix}` : ''}`;
  return `${base}.${extension}`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.setAttribute('rel', 'noopener');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
};

const normalizeImpact = (impact?: ImpactSelection | null) => {
  if (!impact) return { playerId: '', substitutionTime: '', original: '', substitutedAt: '' };
  const playerId = impact.playerId || impact.impact || '';
  const substitutionTime = impact.substitutionTime || '';
  const original = impact.original || '';
  const substitutedAt = typeof impact.substitutedAt === 'number'
    ? new Date(impact.substitutedAt).toISOString()
    : '';
  return { playerId, substitutionTime, original, substitutedAt };
};

const buildExportRows = (payload: Playing11ExportPayload): ExportRow[] => {
  const { match, players, playing11, impact } = payload;
  const exportTimestamp = new Date().toISOString();
  const playerMap = new Map(players.map(player => [player.id, player]));

  const matchDate = match.date ? new Date(match.date).toLocaleDateString() : '';
  const matchNumber = match.matchNumber || '';

  const team1Impact = normalizeImpact(impact.team1 || undefined);
  const team2Impact = normalizeImpact(impact.team2 || undefined);

  const buildRow = (
    teamSide: 'team1' | 'team2',
    recordType: 'playing11' | 'impact_player',
    playerId: string,
    isPlaying11: boolean,
    impactInfo: ReturnType<typeof normalizeImpact>
  ): ExportRow => {
    const player = playerMap.get(playerId);
    const stats = player?.stats;
    const team = teamSide === 'team1' ? match.team1 : match.team2;
    const isImpactPlayer = !!impactInfo.playerId && impactInfo.playerId === playerId;
    const playerRaw = player ? JSON.stringify(player) : '';

    return {
      record_type: recordType,
      match_id: match.id,
      match_number: matchNumber,
      league: match.league,
      match_date: matchDate,
      match_time: match.time,
      venue: match.venue,
      team_side: teamSide,
      team_id: String(team.id || ''),
      team_name: team.name || '',
      team_short_name: team.shortName || team.name || '',
      player_id: playerId,
      player_name: player?.name || 'Unknown',
      player_role: player?.role || '',
      allrounder_type: player?.allrounderType || '',
      age: player?.age ?? '',
      date_of_birth: player?.dateOfBirth || '',
      nationality: player?.nationality || '',
      jersey_number: player?.jerseyNumber ?? '',
      is_captain: player?.isCaptain ?? false,
      batting_style: player?.battingStyle || '',
      bowling_style: player?.bowlingStyle || '',
      is_playing11: isPlaying11,
      is_impact_player: isImpactPlayer,
      impact_substitution_time: isImpactPlayer ? impactInfo.substitutionTime : '',
      impact_original_player_id: isImpactPlayer ? impactInfo.original : '',
      impact_substituted_at: isImpactPlayer ? impactInfo.substitutedAt : '',
      matches: stats?.matches ?? '',
      runs: stats?.runs ?? '',
      wickets: stats?.wickets ?? '',
      average: stats?.average ?? '',
      bowling_average: stats?.bowlingAverage ?? '',
      strike_rate: stats?.strikeRate ?? '',
      economy: stats?.economy ?? '',
      highest: stats?.highest ?? '',
      fours: stats?.fours ?? '',
      sixes: stats?.sixes ?? '',
      fifties: stats?.fifties ?? '',
      hundreds: stats?.hundreds ?? '',
      best_bowling: stats?.bestBowling || '',
      exported_at: exportTimestamp,
      player_raw: playerRaw
    };
  };

  const rows: ExportRow[] = [];

  playing11.team1.forEach((playerId) => {
    rows.push(buildRow('team1', 'playing11', playerId, true, team1Impact));
  });

  playing11.team2.forEach((playerId) => {
    rows.push(buildRow('team2', 'playing11', playerId, true, team2Impact));
  });

  if (team1Impact.playerId && !playing11.team1.includes(team1Impact.playerId)) {
    rows.push(buildRow('team1', 'impact_player', team1Impact.playerId, false, team1Impact));
  }

  if (team2Impact.playerId && !playing11.team2.includes(team2Impact.playerId)) {
    rows.push(buildRow('team2', 'impact_player', team2Impact.playerId, false, team2Impact));
  }

  return rows;
};

const buildImpactSummaryRows = (
  payload: Playing11ExportPayload,
  teamSide: 'team1' | 'team2'
) => {
  const impactInfo = normalizeImpact(payload.impact[teamSide] || undefined);
  if (!impactInfo.playerId) return null;
  const player = payload.players.find(p => p.id === impactInfo.playerId);
  const team = teamSide === 'team1' ? payload.match.team1 : payload.match.team2;

  return [
    team.shortName || team.name || teamSide,
    player?.name || 'Unknown',
    player?.role || '',
    impactInfo.substitutionTime || '-',
    impactInfo.original || '-',
    impactInfo.substitutedAt || '-'
  ];
};

export function exportPlaying11ToCSV(payload: Playing11ExportPayload): void {
  const rows = buildExportRows(payload);
  if (rows.length === 0) {
    alert('No playing 11 data to export.');
    return;
  }

  const headers = exportColumns.map(column => column.label);
  const csvRows = rows.map(row =>
    exportColumns.map(column => toCsvValue(row[column.key])).join(',')
  );

  const csvContent = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = buildFilename(payload.match, 'playing11-impact', 'csv');
  downloadBlob(blob, filename);
}

export async function exportPlaying11ToExcel(payload: Playing11ExportPayload): Promise<void> {
  const rows = buildExportRows(payload);
  if (rows.length === 0) {
    alert('No playing 11 data to export.');
    return;
  }

  const XLSX = await importXLSX();
  if (!XLSX) {
    alert('Excel export is not available.');
    return;
  }

  const headerRow = exportColumns.map(column => column.label);
  const dataRows = rows.map(row =>
    exportColumns.map(column => toSpreadsheetValue(row[column.key]))
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Playing11');

  const matchInfoRows = [
    ['Match ID', payload.match.id],
    ['Match Number', payload.match.matchNumber || ''],
    ['League', payload.match.league],
    ['Date', payload.match.date],
    ['Time', payload.match.time],
    ['Venue', payload.match.venue],
    ['Team 1', payload.match.team1.shortName || payload.match.team1.name],
    ['Team 2', payload.match.team2.shortName || payload.match.team2.name]
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(matchInfoRows), 'Match Info');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = buildFilename(payload.match, 'playing11-impact', 'xlsx');
  downloadBlob(blob, filename);
}

export async function exportPlaying11ToPDF(payload: Playing11ExportPayload): Promise<void> {
  const rows = buildExportRows(payload);
  if (rows.length === 0) {
    alert('No playing 11 data to export.');
    return;
  }

  const jsPDF = await importJsPDF();
  const autoTable = await importAutoTable();
  if (!jsPDF || !autoTable) {
    alert('PDF export is not available.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const headerHeight = 78;

  const matchTitle = `${payload.match.team1.shortName || payload.match.team1.name} vs ${payload.match.team2.shortName || payload.match.team2.name}`;
  const matchMeta = `${payload.match.date} • ${payload.match.time} • ${payload.match.venue}`;
  const generatedAt = new Date().toLocaleString();
  const playing11Count = payload.playing11.team1.length + payload.playing11.team2.length;
  const impactCount = [payload.impact.team1, payload.impact.team2].filter(
    (item) => item && (item.playerId || (item as any).impact)
  ).length;

  const theme = {
    // Dark, modern "oil paint" palette (deep base + rich accents)
    pageBackground: [7, 10, 18] as const,
    surface: [13, 18, 30] as const,
    surface2: [17, 24, 39] as const,
    border: [36, 48, 74] as const,
    headerDark: [10, 14, 24] as const,
    headerLine: [36, 48, 74] as const,
    headerText: [241, 245, 249] as const,
    headerMuted: [148, 163, 184] as const,
    cardBackground: [13, 18, 30] as const,
    cardBorder: [36, 48, 74] as const,
    cardTitle: [241, 245, 249] as const,
    cardText: [203, 213, 225] as const,
    tableText: [226, 232, 240] as const,
    tableLine: [36, 48, 74] as const,
    // Oil accents
    oilTeal: [20, 184, 166] as const,
    oilBlue: [59, 130, 246] as const,
    oilIndigo: [99, 102, 241] as const,
    oilPurple: [168, 85, 247] as const,
    oilMagenta: [236, 72, 153] as const,
    oilAmber: [245, 158, 11] as const,
    team1Header: [59, 130, 246] as const,
    team2Header: [34, 197, 94] as const,
    impactHeader: [245, 158, 11] as const,
    team1Alt: [11, 18, 34] as const,
    team2Alt: [10, 26, 18] as const,
    impactAlt: [30, 20, 10] as const
  };

  const drawOilBackdrop = () => {
    doc.setFillColor(...theme.pageBackground);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // "Oil blobs" — layered circles/rounded shapes to create depth
    const blobs = [
      { x: pageWidth * 0.18, y: headerHeight + 90, r: 130, c: theme.oilIndigo },
      { x: pageWidth * 0.34, y: headerHeight + 40, r: 110, c: theme.oilTeal },
      { x: pageWidth * 0.82, y: headerHeight + 70, r: 150, c: theme.oilPurple },
      { x: pageWidth * 0.74, y: pageHeight * 0.72, r: 170, c: theme.oilMagenta },
      { x: pageWidth * 0.24, y: pageHeight * 0.78, r: 150, c: theme.oilAmber },
    ];

    blobs.forEach((b) => {
      doc.setFillColor(...b.c);
      doc.circle(b.x, b.y, b.r, 'F');
    });

    // Dark overlay panels to keep readability (still looks "oily" beneath)
    doc.setFillColor(...theme.surface);
    doc.roundedRect(marginX - 10, headerHeight + 8, pageWidth - (marginX - 10) * 2, pageHeight - headerHeight - 40, 16, 16, 'F');
  };

  const drawPageShell = () => {
    drawOilBackdrop();

    doc.setFillColor(...theme.headerDark);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Accent ribbon (oil gradient feel via blocks)
    doc.setFillColor(...theme.oilIndigo);
    doc.roundedRect(0, 0, pageWidth * 0.55, headerHeight, 0, 0, 'F');
    doc.setFillColor(...theme.oilTeal);
    doc.roundedRect(0, headerHeight - 18, pageWidth * 0.38, 18, 0, 0, 'F');
    doc.setFillColor(...theme.oilMagenta);
    doc.roundedRect(pageWidth * 0.55, 0, pageWidth * 0.12, headerHeight, 0, 0, 'F');

    doc.setDrawColor(...theme.headerLine);
    doc.setLineWidth(0.8);
    doc.line(0, headerHeight, pageWidth, headerHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...theme.headerText);
    doc.text('SportsUp18 Admin', marginX, 26);

    doc.setFontSize(20);
    doc.text('Playing 11 & Impact Players', pageWidth / 2, 40, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...theme.headerMuted);
    doc.text(`Generated: ${generatedAt}`, pageWidth - marginX, 26, { align: 'right' });

    doc.setFontSize(11);
    doc.text(matchTitle, pageWidth / 2, 58, { align: 'center' });
    doc.setFontSize(9);
    doc.text(matchMeta, pageWidth / 2, 72, { align: 'center' });
  };

  const drawInfoCard = (x: number, y: number, w: number, h: number, title: string, lines: string[], accent: [number, number, number]) => {
    doc.setFillColor(...theme.cardBackground);
    doc.setDrawColor(...theme.cardBorder);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, h, 10, 10, 'FD');
    doc.setFillColor(...accent);
    doc.roundedRect(x, y, w, 6, 10, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...theme.cardTitle);
    doc.text(title, x + 12, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...theme.cardText);
    let cursor = y + 34;
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, w - 24);
      wrapped.forEach((textLine: string) => {
        doc.text(textLine, x + 12, cursor);
        cursor += 12;
      });
    });
  };

  const drawSectionHeader = (label: string, color: [number, number, number], y: number) => {
    doc.setFillColor(...theme.surface2);
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.8);
    doc.roundedRect(marginX, y, 260, 28, 12, 12, 'FD');
    doc.setFillColor(...color);
    doc.roundedRect(marginX + 8, y + 7, 14, 14, 7, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.headerText);
    doc.text(label, marginX + 28, y + 19);
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...theme.headerMuted);
    doc.text(matchTitle, marginX, pageHeight - 16);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, pageHeight - 16, { align: 'right' });
  };

  drawPageShell();

  const cardY = headerHeight + 12;
  const cardHeight = 84;
  const cardGap = 16;
  const cardWidth = (pageWidth - marginX * 2 - cardGap) / 2;

  drawInfoCard(
    marginX,
    cardY,
    cardWidth,
    cardHeight,
    'Match Overview',
    [
      matchTitle,
      `${payload.match.date} • ${payload.match.time}`,
      payload.match.venue,
      `Match ID: ${payload.match.id}${payload.match.matchNumber ? ` • ${payload.match.matchNumber}` : ''}`
    ],
    theme.oilBlue
  );

  drawInfoCard(
    marginX + cardWidth + cardGap,
    cardY,
    cardWidth,
    cardHeight,
    'Summary',
    [
      `Playing 11 Players: ${playing11Count}`,
      `Impact Players: ${impactCount}`,
      `League: ${payload.match.league.toUpperCase()}`
    ],
    theme.oilTeal
  );

  const tableHeaders = ['#', 'Player', 'Role', 'Jersey', 'Nationality', 'Captain', 'Batting', 'Bowling', 'Impact'];

  const buildTeamRows = (teamSide: 'team1' | 'team2') => {
    const ids = teamSide === 'team1' ? payload.playing11.team1 : payload.playing11.team2;
    if (ids.length === 0) {
      return [['-', 'No players selected', '', '', '', '', '', '', '']];
    }
    return ids.map((playerId, index) => {
      const player = payload.players.find(p => p.id === playerId);
      const impactInfo = normalizeImpact(payload.impact[teamSide] || undefined);
      const isImpact = impactInfo.playerId === playerId;
      return [
        String(index + 1),
        player?.name || 'Unknown',
        player?.role || '',
        player?.jerseyNumber ?? '',
        player?.nationality || '',
        player?.isCaptain ? 'Yes' : 'No',
        player?.battingStyle || '',
        player?.bowlingStyle || '',
        isImpact ? (impactInfo.substitutionTime || 'Impact') : ''
      ];
    });
  };

  let cursorY = cardY + cardHeight + 24;
  const tableMargin = { left: marginX, right: marginX, top: headerHeight + 24, bottom: 36 };
  const tableHooks = {
    willDrawPage: (data: any) => {
      if (data.pageNumber > 1) {
        drawPageShell();
      }
    },
    didDrawPage: (data: any) => {
      const totalPages = doc.internal.getNumberOfPages();
      drawFooter(data.pageNumber, totalPages);
    }
  };

  drawSectionHeader(payload.match.team1.shortName || payload.match.team1.name || 'Team 1', theme.team1Header, cursorY);
  cursorY += 32;
  autoTable(doc, {
    head: [tableHeaders],
    body: buildTeamRows('team1'),
    startY: cursorY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: theme.tableText,
      lineColor: theme.tableLine,
      lineWidth: 0.2,
      fillColor: theme.surface2,
    },
    headStyles: { fillColor: theme.team1Header, textColor: 255, fontStyle: 'bold', lineColor: theme.team1Header },
    alternateRowStyles: { fillColor: theme.team1Alt },
    margin: tableMargin,
    ...tableHooks
  });

  const lastTable = (doc as any).lastAutoTable;
  cursorY = lastTable?.finalY ? lastTable.finalY + 24 : cursorY + 160;

  drawSectionHeader(payload.match.team2.shortName || payload.match.team2.name || 'Team 2', theme.team2Header, cursorY);
  cursorY += 32;
  autoTable(doc, {
    head: [tableHeaders],
    body: buildTeamRows('team2'),
    startY: cursorY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: theme.tableText,
      lineColor: theme.tableLine,
      lineWidth: 0.2,
      fillColor: theme.surface2,
    },
    headStyles: { fillColor: theme.team2Header, textColor: 255, fontStyle: 'bold', lineColor: theme.team2Header },
    alternateRowStyles: { fillColor: theme.team2Alt },
    margin: tableMargin,
    ...tableHooks
  });

  const impactRows = [
    buildImpactSummaryRows(payload, 'team1'),
    buildImpactSummaryRows(payload, 'team2')
  ].filter(Boolean) as string[][];

  const afterTeam2 = (doc as any).lastAutoTable;
  cursorY = afterTeam2?.finalY ? afterTeam2.finalY + 24 : cursorY + 160;

  drawSectionHeader('Impact Players', theme.impactHeader, cursorY);
  cursorY += 32;

  autoTable(doc, {
    head: [['Team', 'Impact Player', 'Role', 'Substitution Time', 'Original Player', 'Substituted At']],
    body: impactRows.length > 0 ? impactRows : [['-', 'None selected', '', '', '', '']],
    startY: cursorY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: theme.tableText,
      lineColor: theme.tableLine,
      lineWidth: 0.2,
      fillColor: theme.surface2,
    },
    headStyles: { fillColor: theme.impactHeader, textColor: 255, fontStyle: 'bold', lineColor: theme.impactHeader },
    alternateRowStyles: { fillColor: theme.impactAlt },
    margin: tableMargin,
    ...tableHooks
  });

  const filename = buildFilename(payload.match, 'playing11-impact', 'pdf');
  const pdfBlob = doc.output('blob');
  downloadBlob(pdfBlob, filename);
}

export function exportPlaying11ToDatabase(payload: Playing11ExportPayload): void {
  const rows = buildExportRows(payload);
  if (rows.length === 0) {
    alert('No playing 11 data to export.');
    return;
  }

  const sqlColumns = [
    { key: 'id', name: 'id' },
    { key: 'record_type', name: 'record_type' },
    { key: 'match_id', name: 'match_id' },
    { key: 'match_number', name: 'match_number' },
    { key: 'league', name: 'league' },
    { key: 'match_date', name: 'match_date' },
    { key: 'match_time', name: 'match_time' },
    { key: 'venue', name: 'venue' },
    { key: 'team_side', name: 'team_side' },
    { key: 'team_id', name: 'team_id' },
    { key: 'team_name', name: 'team_name' },
    { key: 'team_short_name', name: 'team_short_name' },
    { key: 'player_id', name: 'player_id' },
    { key: 'player_name', name: 'player_name' },
    { key: 'player_role', name: 'player_role' },
    { key: 'allrounder_type', name: 'allrounder_type' },
    { key: 'age', name: 'age' },
    { key: 'date_of_birth', name: 'date_of_birth' },
    { key: 'nationality', name: 'nationality' },
    { key: 'jersey_number', name: 'jersey_number' },
    { key: 'is_captain', name: 'is_captain' },
    { key: 'batting_style', name: 'batting_style' },
    { key: 'bowling_style', name: 'bowling_style' },
    { key: 'is_playing11', name: 'is_playing11' },
    { key: 'is_impact_player', name: 'is_impact_player' },
    { key: 'impact_substitution_time', name: 'impact_substitution_time' },
    { key: 'impact_original_player_id', name: 'impact_original_player_id' },
    { key: 'impact_substituted_at', name: 'impact_substituted_at' },
    { key: 'matches', name: 'matches' },
    { key: 'runs', name: 'runs' },
    { key: 'wickets', name: 'wickets' },
    { key: 'average', name: 'average' },
    { key: 'bowling_average', name: 'bowling_average' },
    { key: 'strike_rate', name: 'strike_rate' },
    { key: 'economy', name: 'economy' },
    { key: 'highest', name: 'highest' },
    { key: 'fours', name: 'fours' },
    { key: 'sixes', name: 'sixes' },
    { key: 'fifties', name: 'fifties' },
    { key: 'hundreds', name: 'hundreds' },
    { key: 'best_bowling', name: 'best_bowling' },
    { key: 'exported_at', name: 'exported_at' },
    { key: 'player_raw', name: 'player_raw' }
  ] as const;

  const formatSqlValue = (value: unknown) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
    if (typeof value === 'boolean') return value ? '1' : '0';
    const safe = String(value).replace(/'/g, "''");
    return `'${safe}'`;
  };

  const rowsWithIds = rows.map((row) => ({
    id: `${row.match_id}-${row.team_side}-${row.player_id}-${row.record_type}`,
    ...row
  }));

  const tableColumns = sqlColumns
    .map(column => `${column.name} TEXT${column.key === 'id' ? ' PRIMARY KEY' : ''}`)
    .join(',\n  ');

  const insertValues = rowsWithIds.map(row => {
    const values = sqlColumns.map(column => formatSqlValue((row as any)[column.key]));
    return `(${values.join(', ')})`;
  });

  const header = `-- Playing 11 export (${payload.match.league.toUpperCase()})\n-- Match: ${payload.match.team1.shortName || payload.match.team1.name} vs ${payload.match.team2.shortName || payload.match.team2.name}\n-- Generated: ${new Date().toISOString()}\n`;

  const sqlContent = `${header}\nCREATE TABLE IF NOT EXISTS playing11_export (\n  ${tableColumns}\n);\n\nINSERT INTO playing11_export (${sqlColumns.map(column => column.name).join(', ')}) VALUES\n${insertValues.join(',\n')};\n`;

  const blob = new Blob([sqlContent], { type: 'application/sql' });
  const filename = buildFilename(payload.match, 'playing11-impact', 'sql');
  downloadBlob(blob, filename);
}
