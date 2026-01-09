'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MousePointerClick,
  UserX,
  Filter,
  Download,
  Calendar,
} from 'lucide-react';
import { AnimatedStatusIcon } from '../icons';
import DateRangePicker from '../DateRangePicker';
import { exportToCSV, prepareExportData } from '@/lib/admin/exportUtils';

export type EmailStatus = 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked' | 'unsubscribed';

export interface EmailLog {
  id: string;
  templateId: string;
  templateName: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: EmailStatus;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  unsubscribedAt?: Date;
  bounceReason?: string;
  errorMessage?: string;
}

interface EmailLogsProps {
  logs: EmailLog[];
  onExport?: () => void;
}

export default function EmailLogs({ logs, onExport }: EmailLogsProps) {
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueTemplates = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.templateName)));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (statusFilter !== 'all') {
      result = result.filter((log) => log.status === statusFilter);
    }

    if (templateFilter !== 'all') {
      result = result.filter((log) => log.templateName === templateFilter);
    }

    if (dateRange.start || dateRange.end) {
      result = result.filter((log) => {
        const sentDate = new Date(log.sentAt);
        if (dateRange.start && sentDate < dateRange.start) return false;
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (sentDate > endDate) return false;
        }
        return true;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.recipientEmail.toLowerCase().includes(q) ||
          log.recipientName.toLowerCase().includes(q) ||
          log.subject.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, statusFilter, templateFilter, dateRange, searchQuery]);

  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter((l) => l.status === 'sent' || l.status === 'delivered').length;
    const delivered = logs.filter((l) => l.status === 'delivered').length;
    const opened = logs.filter((l) => l.openedAt).length;
    const clicked = logs.filter((l) => l.clickedAt).length;
    const bounced = logs.filter((l) => l.status === 'bounced').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const unsubscribed = logs.filter((l) => l.unsubscribedAt).length;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      unsubscribed,
      openRate: total > 0 ? ((opened / total) * 100).toFixed(1) : '0',
      clickRate: total > 0 ? ((clicked / total) * 100).toFixed(1) : '0',
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : '0',
    };
  }, [logs]);

  const handleExport = () => {
    const exportData = prepareExportData(
      ['recipientEmail', 'recipientName', 'subject', 'status', 'sentAt', 'deliveredAt', 'openedAt'],
      filteredLogs.map((log) => ({
        recipientEmail: log.recipientEmail,
        recipientName: log.recipientName,
        subject: log.subject,
        status: log.status,
        sentAt: new Date(log.sentAt).toLocaleString(),
        deliveredAt: log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : '',
        openedAt: log.openedAt ? new Date(log.openedAt).toLocaleString() : '',
      })),
      {
        recipientEmail: 'Email',
        recipientName: 'Name',
        subject: 'Subject',
        status: 'Status',
        sentAt: 'Sent At',
        deliveredAt: 'Delivered At',
        openedAt: 'Opened At',
      }
    );
    exportToCSV(exportData, `email-logs-${new Date().toISOString().split('T')[0]}.csv`);
    onExport?.();
  };

  const getStatusColor = (status: EmailStatus): string => {
    const colors: { [key: string]: string } = {
      sent: 'text-blue-400',
      delivered: 'text-green-400',
      bounced: 'text-yellow-400',
      failed: 'text-red-400',
      opened: 'text-purple-400',
      clicked: 'text-indigo-400',
      unsubscribed: 'text-gray-400',
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case 'sent':
        return 'pending';
      case 'delivered':
        return 'success';
      case 'bounced':
      case 'failed':
        return 'error';
      case 'opened':
        return 'active';
      case 'clicked':
        return 'active';
      case 'unsubscribed':
        return 'inactive';
      default:
        return 'pending';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#E6EDF3] flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#2F6FED]" />
          Email Logs
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm font-medium hover:bg-[#141A22] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4">
          <div className="text-xs text-[#AEBAC7] mb-1">Total Sent</div>
          <div className="text-2xl font-bold text-[#E6EDF3]">{stats.total}</div>
        </div>
        <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4">
          <div className="text-xs text-[#AEBAC7] mb-1">Delivered</div>
          <div className="text-2xl font-bold text-green-400">{stats.delivered}</div>
          <div className="text-xs text-[#6B7280] mt-1">{stats.deliveryRate}%</div>
        </div>
        <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4">
          <div className="text-xs text-[#AEBAC7] mb-1">Opened</div>
          <div className="text-2xl font-bold text-purple-400">{stats.opened}</div>
          <div className="text-xs text-[#6B7280] mt-1">{stats.openRate}%</div>
        </div>
        <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4">
          <div className="text-xs text-[#AEBAC7] mb-1">Clicked</div>
          <div className="text-2xl font-bold text-indigo-400">{stats.clicked}</div>
          <div className="text-xs text-[#6B7280] mt-1">{stats.clickRate}%</div>
        </div>
        <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4">
          <div className="text-xs text-[#AEBAC7] mb-1">Bounced</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.bounced}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <label
              htmlFor="email-search"
              className="block text-sm font-medium sr-only"
            >
              Search by email, name, or subject
            </label>
            <input
              id="email-search"
              name="email-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, name, or subject..."
              className="w-full pl-10 pr-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-sm text-[#E6EDF3] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
            />
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEBAC7]" />
          </div>

          <label
            htmlFor="status-filter"
            className="block text-sm font-medium sr-only"
          >
            Filter by status
          </label>
          <select
            id="status-filter"
            name="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmailStatus | 'all')}
            className="px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="bounced">Bounced</option>
            <option value="failed">Failed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <label
            htmlFor="template-filter"
            className="block text-sm font-medium sr-only"
          >
            Filter by template
          </label>
          <select
            id="template-filter"
            name="template-filter"
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-sm text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
          >
            <option value="all">All Templates</option>
            {uniqueTemplates.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>

          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Date range"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#141A22] border border-[#2A3440] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1A2332]">
              <tr className="text-left text-[#AEBAC7]">
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent At</th>
                <th className="px-4 py-3 font-medium">Delivered</th>
                <th className="px-4 py-3 font-medium">Opened</th>
                <th className="px-4 py-3 font-medium">Clicked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3440]">
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="text-[#AEBAC7] hover:bg-[#1A2332] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#E6EDF3]">{log.recipientName}</div>
                    <div className="text-xs text-[#6B7280]">{log.recipientEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{log.templateName}</td>
                  <td className="px-4 py-3 text-xs">{log.subject}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AnimatedStatusIcon
                        status={getStatusIcon(log.status) as any}
                        size="sm"
                      />
                      <span className={`text-xs ${getStatusColor(log.status)}`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </div>
                    {log.bounceReason && (
                      <div className="text-[10px] text-[#6B7280] mt-1">{log.bounceReason}</div>
                    )}
                    {log.errorMessage && (
                      <div className="text-[10px] text-red-400 mt-1">{log.errorMessage}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.deliveredAt ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {new Date(log.deliveredAt).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-[#6B7280]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.openedAt ? (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Eye className="w-3 h-3" />
                        {new Date(log.openedAt).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-[#6B7280]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.clickedAt ? (
                      <div className="flex items-center gap-1 text-indigo-400">
                        <MousePointerClick className="w-3 h-3" />
                        {new Date(log.clickedAt).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-[#6B7280]">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-[#AEBAC7]">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No email logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

