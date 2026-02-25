// 2025 Professional PDF Export Implementation for IPL
// Based on design recommendations from docs/design-recommendations-2025.md

export interface PDFExportOptions {
  scorecard: any;
  includeCharts?: boolean;
  includeGraphs?: boolean;
  professionalDesign?: boolean;
}

// 2025 Color Palette - Based on Design Recommendations
export const COLORS_2025 = {
  // Pantone 2025 Color of the Year: Mocha Mousse
  mochaMousse: [150, 75, 0],        // #964B00 - Primary accent
  etherealBlue: [168, 218, 220],     // #A8DADC - Secondary
  wheatfieldBeige: [245, 245, 220],  // #F5F5DC - Background
  moonlitGrey: [74, 74, 74],         // #4A4A4A - Text
  warmYellow: [255, 209, 102],       // #FFD166 - Highlights
  burntOrange: [230, 57, 70],        // #E63946 - Important data
  creamyPastel: [241, 250, 238],     // #F1FAEE - Subtle backgrounds
  
  // Professional alternatives
  professionalBlue: [44, 62, 80],    // #2C3E50
  lightGrey: [248, 249, 250],        // #F8F9FA
  successGreen: [46, 213, 115],      // #2ED573
  dangerRed: [239, 68, 68],          // #EF4444
  warningAmber: [245, 158, 11],      // #F59E0B
  infoBlue: [59, 130, 246],          // #3B82F6
  
  // IPL Brand Colors
  iplBlue: [0, 102, 204],           // IPL Blue
  iplOrange: [255, 102, 0],         // IPL Orange
  iplYellow: [255, 204, 0],         // IPL Yellow
};

// 2025 Typography Standards
export const TYPOGRAPHY_2025 = {
  title: 24,           // Main titles
  subtitle: 18,        // Section headers
  heading: 14,         // Subsection headers
  body: 12,           // Body text (optimal for print)
  caption: 10,        // Captions and footnotes
  small: 9,           // Small text
};

// 2025 Layout Standards
export const LAYOUT_2025 = {
  pageMargin: 72,      // 1 inch margins for professional documents
  lineHeight: 22,      // 1.2x spacing for better readability
  sectionSpacing: 30, // Increased spacing for visual hierarchy
};

export class ProfessionalPDFExporter {
  private doc: any;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private colors = COLORS_2025;
  private typography = TYPOGRAPHY_2025;
  private layout = LAYOUT_2025;

  constructor(jsPDF: any) {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - (this.layout.pageMargin * 2);
  }

  // Safe text function with validation
  private safeText(text: string, x: number, y: number, options?: any) {
    if (!isFinite(x) || !isFinite(y) || !text) {
      console.warn('Invalid parameters for text:', { text, x, y, options });
      return;
    }
    try {
      if (options) {
        this.doc.text(text, x, y, options);
      } else {
        this.doc.text(text, x, y);
      }
    } catch (error) {
      console.error('Error in text:', error, { text, x, y, options });
    }
  }

  // Safe setFillColor function with validation
  private safeSetFillColor(...args: number[]) {
    if (!args.every(arg => isFinite(arg) && arg >= 0 && arg <= 255)) {
      console.warn('Invalid parameters for setFillColor:', args);
      return;
    }
    try {
      this.doc.setFillColor(...args);
    } catch (error) {
      console.error('Error in setFillColor:', error, args);
    }
  }

  // Safe setTextColor function with validation
  private safeSetTextColor(...args: number[]) {
    if (!args.every(arg => isFinite(arg) && arg >= 0 && arg <= 255)) {
      console.warn('Invalid parameters for setTextColor:', args);
      return;
    }
    try {
      this.doc.setTextColor(...args);
    } catch (error) {
      console.error('Error in setTextColor:', error, args);
    }
  }

