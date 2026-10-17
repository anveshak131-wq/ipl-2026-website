'use client';

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, FileDown, Database, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

interface PlayerExportBarProps {
  players: any[];
  league: 'IPL' | 'WPL';
  teams?: any[];
}

const IPL_TEAMS: Record<string, string> = {
  '1': 'Chennai Super Kings',
  '2': 'Mumbai Indians',
  '3': 'Royal Challengers Bengaluru',
  '4': 'Kolkata Knight Riders',
  '5': 'Sunrisers Hyderabad',
  '6': 'Rajasthan Royals',
  '7': 'Delhi Capitals',
  '8': 'Punjab Kings',
  '9': 'Lucknow Super Giants',
  '10': 'Gujarat Titans',
};

const WPL_TEAMS: Record<string, string> = {
  '1': 'Mumbai Indians',
  '2': 'Royal Challengers Bengaluru',
  '3': 'Delhi Capitals',
  '4': 'Gujarat Giants',
  '5': 'UP Warriorz',
  'mi': 'Mumbai Indians',
  'rcb': 'Royal Challengers Bengaluru',
  'dc': 'Delhi Capitals',
  'gg': 'Gujarat Giants',
  'upw': 'UP Warriorz',
};

export default function PlayerExportBar({ players = [], league, teams = [] }: PlayerExportBarProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const teamDict = React.useMemo(() => {
    const dict: Record<string, string> = league === 'WPL' ? { ...WPL_TEAMS } : { ...IPL_TEAMS };
    if (Array.isArray(teams)) {
      teams.forEach((t) => {
        if (t?.id) dict[String(t.id)] = t.name || t.shortName || String(t.id);
      });
    }
    return dict;
  }, [league, teams]);

  const resolveTeam = (p: any) => {
    const tId = String(p.teamId || p.team || '');
    return teamDict[tId] || p.teamName || (tId ? `Team ${tId}` : 'Unassigned');
  };

  const getStats = (p: any) => {
    const batIPL = p.careerStats?.batting?.[league] || p.careerStats?.batting?.IPL || {};
    const bowlIPL = p.careerStats?.bowling?.[league] || p.careerStats?.bowling?.IPL || {};
    return {
      matches: p.matches ?? batIPL.Matches ?? 0,
      runs: p.runs ?? batIPL.Runs ?? 0,
      highest: p.highestScore ?? batIPL.Highest ?? 0,
      average: p.average ?? batIPL.Average ?? 0,
      strikeRate: p.strikeRate ?? batIPL.SR ?? 0,
      hundreds: p.hundreds ?? batIPL['100s'] ?? 0,
      fifties: p.fifties ?? batIPL['50s'] ?? 0,
      wickets: p.wickets ?? bowlIPL.Wickets ?? 0,
      economy: p.economy ?? bowlIPL.Eco ?? 0,
      bbi: bowlIPL.BBI || p.bestBowling || '0/0',
    };
  };

  // 1. EXPORT CSV
  const exportCSV = () => {
    try {
      setExporting('csv');
      const headers = [
        'ID',
        'Name',
        'Franchise',
        'Role',
        'Batting Style',
        'Bowling Style',
        'Nationality',
        'Born',
        'Matches',
        'Runs',
        'Highest Score',
        'Batting Avg',
        'Strike Rate',
        '100s',
        '50s',
        'Wickets',
        'Economy',
        'Best Bowling',
      ];

      const rows = players.map((p) => {
        const s = getStats(p);
        const bio = p.bio || {};
        return [
          p.id || '',
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${resolveTeam(p).replace(/"/g, '""')}"`,
          `"${(p.role || bio.role || '').replace(/"/g, '""')}"`,
          `"${(p.battingStyle || bio.battingStyle || '').replace(/"/g, '""')}"`,
          `"${(p.bowlingStyle || bio.bowlingStyle || '').replace(/"/g, '""')}"`,
          `"${(p.nationality || bio.nationality || 'India').replace(/"/g, '""')}"`,
          `"${(bio.born || '').replace(/"/g, '""')}"`,
          s.matches,
          s.runs,
          s.highest,
          s.average,
          s.strikeRate,
          s.hundreds,
          s.fifties,
          s.wickets,
          s.economy,
          `"${s.bbi}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${league.toLowerCase()}-players-vault-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(null);
    }
  };

  // 2. EXPORT JSON (DATABASE SNAPSHOT)
  const exportJSON = () => {
    try {
      setExporting('json');
      const jsonContent = JSON.stringify(players, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${league.toLowerCase()}-players-database-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(null);
    }
  };

  // 3. EXPORT EXCEL (.XLSX)
  const exportExcel = async () => {
    try {
      setExporting('excel');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SportsUp99 Vault';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet(`${league} Players Vault`);

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Player Name', key: 'name', width: 24 },
        { header: 'Franchise', key: 'team', width: 28 },
        { header: 'Role', key: 'role', width: 16 },
        { header: 'Batting Style', key: 'battingStyle', width: 18 },
        { header: 'Bowling Style', key: 'bowlingStyle', width: 20 },
        { header: 'Nationality', key: 'nationality', width: 14 },
        { header: 'Born / Age', key: 'born', width: 26 },
        { header: 'Matches', key: 'matches', width: 10 },
        { header: 'Runs', key: 'runs', width: 10 },
        { header: 'Highest', key: 'highest', width: 10 },
        { header: 'Bat Avg', key: 'average', width: 10 },
        { header: 'Strike Rate', key: 'strikeRate', width: 12 },
        { header: '100s', key: 'hundreds', width: 8 },
        { header: '50s', key: 'fifties', width: 8 },
        { header: 'Wickets', key: 'wickets', width: 10 },
        { header: 'Economy', key: 'economy', width: 10 },
        { header: 'BBI', key: 'bbi', width: 10 },
      ];

      // Style Header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: league === 'WPL' ? 'FF831843' : 'FF1E3A8A' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      // Add Data Rows
      players.forEach((p, idx) => {
        const s = getStats(p);
        const bio = p.bio || {};
        const row = worksheet.addRow({
          id: p.id || idx + 1,
          name: p.name || 'Unknown',
          team: resolveTeam(p),
          role: p.role || bio.role || 'Player',
          battingStyle: p.battingStyle || bio.battingStyle || 'Right Handed Bat',
          bowlingStyle: p.bowlingStyle || bio.bowlingStyle || 'Right-arm medium',
          nationality: p.nationality || bio.nationality || 'India',
          born: bio.born || 'N/A',
          matches: Number(s.matches) || 0,
          runs: Number(s.runs) || 0,
          highest: Number(s.highest) || 0,
          average: Number(s.average) || 0,
          strikeRate: Number(s.strikeRate) || 0,
          hundreds: Number(s.hundreds) || 0,
          fifties: Number(s.fifties) || 0,
          wickets: Number(s.wickets) || 0,
          economy: Number(s.economy) || 0,
          bbi: s.bbi || '0/0',
        });

        if (idx % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${league.toLowerCase()}-players-vault-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(null);
    }
  };

  // 4. EXPORT PDF REPORT
  const exportPDF = () => {
    try {
      setExporting('pdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const primaryColor = league === 'WPL' ? [131, 24, 67] : [30, 58, 138];

      // Title & Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 297, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${league} 2026 OFFICIAL PLAYERS VAULT`, 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Roster: ${players.length} Players | Generated: ${new Date().toLocaleDateString()}`, 200, 12);

      const tableData = players.map((p, idx) => {
        const s = getStats(p);
        const bio = p.bio || {};
        return [
          p.id || idx + 1,
          p.name || 'Unknown',
          resolveTeam(p),
          p.role || bio.role || 'Player',
          bio.born ? bio.born.split('(')[0].trim() : 'N/A',
          s.matches,
          s.runs,
          s.highest,
          s.average,
          s.strikeRate,
          s.wickets,
          s.economy,
        ];
      });

      autoTable(doc, {
        head: [['ID', 'Player Name', 'Franchise', 'Role', 'Born', 'Mat', 'Runs', 'HS', 'Avg', 'SR', 'Wkts', 'Eco']],
        body: tableData,
        startY: 23,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: primaryColor as any,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { fontStyle: 'bold', cellWidth: 42 },
          2: { cellWidth: 42 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { halign: 'center', cellWidth: 12 },
          6: { halign: 'right', cellWidth: 15 },
          7: { halign: 'center', cellWidth: 12 },
          8: { halign: 'right', cellWidth: 14 },
          9: { halign: 'right', cellWidth: 14 },
          10: { halign: 'center', cellWidth: 14 },
          11: { halign: 'right', cellWidth: 14 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      });

      doc.save(`${league.toLowerCase()}-players-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
        <Database className="w-3.5 h-3.5 text-indigo-400" />
        Export {league} ({players.length}):
      </span>

      {/* PDF Button */}
      <button
        onClick={exportPDF}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
        title="Download Official PDF Roster Report"
      >
        {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-rose-400" />}
        PDF
      </button>

      {/* Excel Button */}
      <button
        onClick={exportExcel}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors disabled:opacity-50"
        title="Download Formatted Excel Spreadsheet (.xlsx)"
      >
        {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
        Excel
      </button>

      {/* CSV Button */}
      <button
        onClick={exportCSV}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-colors disabled:opacity-50"
        title="Download CSV for Sheets/Data Analysis"
      >
        {exporting === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-sky-400" />}
        CSV
      </button>

      {/* JSON Database Button */}
      <button
        onClick={exportJSON}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
        title="Download Complete Raw JSON Database Snapshot"
      >
        {exporting === 'json' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-amber-400" />}
        JSON (Database)
      </button>
    </div>
  );
}
