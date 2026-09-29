'use client';

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Player } from '@/types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

interface StatsExportProps {
  players: Player[];
  title: string;
  type: 'batting' | 'bowling';
}

export default function StatsExport({ players, title, type }: StatsExportProps) {
  const exportToCSV = () => {
    const data = players.map((player, index) => ({
      Rank: index + 1,
      Name: player.name,
      Team: player.teamId,
      Matches: player.stats.matches,
      Runs: player.stats.runs,
      'Strike Rate': player.stats.strikeRate?.toFixed(2) || '0',
      Average: player.stats.average?.toFixed(2) || '0',
      Wickets: player.stats.wickets,
      Economy: player.stats.economy?.toFixed(2) || '0',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stats');
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_stats.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Table data
    const tableData = players.map((player, index) => [
      index + 1,
      player.name,
      player.teamId,
      player.stats.matches,
      player.stats.runs,
      player.stats.strikeRate?.toFixed(2) || '0',
      player.stats.average?.toFixed(2) || '0',
      player.stats.wickets,
      player.stats.economy?.toFixed(2) || '0',
    ]);

    autoTable(doc, {
      head: [['Rank', 'Name', 'Team', 'Matches', 'Runs', 'SR', 'Avg', 'Wickets', 'Economy']],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`${title.replace(/\s+/g, '_')}_stats.pdf`);
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span className="hidden sm:inline">Excel</span>
      </motion.button>
      
      <motion.button
        onClick={exportToPDF}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">PDF</span>
      </motion.button>
    </div>
  );
}