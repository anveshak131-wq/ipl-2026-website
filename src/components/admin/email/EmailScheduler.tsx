'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Repeat, X, Save, Send } from 'lucide-react';
import { useToast } from '../Toast';
import { EmailTemplate } from './EmailTemplates';
import DateRangePicker from '../DateRangePicker';

export type ScheduleType = 'once' | 'recurring';

export interface EmailSchedule {
  id: string;
  name: string;
  templateId: string;
  scheduleType: ScheduleType;
  scheduledDate: Date | null;
  scheduledTime: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date | null;
  };
  recipients: {
    type: 'all' | 'filtered' | 'selected';
    filters?: any;
    userIds?: string[];
  };
  status: 'scheduled' | 'sent' | 'cancelled';
  createdAt: Date;
}

interface EmailSchedulerProps {
  templates: EmailTemplate[];
  onSchedule: (schedule: EmailSchedule) => void;
  schedules: EmailSchedule[];
  onCancel: (id: string) => void;
}

export default function EmailScheduler({
  templates,
  onSchedule,
  schedules,
  onCancel,
}: EmailSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    scheduleType: 'once' as ScheduleType,
    scheduledDate: null as Date | null,
    scheduledTime: '',
    recurrence: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      interval: 1,
      endDate: null as Date | null,
    },
    recipients: {
      type: 'all' as 'all' | 'filtered' | 'selected',
    },
  });

  const handleSchedule = () => {
    if (!formData.name || !formData.templateId) {
      showError('Please fill in all required fields');
      return;
    }

    if (formData.scheduleType === 'once' && !formData.scheduledDate) {
      showError('Please select a scheduled date');
      return;
    }

    if (formData.scheduleType === 'recurring' && !formData.scheduledDate) {
      showError('Please select a start date');
      return;
    }

    const schedule: EmailSchedule = {
      id: Date.now().toString(),
      ...formData,
      status: 'scheduled',
      createdAt: new Date(),
    };

    onSchedule(schedule);
    setIsOpen(false);
    setFormData({
      name: '',
      templateId: '',
      scheduleType: 'once',
      scheduledDate: null,
      scheduledTime: '',
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endDate: null,
      },
      recipients: {
        type: 'all',
      },
    });
    success('Email scheduled successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#E6EDF3] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2F6FED]" />
          Scheduled Emails
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F6FED] rounded-lg text-white text-sm font-medium hover:bg-[#2563EB] transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Schedule Email
        </motion.button>
      </div>

      {/* Scheduled Emails List */}
      <div className="space-y-3">
        {schedules
          .filter((s) => s.status === 'scheduled')
          .map((schedule) => {
            const template = templates.find((t) => t.id === schedule.templateId);
            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-[#E6EDF3]">{schedule.name}</h4>
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                        {schedule.scheduleType === 'once' ? 'One-time' : 'Recurring'}
                      </span>
                    </div>
                    <div className="text-sm text-[#AEBAC7] space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {schedule.scheduledDate
                            ? new Date(schedule.scheduledDate).toLocaleDateString()
                            : 'Not set'}
                        </span>
                        {schedule.scheduledTime && (
                          <>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{schedule.scheduledTime}</span>
                          </>
                        )}
                      </div>
                      {schedule.scheduleType === 'recurring' && schedule.recurrence && (
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4" />
                          <span>
                            Every {schedule.recurrence.interval}{' '}
                            {schedule.recurrence.frequency}
                            {schedule.recurrence.endDate &&
                              ` until ${new Date(schedule.recurrence.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      {template && (
                        <div className="text-xs text-[#6B7280]">Template: {template.name}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onCancel(schedule.id)}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            );
          })}

        {schedules.filter((s) => s.status === 'scheduled').length === 0 && (
          <div className="text-center py-8 text-[#AEBAC7]">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No scheduled emails</p>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#E6EDF3]">Schedule Email</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Schedule Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekly Match Reminders"
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Email Template</label>
                  <select
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  >
                    <option value="">Select template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Schedule Type</label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleType: e.target.value as ScheduleType })
                    }
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  >
                    <option value="once">Send Once</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                    {formData.scheduleType === 'once' ? 'Scheduled Date' : 'Start Date'}
                  </label>
                  <DateRangePicker
                    value={{ start: formData.scheduledDate, end: null }}
                    onChange={(range) => setFormData({ ...formData, scheduledDate: range.start })}
                    placeholder="Select date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>

                {formData.scheduleType === 'recurring' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Frequency</label>
                      <select
                        value={formData.recurrence.frequency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrence: {
                              ...formData.recurrence,
                              frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Interval</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurrence.interval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrence: {
                              ...formData.recurrence,
                              interval: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#E6EDF3] mb-2">End Date (Optional)</label>
                      <DateRangePicker
                        value={{ start: formData.recurrence.endDate, end: null }}
                        onChange={(range) =>
                          setFormData({
                            ...formData,
                            recurrence: {
                              ...formData.recurrence,
                              endDate: range.start,
                            },
                          })
                        }
                        placeholder="Select end date (optional)"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Recipients</label>
                  <select
                    value={formData.recipients.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipients: {
                          type: e.target.value as 'all' | 'filtered' | 'selected',
                        },
                      })
                    }
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  >
                    <option value="all">All Users</option>
                    <option value="filtered">Filtered Users</option>
                    <option value="selected">Selected Users</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#2A3440]">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSchedule}
                    className="flex-1 px-4 py-2 bg-[#2F6FED] rounded-lg text-white font-semibold hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Schedule Email
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

