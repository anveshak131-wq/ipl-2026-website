// Enhanced 2025 Professional PDF Export Implementation for IPL
// Based on design recommendations from docs/design-recommendations-2025.md
// Enhanced with modern UI/UX design principles and data visualization

export interface PDFExportOptions {
  scorecard: any;
  includeCharts?: boolean;
  includeGraphs?: boolean;
  professionalDesign?: boolean;
  enhancedVisuals?: boolean;
}

// Enhanced 2025 Color Palette with Modern UI/UX Principles
export const COLORS_2025 = {
  // Pantone 2025 Color of the Year: Mocha Mousse
  mochaMousse: [150, 75, 0],        // #964B00 - Primary accent
  etherealBlue: [168, 218, 220],     // #A8DADC - Secondary
  wheatfieldBeige: [245, 245, 220],  // #F5F5DC - Background
  moonlitGrey: [74, 74, 74],         // #4A4A4A - Text
  warmYellow: [255, 209, 102],       // #FFD166 - Highlights
  burntOrange: [230, 57, 70],        // #E63946 - Important data
  creamyPastel: [241, 250, 238],     // #F1FAEE - Subtle backgrounds
  
  // Professional alternatives with enhanced contrast
  professionalBlue: [44, 62, 80],    // #2C3E50
  lightGrey: [248, 249, 250],        // #F8F9FA
  successGreen: [46, 213, 115],      // #2ED573
  dangerRed: [239, 68, 68],          // #EF4444
  warningAmber: [245, 158, 11],      // #F59E0B
  infoBlue: [59, 130, 246],          // #3B82F6
  
  // Modern gradient colors
  gradientStart: [150, 75, 0],        // Mocha Mousse
  gradientEnd: [255, 209, 102],      // Warm Yellow
  shadowColor: [0, 0, 0, 30],        // Subtle shadow
  
  // IPL Brand Colors Enhanced
  iplBlue: [0, 102, 204],           // IPL Blue
  iplOrange: [255, 102, 0],         // IPL Orange
  iplYellow: [255, 204, 0],         // IPL Yellow
  iplPurple: [128, 0, 128],         // IPL Purple (new)
  iplTeal: [0, 128, 128],           // IPL Teal (new)
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
  private enhancedVisuals: boolean;

  constructor(jsPDF: any, enhancedVisuals: boolean = true) {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - (this.layout.pageMargin * 2);
    this.enhancedVisuals = enhancedVisuals;
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

  // Safe setDrawColor function with validation
  private safeSetDrawColor(...args: number[]) {
    if (!args.every(arg => isFinite(arg) && arg >= 0 && arg <= 255)) {
      console.warn('Invalid parameters for setDrawColor:', args);
      return;
    }
    try {
      this.doc.setDrawColor(...args);
    } catch (error) {
      console.error('Error in setDrawColor:', error, args);
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

  // Helper function to add modern gradient background with enhanced visuals
  private addGradientBackground(startY: number, height: number, color1: number[], color2: number[]) {
    if (this.enhancedVisuals) {
      // Create smooth gradient effect with multiple steps
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const ratio = i / steps;
        const color = color1.map((c, idx) => Math.round(c + (color2[idx] - c) * ratio));
        this.safeSetFillColor(...color);
        this.safeRect(0, startY + (height * i / steps), this.pageWidth, height / steps, 'F');
      }
    } else {
      // Fallback to simple gradient
      this.safeSetFillColor(...color1);
      this.safeRect(0, startY, this.pageWidth, height / 2, 'F');
      this.safeSetFillColor(...color2);
      this.safeRect(0, startY + height / 2, this.pageWidth, height / 2, 'F');
    }
  }

  // Helper function to draw diamond shape
  private drawDiamond(x: number, y: number, size: number, color: number[]) {
    this.doc.setDrawColor(...color);
    this.doc.setFillColor(...color);
    
    // Draw diamond as a rotated square
    const halfSize = size / 2;
    this.doc.moveTo(x, y - halfSize);
    this.doc.lineTo(x + halfSize, y);
    this.doc.lineTo(x, y + halfSize);
    this.doc.lineTo(x - halfSize, y);
    this.doc.closePath();
    this.doc.fill();
  }

  // Helper function to add modern decorative pattern with shapes
  private addDecorativePattern(yPos: number, color: number[]) {
    if (this.enhancedVisuals) {
      // Modern geometric pattern with circles and lines
      this.doc.setDrawColor(...color);
      this.doc.setLineWidth(3);
      
      // Main line
      this.doc.line(this.layout.pageMargin, yPos, this.pageWidth - this.layout.pageMargin, yPos);
      
      // Decorative circles at ends
      const circleRadius = 4;
      this.doc.setFillColor(...color);
      this.doc.circle(this.layout.pageMargin, yPos, circleRadius, 'F');
      this.doc.circle(this.pageWidth - this.layout.pageMargin, yPos, circleRadius, 'F');
      
      // Secondary line with reduced opacity
      this.doc.setDrawColor(...color.map(c => c * 0.7));
      this.doc.setLineWidth(1);
      this.doc.line(this.layout.pageMargin + 20, yPos + 3, this.pageWidth - this.layout.pageMargin - 20, yPos + 3);
      
      // Small decorative diamonds
      const diamondSize = 3;
      const diamondPositions = [this.pageWidth / 4, this.pageWidth / 2, this.pageWidth * 3 / 4];
      diamondPositions.forEach(x => {
        this.drawDiamond(x, yPos + 1.5, diamondSize, color);
      });
    } else {
      // Original pattern
      this.doc.setDrawColor(...color);
      this.doc.setLineWidth(3);
      this.doc.line(40, yPos, this.pageWidth - 40, yPos);
      this.doc.setLineWidth(1);
      this.doc.setDrawColor(...color.map(c => c * 0.7));
      this.doc.line(40, yPos + 3, this.pageWidth - 40, yPos + 3);
    }
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

  // Enhanced data visualization: Mini bar chart with animations
  private addMiniBarChart(x: number, y: number, width: number, height: number, data: number[], color: number[], labels?: string[]) {
    if (data.length === 0) return;
    
    // Validate parameters
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      console.warn('Invalid parameters for addMiniBarChart:', { x, y, width, height });
      return;
    }
    
    const maxValue = Math.max(...data);
    if (!isFinite(maxValue) || maxValue <= 0) {
      console.warn('Invalid data for addMiniBarChart:', data);
      return;
    }
    
    // Background with subtle gradient
    if (this.enhancedVisuals) {
      this.safeSetFillColor(250, 250, 250);
      this.safeRect(x, y, width, height, 'F');
      
      // Add subtle shadow effect
      this.safeSetFillColor(0, 0, 0, 10);
      this.safeRect(x + 2, y + 2, width, height, 'F');
    }
    
    const barWidth = width / data.length;
    const barSpacing = this.enhancedVisuals ? barWidth * 0.2 : 0;
    const actualBarWidth = barWidth - barSpacing;
    
    data.forEach((value, index) => {
      const barHeight = maxValue > 0 ? (value / maxValue) * (height - 20) : 0;
      const barX = x + (index * barWidth) + (barSpacing / 2);
      const barY = y + height - barHeight - 10;
      
      // Validate bar parameters
      if (isFinite(barX) && isFinite(barY) && isFinite(actualBarWidth) && isFinite(barHeight) && 
          actualBarWidth > 0 && barHeight >= 0) {
        
        // Enhanced bar with gradient effect
        if (this.enhancedVisuals) {
          // Create gradient effect for bars
          const gradientSteps = 5;
          for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            const gradientColor = color.map(c => Math.round(c + (255 - c) * ratio * 0.3));
            this.safeSetFillColor(...gradientColor);
            this.safeRect(barX, barY + (barHeight * i / gradientSteps), actualBarWidth, barHeight / gradientSteps, 'F');
          }
        } else {
          this.safeSetFillColor(...color);
          this.safeRect(barX, barY, actualBarWidth, barHeight, 'F');
        }
        
        // Add value label on top of bar
        if (value > 0) {
          this.safeSetTextColor(0, 0, 0);
          this.doc.setFontSize(8);
          this.safeText(value.toString(), barX + actualBarWidth / 2, barY - 2, { align: 'center' });
        }
        
        // Add label if provided
        if (labels && labels[index]) {
          this.safeSetTextColor(100, 100, 100);
          this.doc.setFontSize(7);
          const truncatedLabel = this.truncateText(labels[index], actualBarWidth);
          this.safeText(truncatedLabel, barX + actualBarWidth / 2, y + height - 2, { align: 'center' });
        }
      }
    });
    
    // Border
    this.safeSetDrawColor(100, 100, 100);
    this.safeRect(x, y, width, height, 'D');
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

  // Enhanced header with modern design elements and IPL branding
  private addHeader(scorecard: any) {
    let y = 60;
    
    // Add enhanced gradient background with modern colors
    this.addGradientBackground(0, 140, this.colors.gradientStart, this.colors.gradientEnd);
    
    // Add modern decorative pattern with shapes
    this.addDecorativePattern(120, this.colors.iplOrange);
    
    // Add modern geometric shapes in background
    if (this.enhancedVisuals) {
      // Add subtle circles as decorative elements
      this.doc.setFillColor(...this.colors.iplPurple);
      this.doc.circle(100, 80, 15, 'F');
      this.doc.circle(this.pageWidth - 100, 80, 15, 'F');
      
      // Add semi-transparent overlay for better text readability
      this.doc.setFillColor(255, 255, 255, 20);
      this.safeRect(0, 60, this.pageWidth, 80, 'F');
    }
    
    // IPL Title with enhanced typography
    this.addColorfulText('IPL SCORECARD', this.pageWidth / 2, y, [255, 255, 255], this.typography.title + 4, 'bold', 'center' as any);
    y += this.typography.title + 15;
    
    // Match title with better spacing
    const matchTitle = `${scorecard.matchInfo.team1.name} vs ${scorecard.matchInfo.team2.name}`;
    this.addColorfulText(matchTitle, this.pageWidth / 2, y, [255, 255, 255], this.typography.subtitle + 2, 'bold', 'center' as any);
    y += this.typography.subtitle + 15;
    
    // Match info with enhanced layout
    const matchInfo = `${scorecard.matchInfo.date} • ${scorecard.matchInfo.venue}`;
    this.addColorfulText(matchInfo, this.pageWidth / 2, y, [255, 255, 255], this.typography.body + 1, 'normal', 'center' as any);
    
    // Add modern decorative elements
    if (this.enhancedVisuals) {
      // Add small decorative diamonds at bottom of header
      const diamondPositions = [this.pageWidth / 3, this.pageWidth / 2, this.pageWidth * 2 / 3];
      diamondPositions.forEach(x => {
        this.drawDiamond(x, y + 20, 4, [255, 255, 255]);
      });
    }
    
    return y + 50;
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

  // Enhanced batting section with data visualization
  private addBattingSection(innings: any, startY: number) {
    let y = startY;
    
    this.addColorfulText('BATTING', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.heading, 'bold');
    y += this.typography.heading + 15;
    
    // Enhanced table headers with modern design
    const headers = ['Batter', 'Runs', 'Balls', '4s', '6s', 'SR', 'Dismissal'];
    const colWidths = [130, 45, 45, 35, 35, 45, 110];
    let x = this.layout.pageMargin;
    
    // Enhanced header row with gradient background
    if (this.enhancedVisuals) {
      this.safeSetFillColor(...this.colors.wheatfieldBeige);
      this.safeRect(this.layout.pageMargin, y - 18, this.contentWidth, 12, 'F');
      this.safeSetFillColor(...this.colors.creamyPastel);
      this.safeRect(this.layout.pageMargin, y - 6, this.contentWidth, 13, 'F');
    } else {
      this.safeSetFillColor(...this.colors.wheatfieldBeige);
      this.safeRect(this.layout.pageMargin, y - 18, this.contentWidth, 25, 'F');
    }
    
    // Add subtle border to header
    this.safeSetDrawColor(...this.colors.mochaMousse);
    this.doc.setLineWidth(1);
    this.safeRect(this.layout.pageMargin, y - 18, this.contentWidth, 25, 'S');
    
    headers.forEach((header, i) => {
      this.addColorfulText(header, x + 8, y, this.colors.moonlitGrey, this.typography.caption + 1, 'bold');
      x += colWidths[i];
    });
    y += 15;
    
    // Enhanced batting rows with better spacing and visual hierarchy
    innings.batting.forEach((batter: any, index: number) => {
      if (y > this.pageHeight - 120) {
        this.doc.addPage();
        y = 60;
      }
      
      x = this.layout.pageMargin;
      
      // Enhanced alternate row colors with subtle gradients
      if (this.enhancedVisuals) {
        if (index % 2 === 0) {
          this.safeSetFillColor(...this.colors.creamyPastel);
          this.safeRect(x, y - 15, this.contentWidth, 22, 'F');
        } else {
          this.safeSetFillColor(252, 252, 252);
          this.safeRect(x, y - 15, this.contentWidth, 22, 'F');
        }
        
        // Add subtle border to rows
        this.safeSetDrawColor(220, 220, 220);
        this.doc.setLineWidth(0.5);
        this.safeRect(x, y - 15, this.contentWidth, 22, 'S');
      } else {
        if (index % 2 === 0) {
          this.safeSetFillColor(...this.colors.creamyPastel);
          this.safeRect(x, y - 12, this.contentWidth, 18, 'F');
        }
      }
      
      // Captain indicator with modern design
      const playerName = batter.name || 'Unknown';
      const displayName = batter.isCaptain ? `${playerName} (c)` : playerName;
      
      const rowData = [
        this.truncateText(displayName, colWidths[0] - 15),
        (batter.runs || 0).toString(),
        (batter.balls || 0).toString(),
        (batter.fours || 0).toString(),
        (batter.sixes || 0).toString(),
        (batter.strikeRate || 0).toFixed(1),
        this.truncateText(batter.dismissal?.type || 'Not Out', colWidths[6] - 15)
      ];
      
      rowData.forEach((data, i) => {
        // Enhanced text styling for better readability
        if (i === 0) { // Player name
          this.addColorfulText(data, x + 8, y, this.colors.moonlitGrey, this.typography.small, 'bold');
        } else if (i === 5) { // Strike rate with color coding
          const sr = parseFloat(data);
          let srColor = this.colors.moonlitGrey;
          if (sr >= 130) srColor = this.colors.successGreen;
          else if (sr >= 100) srColor = this.colors.warningAmber;
          else if (sr < 70) srColor = this.colors.dangerRed;
          
          this.addColorfulText(data, x + 8, y, srColor, this.typography.small, 'bold');
        } else if (i === 1 && parseInt(data) >= 50) { // Runs >= 50 highlighted
          this.addColorfulText(data, x + 8, y, this.colors.burntOrange, this.typography.small, 'bold');
        } else if (i === 1 && parseInt(data) >= 100) { // Century highlighted more
          this.addColorfulText(data, x + 8, y, this.colors.iplOrange, this.typography.small + 1, 'bold');
        } else {
          this.addColorfulText(data, x + 8, y, this.colors.moonlitGrey, this.typography.small);
        }
        x += colWidths[i];
      });
      
      y += this.enhancedVisuals ? 22 : 18;
    });
    
    // Add mini runs distribution chart if enhanced visuals are enabled
    if (this.enhancedVisuals && innings.batting.length > 0) {
      y += 15;
      const runsData = innings.batting.map((b: any) => b.runs || 0);
      const playerNames = innings.batting.map((b: any) => b.name || 'Unknown');
      
      this.addColorfulText('RUNS DISTRIBUTION', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.caption, 'bold');
      y += 15;
      
      this.addMiniBarChart(this.layout.pageMargin, y, this.contentWidth, 60, runsData, this.colors.iplBlue, playerNames);
      y += 70;
    }
    
    return y + 20;
  }

  // Enhanced bowling section with data visualization
  private addBowlingSection(innings: any, startY: number) {
    let y = startY;
    
    this.addColorfulText('BOWLING', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.heading, 'bold');
    y += this.typography.heading + 15;
    
    // Enhanced table headers with modern design
    const headers = ['Bowler', 'Overs', 'Runs', 'Wickets', 'Maidens', 'Economy'];
    const colWidths = [130, 50, 45, 45, 45, 55];
    let x = this.layout.pageMargin;
    
    // Enhanced header row with gradient background
    if (this.enhancedVisuals) {
      this.safeSetFillColor(...this.colors.wheatfieldBeige);
      this.safeRect(this.layout.pageMargin, y - 18, this.contentWidth, 12, 'F');
      this.safeSetFillColor(...this.colors.creamyPastel);
      this.safeRect(this.layout.pageMargin, y - 6, this.contentWidth, 13, 'F');
    } else {
      this.safeSetFillColor(...this.colors.wheatfieldBeige);
      this.safeRect(this.layout.pageMargin, y - 18, this.contentWidth, 25, 'F');
    }
    
    // Add subtle border to header
    this.safeSetDrawColor(...this.colors.mochaMousse);
    this.doc.setLineWidth(1);
    this.safeRect(this.layout.pageMargin, y - 18, this.contentWidth, 25, 'S');
    
    headers.forEach((header, i) => {
      this.addColorfulText(header, x + 8, y, this.colors.moonlitGrey, this.typography.caption + 1, 'bold');
      x += colWidths[i];
    });
    y += 15;
    
    // Enhanced bowling rows with better spacing and visual hierarchy
    innings.bowling.forEach((bowler: any, index: number) => {
      if (y > this.pageHeight - 120) {
        this.doc.addPage();
        y = 60;
      }
      
      x = this.layout.pageMargin;
      
      // Enhanced alternate row colors with subtle gradients
      if (this.enhancedVisuals) {
        if (index % 2 === 0) {
          this.safeSetFillColor(...this.colors.creamyPastel);
          this.safeRect(x, y - 15, this.contentWidth, 22, 'F');
        } else {
          this.safeSetFillColor(252, 252, 252);
          this.safeRect(x, y - 15, this.contentWidth, 22, 'F');
        }
        
        // Add subtle border to rows
        this.safeSetDrawColor(220, 220, 220);
        this.doc.setLineWidth(0.5);
        this.safeRect(x, y - 15, this.contentWidth, 22, 'S');
      } else {
        if (index % 2 === 0) {
          this.safeSetFillColor(...this.colors.creamyPastel);
          this.safeRect(x, y - 12, this.contentWidth, 18, 'F');
        }
      }
      
      // Captain indicator with modern design
      const bowlerName = bowler.name || 'Unknown';
      const displayName = bowler.isCaptain ? `${bowlerName} (c)` : bowlerName;
      
      const rowData = [
        this.truncateText(displayName, colWidths[0] - 15),
        (bowler.overs || 0).toString(),
        (bowler.runs || 0).toString(),
        (bowler.wickets || 0).toString(),
        (bowler.maidens || 0).toString(),
        (bowler.economyRate || 0).toFixed(2)
      ];
      
      rowData.forEach((data, i) => {
        // Enhanced text styling for better readability
        if (i === 0) { // Bowler name
          this.addColorfulText(data, x + 8, y, this.colors.moonlitGrey, this.typography.small, 'bold');
        } else if (i === 5) { // Economy rate with color coding
          const economy = parseFloat(data);
          let economyColor = this.colors.moonlitGrey;
          if (economy <= 6) economyColor = this.colors.successGreen;
          else if (economy <= 8) economyColor = this.colors.warningAmber;
          else if (economy > 10) economyColor = this.colors.dangerRed;
          
          this.addColorfulText(data, x + 8, y, economyColor, this.typography.small, 'bold');
        } else if (i === 3 && parseInt(data) >= 3) { // 3+ wickets highlighted
          this.addColorfulText(data, x + 8, y, this.colors.burntOrange, this.typography.small, 'bold');
        } else if (i === 3 && parseInt(data) >= 5) { // 5+ wickets highlighted more
          this.addColorfulText(data, x + 8, y, this.colors.iplOrange, this.typography.small + 1, 'bold');
        } else {
          this.addColorfulText(data, x + 8, y, this.colors.moonlitGrey, this.typography.small);
        }
        x += colWidths[i];
      });
      
      y += this.enhancedVisuals ? 22 : 18;
    });
    
    // Add mini economy rate chart if enhanced visuals are enabled
    if (this.enhancedVisuals && innings.bowling.length > 0) {
      y += 15;
      const economyData = innings.bowling.map((b: any) => parseFloat((b.economyRate || 0).toFixed(2)));
      const bowlerNames = innings.bowling.map((b: any) => b.name || 'Unknown');
      
      this.addColorfulText('ECONOMY RATES', this.layout.pageMargin, y, this.colors.mochaMousse, this.typography.caption, 'bold');
      y += 15;
      
      this.addMiniBarChart(this.layout.pageMargin, y, this.contentWidth, 60, economyData, this.colors.iplTeal, bowlerNames);
      y += 70;
    }
    
    return y + 20;
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

  // Main export function with enhanced visuals
  export(scorecard: any): void {
    let y = this.addHeader(scorecard);
    y = this.addMatchInfo(scorecard, y);
    y = this.addInnings(scorecard, y);
    y = this.addResult(scorecard, y);
    this.addFooter();
    
    // Save the enhanced PDF with professional filename
    const timestamp = new Date().toISOString().split('T')[0];
    const matchTeams = `${scorecard.matchInfo.team1.name}-vs-${scorecard.matchInfo.team2.name}`;
    const filename = `IPL-Scorecard-${matchTeams}-${timestamp}.pdf`;
    this.doc.save(filename);
  }
}

// Main export function for IPL scorecard with enhanced visuals
export async function exportScorecardPDF2025(scorecard: any, enhancedVisuals: boolean = true) {
  try {
    console.log('Starting IPL 2025 Enhanced Professional PDF export...');
    
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

    console.log('jsPDF constructor found, creating enhanced IPL PDF document...');
    
    const exporter = new ProfessionalPDFExporter(jsPDFCtor, enhancedVisuals);
    exporter.export(scorecard);
    
    console.log('IPL 2025 Enhanced Professional PDF exported successfully');
    
  } catch (error) {
    console.error('Error exporting enhanced IPL PDF:', error);
    throw error;
  }
}
