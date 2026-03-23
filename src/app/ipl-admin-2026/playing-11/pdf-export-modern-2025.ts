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

export async function exportPlaying11ToPDFModern2025(payload: Playing11ExportPayload): Promise<void> {
  try {
    console.log('Starting PDF export with payload:', payload);
    
    const { match, players, playing11, impact } = payload;
    
    if (!playing11.team1.length && !playing11.team2.length) {
      alert('No playing 11 data to export.');
      return;
    }

    console.log('Importing jsPDF and autoTable...');
    const jsPDF = await importJsPDF();
    const autoTable = await importAutoTable();
    
    if (!jsPDF) {
      console.error('jsPDF import failed');
      alert('PDF export is not available - jsPDF could not be loaded.');
      return;
    }
    
    if (!autoTable) {
      console.error('autoTable import failed');
      alert('PDF export is not available - autoTable could not be loaded.');
      return;
    }

    console.log('Creating PDF document...');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 56;
    const contentWidth = pageWidth - margin * 2;

    console.log('PDF dimensions:', { pageWidth, pageHeight, contentWidth });

    // Modern 2025 Professional Design System
    const colors = {
      // Primary Palette - Cobalt Charcoal (Modern Tech)
      primary: [15, 17, 21] as const,        // Deep charcoal
      secondary: [43, 47, 58] as const,      // Medium charcoal
      accent: [31, 94, 255] as const,        // Electric cobalt
      accentLight: [207, 214, 230] as const, // Soft periwinkle
      background: [242, 245, 255] as const,  // Light blue-white
      
      // Supporting Colors
      success: [52, 211, 153] as const,      // Mint green
      warning: [243, 179, 61] as const,       // Golden
      danger: [239, 68, 68] as const,        // Coral red
      info: [99, 102, 241] as const,         // Indigo
      
      // Text Colors
      textPrimary: [31, 41, 55] as const,     // Near black
      textSecondary: [75, 85, 99] as const,   // Medium gray
      textMuted: [156, 163, 175] as const,   // Light gray
      textLight: [255, 255, 255] as const,    // White
      
      // UI Elements
      border: [229, 231, 235] as const,      // Light gray
      borderMedium: [209, 213, 219] as const, // Medium gray
      shadow: [0, 0, 0, 0.05] as const,       // Subtle shadow
      highlight: [248, 250, 252] as const    // Very light blue
    };

    // Professional Typography Scale
    const fonts = {
      hero: 32,
      title: 24,
      subtitle: 18,
      heading: 14,
      subheading: 12,
      body: 11,
      caption: 9,
      small: 8
    };

    // Modern Spacing System
    const spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
      xxxl: 64
    };

    // Match Information
    const matchTitle = `${match.team1.shortName || match.team1.name} vs ${match.team2.shortName || match.team2.name}`;
    const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '';
    const matchTime = match.time || '';
    const matchVenue = match.venue || '';
    const matchId = match.id || '';
    const matchNumber = match.matchNumber || '';
    const league = match.league?.toUpperCase() || 'IPL';
    const generatedAt = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log('Match info:', { matchTitle, matchDate, matchTime, matchVenue });

    // Helper Functions
    const drawModernHeader = () => {
      // Header background with gradient effect
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 120, 'F');
      
      // Accent bar
      doc.setFillColor(...colors.accent);
      doc.rect(0, 116, pageWidth, 4, 'F');
      
      // Title section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fonts.hero);
      doc.setTextColor(...colors.textLight);
      doc.text('PLAYING 11 & IMPACT PLAYER REPORT', margin, 45);
      
      // Match title
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fonts.title);
      doc.setTextColor(...colors.background);
      doc.text(matchTitle, margin, 75);
      
      // Meta information in header
      doc.setFontSize(fonts.body);
      doc.setTextColor(...colors.accentLight);
      const metaY = 95;
      doc.text(`${matchDate} • ${matchTime}`, margin, metaY);
      doc.text(matchVenue, margin, metaY + 15);
      
      // League badge on right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fonts.subtitle);
      doc.setTextColor(...colors.textLight);
      doc.text(league, pageWidth - margin, 45, { align: 'right' });
    };

  const drawSectionHeader = (title: string, y: number, color: number[]) => {
      // Section header background (using regular rect instead of roundedRect)
      doc.setFillColor(...color);
      doc.rect(margin, y, contentWidth, 36, 'F');
      
      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fonts.heading);
      doc.setTextColor(...colors.textLight);
      doc.text(title, margin + 16, y + 23);
    };

  const createModernTable = (headers: string[], data: string[][], startY: number, headerColor: number[]) => {
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: startY,
        styles: {
          font: 'helvetica',
          fontSize: fonts.body,
          cellPadding: 10,
          textColor: [...colors.textSecondary],
          lineColor: [...colors.border],
          lineWidth: 0.5,
          fillColor: [...colors.textLight]
        },
        headStyles: {
          fillColor: [...headerColor],
          textColor: [...colors.textLight],
          fontStyle: 'bold',
          fontSize: fonts.subheading,
          cellPadding: 12
        },
        alternateRowStyles: {
          fillColor: [...colors.highlight]
        },
        margin: { left: margin, right: margin },
        theme: 'grid',
        tableLineWidth: 0.5
      });
    };

    const createInfoTable = (title: string, data: [string, string][], startY: number, color: number[]) => {
      drawSectionHeader(title, startY, color);
      
      const tableData = data.map(([label, value]) => [label, value]);
      createModernTable(['Information', 'Details'], tableData, startY + 44, color);
    };

  // Build PDF
    drawModernHeader();

    let currentY = 140;

    // Match Information Table
    const matchInfoData: [string, string][] = [
      ['Match', matchTitle],
      ['Date', matchDate],
      ['Time', matchTime],
      ['Venue', matchVenue],
      ['Match ID', matchId],
      ['Match Number', matchNumber || 'N/A'],
      ['League', league],
      ['Generated', generatedAt]
    ];

    createInfoTable('Match Information', matchInfoData, currentY, colors.primary);

    const lastMatchTable = (doc as any).lastAutoTable;
    currentY = lastMatchTable?.finalY ? lastMatchTable.finalY + spacing.xl : currentY + 120;

  // Summary Statistics Table
    const team1Impact = normalizeImpact(impact.team1);
    const team2Impact = normalizeImpact(impact.team2);
    const totalPlaying11 = playing11.team1.length + playing11.team2.length;
    const totalImpact = (team1Impact.playerId ? 1 : 0) + (team2Impact.playerId ? 1 : 0);

    const summaryData: [string, string][] = [
      ['Total Playing 11 Players', String(totalPlaying11)],
      ['Team 1 Players', String(playing11.team1.length)],
      ['Team 2 Players', String(playing11.team2.length)],
      ['Total Impact Players', String(totalImpact)],
      ['Team 1 Impact Player', team1Impact.playerId ? 'Yes' : 'No'],
      ['Team 2 Impact Player', team2Impact.playerId ? 'Yes' : 'No'],
      ['Export Status', 'Complete']
    ];

    createInfoTable('Summary Statistics', summaryData, currentY, colors.accent);

    const lastSummaryTable = (doc as any).lastAutoTable;
    currentY = lastSummaryTable?.finalY ? lastSummaryTable.finalY + spacing.xl : currentY + 120;

    // Team 1 Playing 11 Table
    const team1Headers = ['#', 'Player Name', 'Role', 'Jersey', 'Captain', 'Batting Style', 'Bowling Style', 'Impact Player'];
    const team1Data = playing11.team1.map((playerId, index) => {
      const player = players.find(p => p.id === playerId);
      const isImpact = team1Impact.playerId === playerId;
      return [
        String(index + 1),
        player?.name || 'Unknown',
        player?.role || 'N/A',
        String(player?.jerseyNumber || 'N/A'),
        player?.isCaptain ? 'Yes' : 'No',
        player?.battingStyle || 'N/A',
        player?.bowlingStyle || 'N/A',
        isImpact ? (team1Impact.substitutionTime || 'Yes') : 'No'
      ];
    });

    if (team1Data.length === 0) {
      team1Data.push(['-', 'No players selected', '-', '-', '-', '-', '-', '-']);
    }

    drawSectionHeader(`${match.team1.shortName || match.team1.name} - Playing 11`, currentY, colors.primary);
    createModernTable(team1Headers, team1Data, currentY + 44, colors.primary);

    const lastTeam1Table = (doc as any).lastAutoTable;
    currentY = lastTeam1Table?.finalY ? lastTeam1Table.finalY + spacing.xl : currentY + 120;

    // Team 2 Playing 11 Table
    const team2Headers = ['#', 'Player Name', 'Role', 'Jersey', 'Captain', 'Batting Style', 'Bowling Style', 'Impact Player'];
    const team2Data = playing11.team2.map((playerId, index) => {
      const player = players.find(p => p.id === playerId);
      const isImpact = team2Impact.playerId === playerId;
      return [
        String(index + 1),
        player?.name || 'Unknown',
        player?.role || 'N/A',
        String(player?.jerseyNumber || 'N/A'),
        player?.isCaptain ? 'Yes' : 'No',
        player?.battingStyle || 'N/A',
        player?.bowlingStyle || 'N/A',
        isImpact ? (team2Impact.substitutionTime || 'Yes') : 'No'
      ];
    });

    if (team2Data.length === 0) {
      team2Data.push(['-', 'No players selected', '-', '-', '-', '-', '-', '-']);
    }

    drawSectionHeader(`${match.team2.shortName || match.team2.name} - Playing 11`, currentY, colors.accent);
    createModernTable(team2Headers, team2Data, currentY + 44, colors.accent);

    const lastTeam2Table = (doc as any).lastAutoTable;
    currentY = lastTeam2Table?.finalY ? lastTeam2Table.finalY + spacing.xl : currentY + 120;

    // Impact Players Table
    const impactHeaders = ['Team', 'Impact Player', 'Role', 'Substitution Time', 'Original Player', 'Substituted At'];
    const impactData: string[][] = [];

    if (team1Impact.playerId) {
      const player = players.find(p => p.id === team1Impact.playerId);
      const originalPlayer = team1Impact.original ? players.find(p => p.id === team1Impact.original) : null;
      impactData.push([
        match.team1.shortName || match.team1.name,
        player?.name || 'Unknown',
        player?.role || 'N/A',
        team1Impact.substitutionTime || 'N/A',
        originalPlayer?.name || team1Impact.original || 'N/A',
        team1Impact.substitutedAt || 'N/A'
      ]);
    }

    if (team2Impact.playerId) {
      const player = players.find(p => p.id === team2Impact.playerId);
      const originalPlayer = team2Impact.original ? players.find(p => p.id === team2Impact.original) : null;
      impactData.push([
        match.team2.shortName || match.team2.name,
        player?.name || 'Unknown',
        player?.role || 'N/A',
        team2Impact.substitutionTime || 'N/A',
        originalPlayer?.name || team2Impact.original || 'N/A',
        team2Impact.substitutedAt || 'N/A'
      ]);
    }

    if (impactData.length === 0) {
      impactData.push(['-', 'No Impact Players', '-', '-', '-', '-']);
    }

    drawSectionHeader('Impact Players Details', currentY, colors.warning);
    createModernTable(impactHeaders, impactData, currentY + 44, colors.warning);

    // Footer
    const footerY = pageHeight - 40;
    doc.setFillColor(...colors.primary);
    doc.rect(0, footerY, pageWidth, 40, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fonts.caption);
    doc.setTextColor(...colors.textLight);
    doc.text(`Generated on ${generatedAt}`, margin, footerY + 25);
    doc.text('Professional Sports Management System', pageWidth - margin, footerY + 25, { align: 'right' });

    // Save PDF
    console.log('Saving PDF...');
    const filename = buildFilename(match, 'modern-2025-design', 'pdf');
    const pdfBlob = doc.output('blob');
    downloadBlob(pdfBlob, filename);
    console.log('PDF saved successfully');

  } catch (error) {
    console.error('PDF export failed:', error);
    alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
  }
}
