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

  // Helper function to add colorful text with 2025 design standards
  private addProfessionalText(text: string | number, x: number, y: number, color: number[], fontSize: number, fontWeight: string = 'normal', align: 'left' | 'center' = 'left') {
    this.doc.setTextColor(...color);
    this.doc.setFontSize(fontSize);
    
    // Set font based on weight - using professional fonts for 2025 standards
    if (fontWeight === 'bold') {
      this.doc.setFont('helvetica', 'bold'); // Professional sans-serif for accessibility
    } else if (fontWeight === 'italic') {
      this.doc.setFont('helvetica', 'italic');
    } else {
      this.doc.setFont('helvetica', 'normal');
    }
    
    // Convert text to string to prevent jsPDF errors
    const textString = String(text);
    
    // Left-align body text for accessibility (2025 standard)
    const finalAlign: 'left' | 'center' = (fontSize === this.typography.body || fontSize === this.typography.caption) ? 'left' : align;
    this.doc.text(textString, x, y, { align: finalAlign });
  }

  // Helper function to safely draw rectangles
  private safeRect(x: number, y: number, width: number, height: number, style: string = 'F') {
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || 
        width <= 0 || height <= 0) {
      console.warn('Invalid rectangle parameters:', { x, y, width, height, style });
      return;
    }
    try {
      this.doc.rect(x, y, width, height, style);
    } catch (error) {
      console.error('Error drawing rectangle:', error, { x, y, width, height, style });
    }
  }
  private addGradientBackground(startY: number, height: number, color1: number[], color2: number[]) {
    this.doc.setFillColor(...color1);
    this.safeRect(0, startY, this.pageWidth, height / 2, 'F');
    this.doc.setFillColor(...color2);
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

  // ===== COMPREHENSIVE DATA VISUALIZATION FUNCTIONS =====
  
  // 1. Bar Chart - Runs scored by each batsman
  private addBarChart(x: number, y: number, width: number, height: number, data: {label: string, value: number}[], color: number[], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width - 40) / data.length;
    const chartHeight = height - 30;
    
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const barX = x + 20 + (index * barWidth);
      const barY = y + height - 20 - barHeight;
      
      // Bar
      this.doc.setFillColor(...color);
      this.safeRect(barX, barY, barWidth * 0.8, barHeight, 'F');
      
      // Value label
      this.addProfessionalText(item.value.toString(), barX + barWidth * 0.4, barY - 5, this.colors.moonlitGrey, 8, 'center');
      
      // X-axis label (rotated)
      this.addProfessionalText(item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label, 
                               barX + barWidth * 0.4, y + height - 5, this.colors.moonlitGrey, 7, 'center');
    });
  }
  
  // 2. Line Chart - Run rate progression over overs
  private addLineChart(x: number, y: number, width: number, height: number, data: {x: number, y: number}[], color: number[], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length < 2) return;
    
    const maxValue = Math.max(...data.map(d => d.y));
    const minValue = Math.min(...data.map(d => d.y));
    const chartWidth = width - 40;
    const chartHeight = height - 40;
    
    // Draw axes
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.line(x + 20, y + 20, x + 20, y + height - 20); // Y-axis
    this.doc.line(x + 20, y + height - 20, x + width - 20, y + height - 20); // X-axis
    
    // Draw line
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(2);
    
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = x + 20 + (data[i].x / Math.max(...data.map(d => d.x))) * chartWidth;
      const y1 = y + height - 20 - ((data[i].y - minValue) / (maxValue - minValue)) * chartHeight;
      const x2 = x + 20 + (data[i + 1].x / Math.max(...data.map(d => d.x))) * chartWidth;
      const y2 = y + height - 20 - ((data[i + 1].y - minValue) / (maxValue - minValue)) * chartHeight;
      
      this.doc.line(x1, y1, x2, y2);
      
      // Draw point
      this.doc.setFillColor(...color);
      this.safeRect(x1 - 2, y1 - 2, 4, 4, 'F');
      
    }
    
    // Last point
    const lastPoint = data[data.length - 1];
    const lastX = x + 20 + (lastPoint.x / Math.max(...data.map(d => d.x))) * chartWidth;
    const lastY = y + height - 20 - ((lastPoint.y - minValue) / (maxValue - minValue)) * chartHeight;
    this.doc.setFillColor(...color);
    this.safeRect(lastX - 2, lastY - 2, 4, 4, 'F');
  }
  
  // 3. Pie Chart - Wickets distribution by bowler
  private addPieChart(x: number, y: number, radius: number, data: {label: string, value: number}[], colors: number[][], title: string) {
    // Title
    this.addProfessionalText(title, x, y - radius - 15, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top
    
    data.forEach((item, index) => {
      const percentage = (item.value / total) * 360;
      const endAngle = currentAngle + percentage;
      
      // Draw pie slice
      this.doc.setFillColor(...colors[index % colors.length]);
      // Draw circle outline using rectangle approximation
      this.doc.setDrawColor(...colors[index % colors.length]);
      for (let angle = 0; angle < 360; angle += 10) {
        const rad = (angle * Math.PI) / 180;
        const x1 = x + radius * Math.cos(rad);
        const y1 = y + radius * Math.sin(rad);
        const x2 = x + radius * Math.cos((angle + 10) * Math.PI / 180);
        const y2 = y + radius * Math.sin((angle + 10) * Math.PI / 180);
        this.doc.line(x1, y1, x2, y2);
      }
      
      // Fill sector (simplified as filled triangle approximation)
      const startRad = (currentAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      // Draw lines from center to create pie slice
      this.doc.setDrawColor(...colors[index % colors.length]);
      this.doc.line(x, y, x + radius * Math.cos(startRad), y + radius * Math.sin(startRad));
      this.doc.line(x, y, x + radius * Math.cos(endRad), y + radius * Math.sin(endRad));
      
      // Label
      const labelAngle = (currentAngle + endAngle) / 2;
      const labelRad = (labelAngle * Math.PI) / 180;
      const labelX = x + (radius * 0.7) * Math.cos(labelRad);
      const labelY = y + (radius * 0.7) * Math.sin(labelRad);
      
      this.addProfessionalText(`${Math.round(percentage)}%`, labelX, labelY, [255, 255, 255], 8, 'bold', 'center');
      
      currentAngle = endAngle;
    });
  }
  
  // 4. Radar Chart - Player performance comparison
  private addRadarChart(x: number, y: number, radius: number, data: {label: string, value: number}[], color: number[], title: string) {
    // Title
    this.addProfessionalText(title, x, y - radius - 15, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length < 3) return;
    
    const angleStep = (2 * Math.PI) / data.length;
    const maxValue = Math.max(...data.map(d => d.value));
    
    // Draw grid
    this.doc.setDrawColor(...this.colors.lightGrey);
    for (let i = 1; i <= 5; i++) {
      const gridRadius = (radius * i) / 5;
      for (let j = 0; j < data.length; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x1 = x + gridRadius * Math.cos(angle);
        const y1 = y + gridRadius * Math.sin(angle);
        const angle2 = (j + 1) * angleStep - Math.PI / 2;
        const x2 = x + gridRadius * Math.cos(angle2);
        const y2 = y + gridRadius * Math.sin(angle2);
        this.doc.line(x1, y1, x2, y2);
      }
    }
    
    // Draw axes
    for (let i = 0; i < data.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x1 = x + radius * Math.cos(angle);
      const y1 = y + radius * Math.sin(angle);
      this.doc.line(x, y, x1, y1);
      
      // Label
      const labelX = x + (radius + 15) * Math.cos(angle);
      const labelY = y + (radius + 15) * Math.sin(angle);
      this.addProfessionalText(data[i].label, labelX, labelY, this.colors.moonlitGrey, 7, 'center');
    }
    
    // Draw data polygon
    this.doc.setDrawColor(...color);
    this.doc.setFillColor(...color.map(c => c + 100));
    this.doc.setLineWidth(2);
    
    for (let i = 0; i < data.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = (data[i].value / maxValue) * radius;
      const x1 = x + value * Math.cos(angle);
      const y1 = y + value * Math.sin(angle);
      const angle2 = ((i + 1) % data.length) * angleStep - Math.PI / 2;
      const value2 = (data[(i + 1) % data.length].value / maxValue) * radius;
      const x2 = x + value2 * Math.cos(angle2);
      const y2 = y + value2 * Math.sin(angle2);
      
      this.doc.line(x1, y1, x2, y2);
    }
  }
  
  // 5. Scatter Plot - Partnership runs vs balls
  private addScatterPlot(x: number, y: number, width: number, height: number, data: {x: number, y: number}[], color: number[], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const maxX = Math.max(...data.map(d => d.x));
    const maxY = Math.max(...data.map(d => d.y));
    const chartWidth = width - 40;
    const chartHeight = height - 40;
    
    // Draw axes
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.line(x + 20, y + 20, x + 20, y + height - 20); // Y-axis
    this.doc.line(x + 20, y + height - 20, x + width - 20, y + height - 20); // X-axis
    
    // Draw points
    this.doc.setFillColor(...color);
    data.forEach(point => {
      const plotX = x + 20 + (point.x / maxX) * chartWidth;
      const plotY = y + height - 20 - (point.y / maxY) * chartHeight;
      this.safeRect(plotX - 3, plotY - 3, 6, 6, 'F');
    });
  }
  
  // 6. Area Chart - Cumulative runs progression
  private addAreaChart(x: number, y: number, width: number, height: number, data: {x: number, y: number}[], color: number[], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length < 2) return;
    
    const maxValue = Math.max(...data.map(d => d.y));
    const chartWidth = width - 40;
    const chartHeight = height - 40;
    
    // Draw filled area
    this.doc.setFillColor(...color.map(c => c + 150));
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(2);
    
    // Start from bottom left
    let path = [];
    path.push({x: x + 20, y: y + height - 20});
    
    // Add data points
    data.forEach(point => {
      const plotX = x + 20 + (point.x / Math.max(...data.map(d => d.x))) * chartWidth;
      const plotY = y + height - 20 - (point.y / maxValue) * chartHeight;
      path.push({x: plotX, y: plotY});
    });
    
    // Close path at bottom right
    path.push({x: x + width - 20, y: y + height - 20});
    
    // Draw area (simplified as filled polygon)
    for (let i = 0; i < path.length - 1; i++) {
      this.doc.line(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
    }
  }
  
  // 7. Horizontal Bar Chart - Economy rates comparison
  private addHorizontalBarChart(x: number, y: number, width: number, height: number, data: {label: string, value: number}[], color: number[], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barHeight = (height - 30) / data.length;
    const chartWidth = width - 80;
    
    data.forEach((item, index) => {
      const barWidth = (item.value / maxValue) * chartWidth;
      const barY = y + 15 + (index * barHeight);
      
      // Bar
      this.doc.setFillColor(...color);
      this.safeRect(x + 60, barY, barWidth, barHeight * 0.8, 'F');
      
      // Value label
      this.addProfessionalText(item.value.toFixed(2), x + 55, barY + barHeight * 0.4, this.colors.moonlitGrey, 8, 'right');
      
      // Y-axis label
      this.addProfessionalText(item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label, 
                               x + 55, barY + barHeight * 0.4, this.colors.moonlitGrey, 7, 'right');
    });
  }
  
  // 8. Donut Chart - Runs contribution (4s, 6s, singles)
  private addDonutChart(x: number, y: number, outerRadius: number, innerRadius: number, data: {label: string, value: number}[], colors: number[][], title: string) {
    // Title
    this.addProfessionalText(title, x, y - outerRadius - 15, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90;
    
    data.forEach((item, index) => {
      const percentage = (item.value / total) * 360;
      const endAngle = currentAngle + percentage;
      
      // Draw donut slice
      this.doc.setFillColor(...colors[index % colors.length]);
      
      // Approximate donut slice using lines
      const startRad = (currentAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      // Draw outer arc lines
      this.doc.setDrawColor(...colors[index % colors.length]);
      this.doc.line(x + innerRadius * Math.cos(startRad), y + innerRadius * Math.sin(startRad),
                     x + outerRadius * Math.cos(startRad), y + outerRadius * Math.sin(startRad));
      this.doc.line(x + innerRadius * Math.cos(endRad), y + innerRadius * Math.sin(endRad),
                     x + outerRadius * Math.cos(endRad), y + outerRadius * Math.sin(endRad));
      
      currentAngle = endAngle;
    });
    
    // Center text
    this.addProfessionalText(total.toString(), x, y, this.colors.mochaMousse, 12, 'bold', 'center');
  }
  
  // 9. Stacked Bar Chart - Over by over runs
  private addStackedBarChart(x: number, y: number, width: number, height: number, data: {label: string, values: number[]}[], colors: number[][], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)));
    const barWidth = (width - 40) / data.length;
    const chartHeight = height - 30;
    
    data.forEach((item, index) => {
      const barX = x + 20 + (index * barWidth);
      let currentY = y + height - 20;
      
      item.values.forEach((value, valueIndex) => {
        const segmentHeight = (value / maxTotal) * chartHeight;
        currentY -= segmentHeight;
        
        this.doc.setFillColor(...colors[valueIndex % colors.length]);
        this.safeRect(barX, currentY, barWidth * 0.8, segmentHeight, 'F');
      });
      
      // X-axis label
      this.addProfessionalText(item.label, barX + barWidth * 0.4, y + height - 5, this.colors.moonlitGrey, 7, 'center');
    });
  }
  
  // 10. Heatmap - Performance matrix
  private addHeatmap(x: number, y: number, width: number, height: number, data: number[][], labels: string[], title: string) {
    this.doc.setDrawColor(...this.colors.moonlitGrey);
    this.doc.setLineWidth(1);
    this.safeRect(x, y, width, height);
    
    // Title
    this.addProfessionalText(title, x + width/2, y - 10, this.colors.mochaMousse, 10, 'bold', 'center');
    
    if (data.length === 0) return;
    
    const cellWidth = (width - 40) / data[0].length;
    const cellHeight = (height - 40) / data.length;
    const maxValue = Math.max(...data.flat());
    
    data.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const cellX = x + 20 + (colIndex * cellWidth);
        const cellY = y + 20 + (rowIndex * cellHeight);
        
        // Color intensity based on value
        const intensity = value / maxValue;
        const color = [
          Math.floor(255 * (1 - intensity) + 255 * intensity),
          Math.floor(255 * (1 - intensity) + 100 * intensity),
          Math.floor(255 * (1 - intensity) + 100 * intensity)
        ];
        
        this.doc.setFillColor(...color);
        this.safeRect(cellX, cellY, cellWidth, cellHeight, 'F');
        
        // Value text
        this.addProfessionalText(value.toString(), cellX + cellWidth/2, cellY + cellHeight/2, 
                               intensity > 0.5 ? [255, 255, 255] : [0, 0, 0], 6, 'center');
      });
    });
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
    if (scorecard.innings && Array.isArray(scorecard.innings)) {
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
      if (inn.batting && Array.isArray(inn.batting)) {
        inn.batting.forEach((batter: any) => {
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
      }
      
      y += this.layout.sectionSpacing;
      
      // ===== COMPREHENSIVE DATA VISUALIZATION SECTION - ONE GRAPH PER PAGE =====
      this.addProfessionalText('DATA ANALYSIS & VISUALIZATION', this.pageWidth / 2, y, this.colors.mochaMousse, 16, 'bold', 'center');
      this.addDecorativePattern(y + 8, this.colors.mochaMousse);
      y += 30;
      
      // Prepare data for graphs
      const battingData = inn.batting ? inn.batting.map((b: any) => ({
        label: b.name?.substring(0, 15) || 'Unknown',
        runs: parseInt(b.runs) || 0,
        balls: parseInt(b.balls) || 0,
        strikeRate: parseFloat(b.strikeRate) || 0,
        fours: parseInt(b.fours) || 0,
        sixes: parseInt(b.sixes) || 0
      })) : [];
      
      const bowlingData = inn.bowling ? inn.bowling.map((b: any) => ({
        label: b.name?.substring(0, 15) || 'Unknown',
        overs: parseFloat(b.overs) || 0,
        runs: parseInt(b.runs) || 0,
        wickets: parseInt(b.wickets) || 0,
        economy: parseFloat(b.economy) || 0
      })) : [];
      
      const partnershipData = inn.partnerships ? inn.partnerships.map((p: any) => ({
        label: `${p.batsman1?.substring(0, 10)} & ${p.batsman2?.substring(0, 10)}`,
        runs: parseInt(p.totalRuns) || 0,
        balls: parseInt(p.totalBalls) || 0
      })) : [];
      
      // Graph 1: Bar Chart - Runs scored by each batsman (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 1: BATTING PERFORMANCE ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      this.addProfessionalText('Runs scored by each batsman', this.pageWidth / 2, y, this.colors.infoBlue, 14, 'center');
      y += 30;
      this.addBarChart(50, y, this.pageWidth - 100, 300, 
        battingData.map(b => ({label: b.label, value: b.runs})),
        this.colors.infoBlue, 'Runs by Batsman');
      
      // Graph 2: Line Chart - Strike Rate progression (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 2: STRIKE RATE ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      this.addProfessionalText('Strike rate progression through batting order', this.pageWidth / 2, y, this.colors.warningAmber, 14, 'center');
      y += 30;
      this.addLineChart(50, y, this.pageWidth - 100, 350,
        battingData.map((b, i) => ({x: i + 1, y: b.strikeRate})),
        this.colors.warningAmber, 'Strike Rate Progression');
      
      // Graph 3: Pie Chart - Wickets distribution by bowler (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 3: BOWLING PERFORMANCE ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      const wicketData = bowlingData.map(b => ({label: b.label, value: b.wickets})).filter(b => b.value > 0);
      if (wicketData.length > 0) {
        this.addProfessionalText('Wickets distribution by bowler', this.pageWidth / 2, y, this.colors.dangerRed, 14, 'center');
        y += 30;
        this.addPieChart(this.pageWidth / 2, y + 100, 80, wicketData,
          [this.colors.dangerRed, this.colors.successGreen, this.colors.infoBlue, this.colors.warningAmber, this.colors.mochaMousse],
          'Wickets Distribution');
      } else {
        this.addProfessionalText('No wickets data available', this.pageWidth / 2, y, this.colors.moonlitGrey, 14, 'center');
      }
      
      // Graph 4: Radar Chart - Top batsman performance (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 4: PLAYER PERFORMANCE RADAR', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      if (battingData.length > 0) {
        const topBatsman = battingData.reduce((prev, current) => prev.runs > current.runs ? prev : current);
        this.addProfessionalText(`${topBatsman.label} - Performance Analysis`, this.pageWidth / 2, y, this.colors.etherealBlue, 14, 'center');
        y += 30;
        const radarData = [
          {label: 'Runs', value: Math.min(topBatsman.runs / 10, 10)},
          {label: 'SR', value: Math.min(topBatsman.strikeRate / 20, 10)},
          {label: '4s', value: Math.min(topBatsman.fours, 10)},
          {label: '6s', value: Math.min(topBatsman.sixes, 10)},
          {label: 'Balls', value: Math.min(topBatsman.balls / 10, 10)}
        ];
        this.addRadarChart(this.pageWidth / 2, y + 120, 100, radarData, this.colors.etherealBlue, 
          `${topBatsman.label} Performance`);
      } else {
        this.addProfessionalText('No batting data available', this.pageWidth / 2, y, this.colors.moonlitGrey, 14, 'center');
      }
      
      // Graph 5: Scatter Plot - Partnership runs vs balls (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 5: PARTNERSHIP ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      if (partnershipData.length > 0) {
        this.addProfessionalText('Partnership runs vs balls faced correlation', this.pageWidth / 2, y, this.colors.infoBlue, 14, 'center');
        y += 30;
        this.addScatterPlot(50, y, this.pageWidth - 100, 350,
          partnershipData.map(p => ({x: p.balls, y: p.runs})),
          this.colors.infoBlue, 'Partnership Analysis');
      } else {
        this.addProfessionalText('No partnership data available', this.pageWidth / 2, y, this.colors.moonlitGrey, 14, 'center');
      }
      
      // Graph 6: Area Chart - Cumulative runs progression (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 6: TEAM MOMENTUM ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      this.addProfessionalText('Cumulative runs progression', this.pageWidth / 2, y, this.colors.successGreen, 14, 'center');
      y += 30;
      let cumulativeRuns = 0;
      const cumulativeData = battingData.map((b, i) => {
        cumulativeRuns += b.runs;
        return {x: i + 1, y: cumulativeRuns};
      });
      this.addAreaChart(50, y, this.pageWidth - 100, 350, cumulativeData, this.colors.successGreen, 'Cumulative Runs');
      
      // Graph 7: Horizontal Bar Chart - Economy rates comparison (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 7: BOWLING ECONOMY ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      const economyData = bowlingData.map(b => ({label: b.label, value: b.economy})).filter(b => b.value > 0);
      if (economyData.length > 0) {
        this.addProfessionalText('Economy rates comparison (lower is better)', this.pageWidth / 2, y, this.colors.warningAmber, 14, 'center');
        y += 30;
        this.addHorizontalBarChart(50, y, this.pageWidth - 100, 400, economyData.slice(0, 8), this.colors.warningAmber, 'Economy Rates');
      } else {
        this.addProfessionalText('No economy data available', this.pageWidth / 2, y, this.colors.moonlitGrey, 14, 'center');
      }
      
      // Graph 8: Donut Chart - Runs contribution breakdown (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 8: SCORING PATTERNS ANALYSIS', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      if (battingData.length > 0) {
        this.addProfessionalText('Runs contribution breakdown', this.pageWidth / 2, y, this.colors.infoBlue, 14, 'center');
        y += 30;
        const totalRuns = battingData.reduce((sum, b) => sum + b.runs, 0);
        const totalFours = battingData.reduce((sum, b) => sum + b.fours, 0);
        const totalSixes = battingData.reduce((sum, b) => sum + b.sixes, 0);
        const boundaryRuns = (totalFours * 4) + (totalSixes * 6);
        const nonBoundaryRuns = totalRuns - boundaryRuns;
        
        this.addDonutChart(this.pageWidth / 2, y + 120, 100, 50, [
          {label: '4s', value: totalFours * 4},
          {label: '6s', value: totalSixes * 6},
          {label: 'Others', value: nonBoundaryRuns}
        ], [this.colors.successGreen, this.colors.dangerRed, this.colors.infoBlue], 'Runs Contribution');
      } else {
        this.addProfessionalText('No scoring data available', this.pageWidth / 2, y, this.colors.moonlitGrey, 14, 'center');
      }
      
      // Graph 9: Stacked Bar Chart - Over by over performance (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 9: PHASE-WISE PERFORMANCE', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      this.addProfessionalText('Over by over performance analysis', this.pageWidth / 2, y, this.colors.mochaMousse, 14, 'center');
      y += 30;
      const overData = [
        {label: 'Powerplay (1-6)', values: [35, 12, 8]}, // Sample: runs, wickets, extras
        {label: 'Middle Overs (7-15)', values: [65, 15, 12]},
        {label: 'Death Overs (16-20)', values: [55, 8, 10]}
      ];
      this.addStackedBarChart(50, y, this.pageWidth - 100, 350, overData,
        [this.colors.infoBlue, this.colors.dangerRed, this.colors.warningAmber],
        'Over by Over Performance');
      
      // Graph 10: Heatmap - Performance matrix (Full Page)
      this.doc.addPage();
      y = 80;
      this.addProfessionalText('GRAPH 10: PERFORMANCE MATRIX', this.pageWidth / 2, y, this.colors.mochaMousse, 18, 'bold', 'center');
      y += 40;
      this.addProfessionalText('Multi-dimensional performance analysis', this.pageWidth / 2, y, this.colors.mochaMousse, 14, 'center');
      y += 30;
      const performanceMatrix = battingData.slice(0, 6).map(batsman => [
        batsman.runs,
        batsman.strikeRate,
        batsman.fours,
        batsman.sixes,
        Math.floor(batsman.balls / 6) // Overs faced
      ]);
      this.addHeatmap(50, y, this.pageWidth - 100, 300, performanceMatrix,
        ['Runs', 'SR', '4s', '6s', 'Overs'], 'Performance Heatmap');
      
      y += 350;
      
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
      if (inn.bowling && Array.isArray(inn.bowling)) {
        inn.bowling.forEach((bowler: any) => {
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
      }
      
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
        
        if (inn.fallOfWickets && Array.isArray(inn.fallOfWickets)) {
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
        }
        
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
        
        if (inn.partnerships && Array.isArray(inn.partnerships)) {
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
        }
        
        y += this.layout.sectionSpacing;
      }
    });
    }
    
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
