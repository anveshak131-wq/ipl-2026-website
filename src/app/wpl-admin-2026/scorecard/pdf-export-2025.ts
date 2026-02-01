// 2025 Professional PDF Export Implementation
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
  private colors = COLORS_2025;
  private typography = TYPOGRAPHY_2025;
  private layout = LAYOUT_2025;

  constructor(jsPDF: any) {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Helper function to add professional text with 2025 standards
  private addProfessionalText(
    text: string, 
    x: number, 
    y: number, 
    color: number[], 
    fontSize: number, 
    fontWeight: string = 'normal', 
    align: 'left' | 'center' = 'left'
  ) {
    this.doc.setTextColor(...color);
    this.doc.setFontSize(fontSize);
    
    // Set font based on weight - using professional fonts for 2025 standards
    if (fontWeight === 'bold') {
      this.doc.setFont('helvetica', 'bold');
    } else if (fontWeight === 'italic') {
      this.doc.setFont('helvetica', 'italic');
    } else {
      this.doc.setFont('helvetica', 'normal');
    }
    
    // Left-align body text for accessibility (2025 standard)
    const finalAlign = (fontSize === this.typography.body || fontSize === this.typography.caption) ? 'left' : align;
    this.doc.text(text, x, y, { align: finalAlign });
  }

  // Helper function to add gradient background
  private addGradientBackground(startY: number, height: number, color1: number[], color2: number[]) {
    this.doc.setFillColor(...color1);
    this.doc.rect(0, startY, this.pageWidth, height / 2, 'F');
    this.doc.setFillColor(...color2);
    this.doc.rect(0, startY + height / 2, this.pageWidth, height / 2, 'F');
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

  // Generate professional PDF with 2025 design standards
  async generatePDF(options: PDFExportOptions): Promise<void> {
    const { scorecard } = options;
    
    let y = 60; // Increased top margin for professional layout
    
    // Professional Header with 2025 Design Standards
    this.addGradientBackground(0, 100, this.colors.mochaMousse, this.colors.etherealBlue);
    
    // Add subtle decorative pattern (minimalist approach for 2025)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    for (let i = 0; i < 8; i++) {
      const x = 50 + (i * (this.pageWidth - 100) / 7);
      const y = 20 + Math.random() * 60;
      this.doc.text('◆', x, y); // Professional diamond symbol
    }
    
    // Main title with 2025 typography standards
    this.addProfessionalText(
      'WPL 2026 PREMIUM SCORECARD', 
      this.pageWidth / 2, 
      35, 
      [255, 255, 255], 
      this.typography.title, 
      'bold', 
      'center'
    );
    this.addProfessionalText(
      'WOMEN\'S PREMIER LEAGUE', 
      this.pageWidth / 2, 
      60, 
      this.colors.warmYellow, 
      this.typography.subtitle, 
      'bold', 
      'center'
    );
    
    // Team names with professional background
    this.doc.setFillColor(...this.colors.creamyPastel);
    const teamNameBoxWidth = Math.min(450, this.pageWidth - 100);
    const teamNameBoxX = (this.pageWidth - teamNameBoxWidth) / 2;
    this.doc.roundedRect(teamNameBoxX, 75, teamNameBoxWidth, 30, 5, 5, 'F');
    
    // Smart team name truncation
    let teamNameText = `${scorecard.matchInfo.team1.name} vs ${scorecard.matchInfo.team2.name}`;
    const maxTeamNameLength = Math.floor(teamNameBoxWidth / 8);
    if (teamNameText.length > maxTeamNameLength) {
      teamNameText = teamNameText.substring(0, maxTeamNameLength - 3) + '...';
    }
    
    this.addProfessionalText(
      teamNameText, 
      this.pageWidth / 2, 
      95, 
      this.colors.moonlitGrey, 
      this.typography.heading, 
      'bold', 
      'center'
    );
    
    // Match Information Section with 2025 Design Standards
    y = 130;
    this.addProfessionalText(
      'MATCH INFORMATION', 
      this.pageWidth / 2, 
      y, 
      this.colors.mochaMousse, 
      this.typography.subtitle, 
      'bold', 
      'center'
    );
    this.addDecorativePattern(y + 8, this.colors.mochaMousse);
    y += 25;
    
    // Create info boxes with 2025 professional design
    const infoBoxes = [
      { 
        label: 'Venue', 
        value: scorecard.matchInfo.venue || 'Stadium', 
        color: this.colors.infoBlue,
        maxLength: 25
      },
      { 
        label: 'Date', 
        value: scorecard.matchInfo.date || 'TBD', 
        color: this.colors.successGreen,
        maxLength: 20
      },
      { 
        label: 'Time', 
        value: scorecard.matchInfo.time || 'TBD', 
        color: this.colors.warningAmber,
        maxLength: 15
      },
      { 
        label: 'Toss', 
        value: `${scorecard.matchInfo.toss?.winner || 'TBD'} won toss and chose to ${scorecard.matchInfo.toss?.decision || 'bat'}`, 
        color: this.colors.burntOrange,
        maxLength: 30
      }
    ];
    
    infoBoxes.forEach((box, index) => {
      const boxWidth = this.pageWidth / 2 - 120;
      const horizontalGap = 30;
      const verticalGap = 50;
      
      const xPos = 50 + (index % 2) * (boxWidth + horizontalGap);
      const yPos = y + Math.floor(index / 2) * verticalGap;
      
      // Truncate long values
      let displayValue = box.value;
      if (box.maxLength && displayValue.length > box.maxLength) {
        displayValue = displayValue.substring(0, box.maxLength - 3) + '...';
      }
      
      this.doc.setFillColor(...box.color);
      this.doc.roundedRect(xPos - 5, yPos - 15, boxWidth, 35, 3, 3, 'F');
      
      this.addProfessionalText(box.label, xPos, yPos, [255, 255, 255], this.typography.body, 'bold');
      this.addProfessionalText(displayValue, xPos, yPos + this.layout.lineHeight, [255, 255, 255], this.typography.caption);
    });
    
    y += 120;
    
    // Process each innings with 2025 professional design
    scorecard.innings.forEach((inn: any, innIndex: number) => {
      const battingTeamName = inn.battingTeamId === scorecard.matchInfo.team1.id ? 
        scorecard.matchInfo.team1.name : scorecard.matchInfo.team2.name;
      
      if (y > this.pageHeight - 250) { 
        this.doc.addPage(); 
        y = 40; 
      }
      
      // Innings Header with 2025 Professional Design
      this.addGradientBackground(y - 15, 50, this.colors.mochaMousse, this.colors.etherealBlue);
      
      // Truncate team name for header if too long
      let headerTeamName = battingTeamName.toUpperCase();
      const maxHeaderLength = 35;
      if (headerTeamName.length > maxHeaderLength) {
        headerTeamName = headerTeamName.substring(0, maxHeaderLength - 3) + '...';
      }
      
      this.addProfessionalText(
        `INNINGS ${inn.inningsNumber} - ${headerTeamName}`, 
        this.pageWidth / 2, 
        y + 15, 
        [255, 255, 255], 
        this.typography.subtitle, 
        'bold', 
        'center'
      );
      y += 60;
      
      // Batting Section with 2025 Design
      this.addProfessionalText('BATTING PERFORMANCE', this.pageWidth / 2, y, this.colors.infoBlue, 16, 'bold', 'center');
      this.addDecorativePattern(y + 8, this.colors.infoBlue);
      y += 25;
      
      // Batting Table
      this.doc.setFillColor(...this.colors.lightGrey);
      this.doc.roundedRect(40, y - 10, this.pageWidth - 80, 30, 3, 3, 'F');
      
      // Table Headers
      const battingHeaders = ['Batter', 'Runs', 'Balls', 'SR', '4s', '6s'];
      const headerWidths = [120, 60, 60, 60, 40, 40];
      let xPos = 50;
      
      battingHeaders.forEach((header, index) => {
        this.addProfessionalText(header, xPos, y, this.colors.moonlitGrey, this.typography.body, 'bold');
        xPos += headerWidths[index];
      });
      
      y += this.layout.lineHeight;
      
      // Batting Data
      inn.batting?.forEach((batter: any) => {
        if (y > this.pageHeight - 100) {
          this.doc.addPage();
          y = 40;
        }
        
        xPos = 50;
        const battingData = [
          batter.name || 'N/A',
          batter.runs?.toString() || '0',
          batter.balls?.toString() || '0',
          batter.strikeRate || '0.00',
          batter.fours?.toString() || '0',
          batter.sixes?.toString() || '0'
        ];
        
        battingData.forEach((data, index) => {
          this.addProfessionalText(data, xPos, y, this.colors.moonlitGrey, this.typography.body);
          xPos += headerWidths[index];
        });
        
        y += this.layout.lineHeight;
      });
      
      y += this.layout.sectionSpacing;
      
      // Bowling Section with 2025 Design
      this.addProfessionalText('BOWLING PERFORMANCE', this.pageWidth / 2, y, this.colors.successGreen, 16, 'bold', 'center');
      this.addDecorativePattern(y + 8, this.colors.successGreen);
      y += 25;
      
      // Bowling Table
      this.doc.setFillColor(...this.colors.lightGrey);
      this.doc.roundedRect(40, y - 10, this.pageWidth - 80, 30, 3, 3, 'F');
      
      // Table Headers
      const bowlingHeaders = ['Bowler', 'Overs', 'Runs', 'Wickets', 'Economy'];
      const bowlingWidths = [120, 60, 60, 60, 80];
      xPos = 50;
      
      bowlingHeaders.forEach((header, index) => {
        this.addProfessionalText(header, xPos, y, this.colors.moonlitGrey, this.typography.body, 'bold');
        xPos += bowlingWidths[index];
      });
      
      y += this.layout.lineHeight;
      
      // Bowling Data
      inn.bowling?.forEach((bowler: any) => {
        if (y > this.pageHeight - 100) {
          this.doc.addPage();
          y = 40;
        }
        
        xPos = 50;
        const bowlingData = [
          bowler.name || 'N/A',
          bowler.overs || '0.0',
          bowler.runs?.toString() || '0',
          bowler.wickets?.toString() || '0',
          bowler.economy || '0.00'
        ];
        
        bowlingData.forEach((data, index) => {
          this.addProfessionalText(data, xPos, y, this.colors.moonlitGrey, this.typography.body);
          xPos += bowlingWidths[index];
        });
        
        y += this.layout.lineHeight;
      });
      
      y += this.layout.sectionSpacing;
      
      // Fall of Wickets Section with 2025 Design
      if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
        this.addProfessionalText('FALL OF WICKETS', this.pageWidth / 2, y, this.colors.burntOrange, 16, 'bold', 'center');
        this.addDecorativePattern(y + 8, this.colors.burntOrange);
        y += 25;
        
        this.doc.setFillColor(...this.colors.creamyPastel);
        this.doc.roundedRect(40, y - 10, this.pageWidth - 80, 20, 3, 3, 'F');
        
        const fowHeaders = ['Player', 'Score', 'Over'];
        const fowWidths = [200, 100, 100];
        xPos = 50;
        
        fowHeaders.forEach((header, index) => {
          this.addProfessionalText(header, xPos, y, this.colors.moonlitGrey, this.typography.body, 'bold');
          xPos += fowWidths[index];
        });
        
        y += this.layout.lineHeight;
        
        inn.fallOfWickets.forEach((fow: any) => {
          if (y > this.pageHeight - 100) {
            this.doc.addPage();
            y = 40;
          }
          
          xPos = 50;
          const fowData = [
            fow.player || 'N/A',
            fow.score || '0',
            fow.over || '0.0'
          ];
          
          fowData.forEach((data, index) => {
            this.addProfessionalText(data, xPos, y, this.colors.moonlitGrey, this.typography.body);
            xPos += fowWidths[index];
          });
          
          y += this.layout.lineHeight;
        });
        
        y += this.layout.sectionSpacing;
      }
      
      // Powerplays Section with 2025 Design
      if (inn.powerplays) {
        this.addProfessionalText('POWERPLAYS', this.pageWidth / 2, y, this.colors.warningAmber, 16, 'bold', 'center');
        this.addDecorativePattern(y + 8, this.colors.warningAmber);
        y += 25;
        
        this.doc.setFillColor(...this.colors.creamyPastel);
        this.doc.roundedRect(40, y - 10, this.pageWidth - 80, 20, 3, 3, 'F');
        
        const ppHeaders = ['Type', 'Overs', 'Runs'];
        const ppWidths = [150, 150, 150];
        xPos = 50;
        
        ppHeaders.forEach((header, index) => {
          this.addProfessionalText(header, xPos, y, this.colors.moonlitGrey, this.typography.body, 'bold');
          xPos += ppWidths[index];
        });
        
        y += this.layout.lineHeight;
        
        const powerplayData = [
          ['Mandatory', inn.powerplays.mandatory?.overs || '0', inn.powerplays.mandatory?.runs?.toString() || '0'],
          ['Optional', inn.powerplays.optional?.overs || '0', inn.powerplays.optional?.runs?.toString() || '0']
        ];
        
        powerplayData.forEach((data) => {
          if (y > this.pageHeight - 100) {
            this.doc.addPage();
            y = 40;
          }
          
          xPos = 50;
          data.forEach((item, index) => {
            this.addProfessionalText(item, xPos, y, this.colors.moonlitGrey, this.typography.body);
            xPos += ppWidths[index];
          });
          
          y += this.layout.lineHeight;
        });
        
        y += this.layout.sectionSpacing;
      }
      
      // Partnerships Section with 2025 Design
      if (inn.partnerships && inn.partnerships.length > 0) {
        this.addProfessionalText('PARTNERSHIPS', this.pageWidth / 2, y, this.colors.warmYellow, 16, 'bold', 'center');
        this.addDecorativePattern(y + 8, this.colors.warmYellow);
        y += 25;
        
        this.doc.setFillColor(...this.colors.creamyPastel);
        this.doc.roundedRect(40, y - 10, this.pageWidth - 80, 20, 3, 3, 'F');
        
        const partHeaders = ['Batsman 1', 'Runs 1', 'Batsman 2', 'Runs 2', 'Total'];
        const partWidths = [120, 80, 120, 80, 80];
        xPos = 50;
        
        partHeaders.forEach((header, index) => {
          this.addProfessionalText(header, xPos, y, this.colors.moonlitGrey, this.typography.body, 'bold');
          xPos += partWidths[index];
        });
        
        y += this.layout.lineHeight;
        
        inn.partnerships.forEach((partnership: any) => {
          if (y > this.pageHeight - 100) {
            this.doc.addPage();
            y = 40;
          }
          
          xPos = 50;
          const partData = [
            partnership.batsman1 || 'N/A',
            partnership.batsman1Runs || '0',
            partnership.batsman2 || 'N/A',
            partnership.batsman2Runs || '0',
            partnership.totalRuns || '0'
          ];
          
          partData.forEach((data, index) => {
            this.addProfessionalText(data, xPos, y, this.colors.moonlitGrey, this.typography.body);
            xPos += partWidths[index];
          });
          
          y += this.layout.lineHeight;
        });
        
        y += this.layout.sectionSpacing;
      }
    });
    
    // Match Result Section with 2025 Design
    if (scorecard.result) {
      if (y > this.pageHeight - 150) { 
        this.doc.addPage(); 
        y = 40; 
      }
      
      this.addGradientBackground(y - 15, 50, this.colors.mochaMousse, this.colors.etherealBlue);
      this.addProfessionalText('MATCH RESULT', this.pageWidth / 2, y + 15, [255, 255, 255], 18, 'bold', 'center');
      y += 70;
      
      this.addProfessionalText(`Winner: ${scorecard.result?.winner || 'To be determined'}`, this.pageWidth / 2, y, this.colors.successGreen, 14, 'bold', 'center');
      y += this.layout.lineHeight;
      this.addProfessionalText(`Margin: ${scorecard.result?.margin || 'N/A'}`, this.pageWidth / 2, y, this.colors.infoBlue, 12, 'center');
      y += this.layout.lineHeight;
      this.addProfessionalText(`Man of the Match: ${scorecard.result?.manOfTheMatch || 'N/A'}`, this.pageWidth / 2, y, this.colors.warmYellow, 12, 'center');
      y += this.layout.lineHeight * 2;
    }
    
    // Enhanced Footer with 2025 Design
    const footerY = this.pageHeight - 40;
    this.addGradientBackground(footerY - 10, 50, this.colors.professionalBlue, this.colors.moonlitGrey);
    this.addProfessionalText('Generated on SportsUP18', this.pageWidth / 2, footerY + 10, [255, 255, 255], 10, 'italic', 'center');
    this.addProfessionalText('© 2026 SportsUP18. All rights reserved.', this.pageWidth / 2, footerY + 25, this.colors.warmYellow, 9, 'italic', 'center');
    
    // Save the PDF with professional filename
    const filename = `WPL_Professional_Scorecard_${scorecard.matchInfo.team1.shortName || 'Team1'}_vs_${scorecard.matchInfo.team2.shortName || 'Team2'}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename);
    
    console.log('2025 Professional PDF generated successfully:', filename);
  }
}

// Export function for use in the main component
export async function exportScorecardPDF2025(scorecard: any): Promise<void> {
  try {
    // Load jsPDF dynamically
    const jspdfAny = (window as any).jspdf || (window as any).jsPDF || null;
    const jsPDFCtor = jspdfAny && jspdfAny.jsPDF ? jspdfAny.jsPDF : (window as any).jsPDF;
    
    if (!jsPDFCtor) {
      throw new Error('jsPDF not available - please check if jsPDF library is loaded');
    }
    
    const exporter = new ProfessionalPDFExporter(jsPDFCtor);
    await exporter.generatePDF({ scorecard });
    
  } catch (error) {
    console.error('Error exporting 2025 Professional PDF:', error);
    throw error;
  }
}