  // Safe rect function with validation
  private safeRect(x: number, y: number, width: number, height: number, style: string = 'F') {
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || 
        width <= 0 || height <= 0) {
      console.warn('Invalid parameters for rect:', { x, y, width, height, style });
      return;
    }
    try {
      this.doc.rect(x, y, width, height, style);
    } catch (error) {
      console.error('Error in rect:', error, { x, y, width, height, style });
    }
  }

  // Helper function to add gradient background
  private addGradientBackground(startY: number, height: number, color1: number[], color2: number[]) {
    this.safeSetFillColor(...color1);
    this.safeRect(0, startY, this.pageWidth, height / 2, 'F');
    this.safeSetFillColor(...color2);
    this.safeRect(0, startY + height / 2, this.pageWidth, height / 2, 'F');
  }

  // Helper function to add decorative pattern
  private addDecorativePattern(yPos: number, color: number[]) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(3);
    this.doc.line(40, yPos, this.pageWidth - 40, yPos);
    this.doc.setLineWidth(1);
    this.doc.setDrawColor(...color.map(c => c * 0.7));
    this.doc.line(40, yPos + 3, this.pageWidth - 40, yPos + 3);
  }

  // Helper function to add colorful text with 2025 design standards
  private addColorfulText(text: string, x: number, yPos: number, color: number[], fontSize: number, fontWeight: string = 'normal', align: 'left' = 'left') {
    this.safeSetTextColor(...color);
    this.doc.setFontSize(fontSize);
    
    // Set font based on weight - using professional fonts for 2025 standards
    if (fontWeight === 'bold') {
      this.doc.setFont('helvetica', 'bold'); // Professional sans-serif for accessibility
    } else if (fontWeight === 'italic') {
      this.doc.setFont('helvetica', 'italic');
    } else {
      this.doc.setFont('helvetica', 'normal');
    }
    
    // Left-align body text for accessibility (2025 standard)
    const finalAlign = (fontSize === this.typography.body || fontSize === this.typography.caption) ? 'left' : (align as any);
    this.safeText(text, x, yPos, { align: finalAlign });
  }

  // Helper to truncate text with ellipsis
  private truncateText(text: string, maxWidth: number): string {
    if (!text) return '';
    const textWidth = this.doc.getTextWidth(text);
    if (textWidth <= maxWidth) return text;
    
    let truncated = text;
    while (this.doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }

  // Add professional header with IPL branding
  private addHeader(scorecard: any) {
    let y = 60;
    
    // Add gradient background
    this.addGradientBackground(0, 120, this.colors.iplBlue, this.colors.iplOrange);
    
    // Add decorative pattern
    this.addDecorativePattern(110, this.colors.mochaMousse);
    
    // IPL Title
    this.addColorfulText('IPL SCORECARD', this.pageWidth / 2, y, [255, 255, 255], this.typography.title, 'bold', 'center' as any);
    y += this.typography.title + 10;
    
    // Match title
    const matchTitle = `${scorecard.matchInfo.team1.name} vs ${scorecard.matchInfo.team2.name}`;
    this.addColorfulText(matchTitle, this.pageWidth / 2, y, [255, 255, 255], this.typography.subtitle, 'bold', 'center' as any);
    y += this.typography.subtitle + 10;
    
    // Match info
    const matchInfo = `${scorecard.matchInfo.date} • ${scorecard.matchInfo.venue}`;
    this.addColorfulText(matchInfo, this.pageWidth / 2, y, [255, 255, 255], this.typography.body, 'normal', 'center' as any);
    
    return y + 40;
  }

  // Add match information section
  private addMatchInfo(scorecard: any, startY: number) {
    let y = startY;
    
    // Section header
    this.addColorfulText('MATCH INFORMATION', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.subtitle, 'bold');
    y += this.typography.subtitle + 10;
    
    // Decorative line
    this.addDecorativePattern(y, this.colors.etherealBlue);
    y += 20;
    
    // Match details in two columns
    const details = [
      ['Toss Winner', scorecard.matchInfo.toss?.winner || 'TBD'],
      ['Toss Decision', scorecard.matchInfo.toss?.decision || 'TBD'],
      ['Venue', scorecard.matchInfo.venue || 'TBD'],
      ['Date', scorecard.matchInfo.date || 'TBD'],
      ['Time', scorecard.matchInfo.time || 'TBD'],
      ['Status', scorecard.matchInfo.status || 'Upcoming']
    ];
    
    for (let i = 0; i < details.length; i += 2) {
      const leftDetail = details[i];
      const rightDetail = details[i + 1];
      
      // Left column
      this.addColorfulText(leftDetail[0] + ':', this.layout.pageMargin, y, this.colors.moonlitGrey, this.typography.body, 'bold');
      this.addColorfulText(leftDetail[1], this.layout.pageMargin + 100, y, this.colors.moonlitGrey, this.typography.body);
      
      // Right column
      if (rightDetail) {
        this.addColorfulText(rightDetail[0] + ':', this.pageWidth / 2, y, this.colors.moonlitGrey, this.typography.body, 'bold');
        this.addColorfulText(rightDetail[1], this.pageWidth / 2 + 100, y, this.colors.moonlitGrey, this.typography.body);
      }
      
      y += this.typography.body + 8;
    }
    
    return y + 20;
  }

  // Add innings section
  private addInnings(scorecard: any, startY: number) {
    let y = startY;
    
    for (const innings of scorecard.innings) {
      const battingTeamName = innings.battingTeamId === scorecard.matchInfo.team1.id ? 
        scorecard.matchInfo.team1.name : scorecard.matchInfo.team2.name;
      
      // Check if we need a new page
      if (y > this.pageHeight - 200) {
        this.doc.addPage();
        y = 60;
      }
      
      // Innings header
      this.addColorfulText(`INNINGS ${innings.inningsNumber} - ${battingTeamName}`, this.layout.pageMargin, y, this.colors.iplBlue, this.typography.subtitle, 'bold');
      y += this.typography.subtitle + 10;
      
      // Decorative line
      this.addDecorativePattern(y, this.colors.iplOrange);
      y += 20;
      
      // Batting section
      y = this.addBattingSection(innings, y);
      
      // Bowling section
      y = this.addBowlingSection(innings, y);
      
      // Extras and total
      y = this.addInningsSummary(innings, y);
      
      y += this.layout.sectionSpacing;
    }
    
    return y;
  }

  // Add batting section
  private addBattingSection(innings: any, startY: number) {
    let y = startY;
    
    this.addColorfulText('BATTING', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.heading, 'bold');
    y += this.typography.heading + 10;
    
    // Table headers
    const headers = ['Batter', 'Runs', 'Balls', '4s', '6s', 'SR', 'Dismissal'];
    const colWidths = [120, 40, 40, 30, 30, 40, 100];
    let x = this.layout.pageMargin;
    
    // Header row
    this.safeSetFillColor(...this.colors.wheatfieldBeige);
    this.safeRect(x, y - 15, this.contentWidth, 20, 'F');
    
    headers.forEach((header, i) => {
      this.addColorfulText(header, x + 5, y, this.colors.moonlitGrey, this.typography.caption, 'bold');
      x += colWidths[i];
    });
    y += 10;
    
    // Batting rows
    innings.batting.forEach((batter: any, index: number) => {
      if (y > this.pageHeight - 100) {
        this.doc.addPage();
        y = 60;
      }
      
      x = this.layout.pageMargin;
      
      // Alternate row colors
      if (index % 2 === 0) {
        this.safeSetFillColor(...this.colors.creamyPastel);
        this.safeRect(x, y - 12, this.contentWidth, 18, 'F');
      }
      
      const rowData = [
        this.truncateText(batter.name || 'Unknown', colWidths[0] - 10),
        (batter.runs || 0).toString(),
        (batter.balls || 0).toString(),
        (batter.fours || 0).toString(),
        (batter.sixes || 0).toString(),
        (batter.strikeRate || 0).toFixed(2),
        this.truncateText(batter.dismissal?.type || 'Not Out', colWidths[6] - 10)
      ];
      
      rowData.forEach((data, i) => {
        this.addColorfulText(data, x + 5, y, this.colors.moonlitGrey, this.typography.small);
        x += colWidths[i];
      });
      
      y += 18;
    });
    
    return y + 10;
  }

  // Add bowling section
  private addBowlingSection(innings: any, startY: number) {
    let y = startY;
    
    this.addColorfulText('BOWLING', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.heading, 'bold');
    y += this.typography.heading + 10;
    
    // Table headers
    const headers = ['Bowler', 'Overs', 'Runs', 'Wickets', 'Maidens', 'Economy'];
    const colWidths = [120, 40, 40, 40, 40, 50];
    let x = this.layout.pageMargin;
    
    // Header row
    this.safeSetFillColor(...this.colors.wheatfieldBeige);
    this.safeRect(x, y - 15, this.contentWidth, 20, 'F');
    
    headers.forEach((header, i) => {
      this.addColorfulText(header, x + 5, y, this.colors.moonlitGrey, this.typography.caption, 'bold');
      x += colWidths[i];
    });
    y += 10;
    
    // Bowling rows
    innings.bowling.forEach((bowler: any, index: number) => {
      if (y > this.pageHeight - 100) {
        this.doc.addPage();
        y = 60;
      }
      
      x = this.layout.pageMargin;
      
      // Alternate row colors
      if (index % 2 === 0) {
        this.safeSetFillColor(...this.colors.creamyPastel);
        this.safeRect(x, y - 12, this.contentWidth, 18, 'F');
      }
      
      const rowData = [
        this.truncateText(bowler.name || 'Unknown', colWidths[0] - 10),
        (bowler.overs || 0).toString(),
        (bowler.runs || 0).toString(),
        (bowler.wickets || 0).toString(),
        (bowler.maidens || 0).toString(),
        (bowler.economyRate || 0).toFixed(2)
      ];
      
      rowData.forEach((data, i) => {
        this.addColorfulText(data, x + 5, y, this.colors.moonlitGrey, this.typography.small);
        x += colWidths[i];
      });
      
      y += 18;
    });
    
    return y + 10;
  }

  // Add innings summary
  private addInningsSummary(innings: any, startY: number) {
    let y = startY;
    
    // Summary box
    this.safeSetFillColor(...this.colors.wheatfieldBeige);
    this.safeRect(this.layout.pageMargin, y - 10, this.contentWidth, 60, 'F');
    this.doc.setDrawColor(...this.colors.mochaMousse);
    this.doc.setLineWidth(2);
    this.safeRect(this.layout.pageMargin, y - 10, this.contentWidth, 60, 'S');
    
    // Total score
    const totalScore = `${innings.totalRuns || 0}/${innings.totalWickets || 0} (${innings.totalOvers || 0} overs)`;
    this.addColorfulText('TOTAL', this.layout.pageMargin + 10, y + 5, this.colors.mochaMousse, this.typography.heading, 'bold');
    this.addColorfulText(totalScore, this.layout.pageMargin + 10, y + 25, this.colors.burntOrange, this.typography.subtitle, 'bold');
    
    // Extras
    const totalExtras = (innings.extras?.wides || 0) + (innings.extras?.noBalls || 0) + 
                       (innings.extras?.byes || 0) + (innings.extras?.legByes || 0);
    this.addColorfulText('Extras', this.pageWidth / 2, y + 5, this.colors.mochaMousse, this.typography.heading, 'bold');
    this.addColorfulText(totalExtras.toString(), this.pageWidth / 2, y + 25, this.colors.warmYellow, this.typography.subtitle, 'bold');
    
    return y + 70;
  }

  // Add result section
  private addResult(scorecard: any, startY: number) {
    let y = startY;
    
    // Check if we need a new page
    if (y > this.pageHeight - 150) {
      this.doc.addPage();
      y = 60;
    }
    
    // Result header
    this.addColorfulText('MATCH RESULT', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.subtitle, 'bold');
    y += this.typography.subtitle + 10;
    
    // Decorative line
    this.addDecorativePattern(y, this.colors.etherealBlue);
    y += 20;
    
    // Result box
    this.safeSetFillColor(...this.colors.successGreen);
    this.safeRect(this.layout.pageMargin, y - 10, this.contentWidth, 80, 'F');
    this.doc.setDrawColor(...this.colors.mochaMousse);
    this.doc.setLineWidth(2);
    this.safeRect(this.layout.pageMargin, y - 10, this.contentWidth, 80, 'S');
    
    // Winner
    this.addColorfulText('Winner', this.layout.pageMargin + 10, y + 5, [255, 255, 255], this.typography.heading, 'bold');
    this.addColorfulText(scorecard.result?.winner || 'TBD', this.layout.pageMargin + 10, y + 25, [255, 255, 255], this.typography.subtitle, 'bold');
    
    // Margin
    this.addColorfulText('Margin', this.pageWidth / 2, y + 5, [255, 255, 255], this.typography.heading, 'bold');
    this.addColorfulText(scorecard.result?.margin || 'TBD', this.pageWidth / 2, y + 25, [255, 255, 255], this.typography.subtitle, 'bold');
    
    // Man of the Match
    if (scorecard.result?.manOfTheMatch) {
      y += 40;
      this.addColorfulText('Man of the Match', this.layout.pageMargin + 10, y, [255, 255, 255], this.typography.heading, 'bold');
      this.addColorfulText(scorecard.result.manOfTheMatch, this.layout.pageMargin + 10, y + 20, [255, 255, 255], this.typography.subtitle, 'bold');
    }
    
    return y + 100;
  }

  // Add footer
  private addFooter() {
    const footerY = this.pageHeight - 40;
    
    // Footer line
    this.doc.setDrawColor(...this.colors.mochaMousse);
    this.doc.setLineWidth(1);
    this.doc.line(this.layout.pageMargin, footerY, this.pageWidth - this.layout.pageMargin, footerY);
    
    // Footer text
    this.addColorfulText('IPL Scorecard Report', this.layout.pageMargin, footerY + 20, this.colors.moonlitGrey, this.typography.caption);
    this.addColorfulText(`Generated on ${new Date().toLocaleDateString()}`, this.pageWidth - this.layout.pageMargin - 100, footerY + 20, this.colors.moonlitGrey, this.typography.caption);
  }

  // Main export function
  export(scorecard: any): void {
    let y = this.addHeader(scorecard);
    y = this.addMatchInfo(scorecard, y);
    y = this.addInnings(scorecard, y);
    y = this.addResult(scorecard, y);
    this.addFooter();
    
    // Save the PDF
    const filename = `IPL-Scorecard-${scorecard.matchInfo.team1.name}-vs-${scorecard.matchInfo.team2.name}-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename);
  }
}

// Main export function for IPL scorecard
export async function exportScorecardPDF2025(scorecard: any) {
  try {
    console.log('Starting IPL 2025 Professional PDF export...');
    
    // Load jsPDF from CDN if not already present
    const loadJSPDF = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('window is undefined'));
        if ((window as any).jspdf) return resolve();
        const existing = document.querySelector('script[data-src="jspdf-cdn"]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Failed to load jsPDF')));
          return;
        }
        const script = document.createElement('script');
        script.setAttribute('data-src', 'jspdf-cdn');
        script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
      });
    };

    await loadJSPDF();
    
    const jspdfAny = (window as any).jspdf || (window as any).jsPDF || null;
    const jsPDFCtor = jspdfAny && jspdfAny.jsPDF ? jspdfAny.jsPDF : (window as any).jsPDF;
    
    if (!jsPDFCtor) {
      throw new Error('jsPDF not available - please check if jsPDF library is loaded');
    }

    console.log('jsPDF constructor found, creating IPL PDF document...');
    
    const exporter = new ProfessionalPDFExporter(jsPDFCtor);
    exporter.export(scorecard);
    
    console.log('IPL 2025 Professional PDF exported successfully');
    
  } catch (error) {
    console.error('Error exporting IPL PDF:', error);
    throw error;
  }
}
