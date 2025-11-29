/**
 * Export utilities for admin panel
 * Supports CSV, Excel, and PDF exports
 */

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: ExportData, filename: string = 'export.csv'): void {
  const { headers, rows } = data;
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => {
      // Escape commas and quotes in cell values
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to Excel (XLSX format using CSV with .xlsx extension)
 * Note: For true Excel format, you'd need a library like xlsx
 */
export function exportToExcel(data: ExportData, filename: string = 'export.xlsx'): void {
  // For now, we'll use CSV format with .xlsx extension
  // In production, use a library like 'xlsx' for proper Excel format
  exportToCSV(data, filename.replace('.xlsx', '.csv'));
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: any, filename: string = 'export.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF using browser print functionality
 * For more advanced PDFs, use a library like jsPDF or pdfmake
 */
export function exportToPDF(elementId: string, filename: string = 'export.pdf'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  // Create a new window with the content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
    // Optionally close after printing
    // printWindow.close();
  }, 250);
}

/**
 * Prepare data for export from table rows
 */
export function prepareExportData(
  headers: string[],
  rows: any[],
  fieldMap?: { [key: string]: string }
): ExportData {
  return {
    headers: headers.map((h) => fieldMap?.[h] || h),
    rows: rows.map((row) => headers.map((header) => {
      const value = row[header];
      return value !== null && value !== undefined ? String(value) : '';
    })),
  };
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date-time for export
 */
export function formatDateTimeForExport(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calendar Export Interfaces
 */
export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
}

/**
 * Generate iCal (ICS) format content
 */
export function generateICalContent(events: CalendarEvent[]): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SportsUP99//IPL 2026 Matches//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ].join('\r\n');

  events.forEach((event) => {
    const start = formatDate(event.startDate);
    const end = formatDate(event.endDate);
    
    ics += '\r\nBEGIN:VEVENT';
    ics += `\r\nUID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@sportsup99.com`;
    ics += `\r\nDTSTAMP:${formatDate(new Date())}`;
    ics += `\r\nDTSTART:${start}`;
    ics += `\r\nDTEND:${end}`;
    ics += `\r\nSUMMARY:${escapeText(event.title)}`;
    ics += `\r\nDESCRIPTION:${escapeText(event.description)}`;
    ics += `\r\nLOCATION:${escapeText(event.location)}`;
    ics += '\r\nSTATUS:CONFIRMED';
    ics += '\r\nSEQUENCE:0';
    ics += '\r\nEND:VEVENT';
  });

  ics += '\r\nEND:VCALENDAR';
  return ics;
}

/**
 * Export matches to iCal file (.ics)
 */
export function exportToICal(events: CalendarEvent[], filename: string = 'matches.ics'): void {
  const icsContent = generateICalContent(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export to Google Calendar
 */
export function exportToGoogleCalendar(event: CalendarEvent): void {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description,
    location: event.location,
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

/**
 * Export to Outlook Calendar
 */
export function exportToOutlookCalendar(event: CalendarEvent): void {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: event.description,
    location: event.location,
  });

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
}

/**
 * Generate iCal feed URL
 * This assumes an API endpoint exists at /api/calendar/ical
 */
export function generateICalFeedUrl(filters?: { team?: string; status?: string }): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams();
  
  if (filters?.team) params.append('team', filters.team);
  if (filters?.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  return `${baseUrl}/api/calendar/ical${queryString ? `?${queryString}` : ''}`;
}

/**
 * Copy iCal feed URL to clipboard
 */
export async function copyICalFeedUrl(filters?: { team?: string; status?: string }): Promise<void> {
  const url = generateICalFeedUrl(filters);
  try {
    await navigator.clipboard.writeText(url);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback: select and copy
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

