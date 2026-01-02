import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Player {
  id: string;
  name: string;
  role: string;
  teamId: string;
  runs?: number;
  wickets?: number;
  battingAverage?: number;
  bowlingAverage?: number;
  strikeRate?: number;
  economy?: number;
  matches?: number;
  fours?: number;
  sixes?: number;
  fifties?: number;
  hundreds?: number;
}

export const exportToCSV = (players: Player[], filename: string = 'players') => {
  if (players.length === 0) return;
  
  // Get headers from first player
  const headers = Object.keys(players[0]).filter(key => key !== 'id');
  
  // Create CSV content
  let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
  
  // Add rows
  players.forEach(player => {
    const row = headers.map(header => {
      // @ts-ignore
      const value = player[header];
      return typeof value === 'string' ? `"${value}"` : value || 0;
    });
    csvContent += row.join(',') + '\n';
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (players: Player[], filename: string = 'players') => {
  if (players.length === 0) return;
  
  const doc = new jsPDF('l');
  const headers = [
    'Name',
    'Role',
    'Matches',
    'Runs',
    'Wickets',
    'Bat Avg',
    'Bowl Avg',
    'SR',
    '4s',
    '6s',
    '50s',
    '100s'
  ];
  
  const data = players.map(player => [
    player.name,
    player.role,
    player.matches || 0,
    player.runs || 0,
    player.wickets || 0,
    player.battingAverage?.toFixed(2) || '-',
    player.bowlingAverage?.toFixed(2) || '-',
    player.strikeRate?.toFixed(2) || '-',
    player.fours || 0,
    player.sixes || 0,
    player.fifties || 0,
    player.hundreds || 0
  ]);
  
  // Add title
  doc.setFontSize(18);
  doc.text('IPL 2026 Players List', 14, 15);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
  
  // Add table
  // @ts-ignore
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 20 },
      // ... other column styles
    }
  });
  
  // Save the PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToJSON = (players: Player[], filename: string = 'players') => {
  if (players.length === 0) return;
  
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(players, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
