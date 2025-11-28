'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  value?: { start: Date | null; end: Date | null };
  onChange: (range: { start: Date | null; end: Date | null }) => void;
  placeholder?: string;
  className?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(value?.start || null);
  const [endDate, setEndDate] = useState<Date | null>(value?.end || null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (date: Date) => {
    if (startDate && date < startDate) {
      return;
    }
    setEndDate(date);
  };

  const handleApply = () => {
    onChange({ start: startDate, end: endDate });
    setIsOpen(false);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onChange({ start: null, end: null });
    setIsOpen(false);
  };

  const getQuickRanges = () => {
    const today = new Date();
    const ranges = [
      {
        label: 'Today',
        start: new Date(today),
        end: new Date(today),
      },
      {
        label: 'Last 7 days',
        start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        end: new Date(today),
      },
      {
        label: 'Last 30 days',
        start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        end: new Date(today),
      },
      {
        label: 'This month',
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today),
      },
      {
        label: 'Last month',
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      },
      {
        label: 'This year',
        start: new Date(today.getFullYear(), 0, 1),
        end: new Date(today),
      },
    ];
    return ranges;
  };

  const handleQuickRange = (range: { start: Date; end: Date }) => {
    setStartDate(range.start);
    setEndDate(range.end);
    onChange({ start: range.start, end: range.end });
    setIsOpen(false);
  };

  const displayValue = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : startDate
    ? `From ${formatDate(startDate)}`
    : endDate
    ? `Until ${formatDate(endDate)}`
    : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-all duration-200 w-full"
      >
        <Calendar className="w-4 h-4 text-[#AEBAC7]" />
        <span className="flex-1 text-left text-sm">{displayValue}</span>
        {startDate || endDate ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-[600px] bg-[#0B0F13] border border-[#2A3440] rounded-xl shadow-2xl z-50"
          >
            <div className="p-4">
              {/* Quick Ranges */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider mb-2">
                  Quick Ranges
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {getQuickRanges().map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickRange(range)}
                      className="px-3 py-2 text-sm text-[#E6EDF3] bg-[#141A22] border border-[#2A3440] rounded-lg hover:bg-[#1A2332] transition-colors"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleStartDateChange(new Date(e.target.value));
                      } else {
                        setStartDate(null);
                      }
                    }}
                    max={endDate ? endDate.toISOString().split('T')[0] : undefined}
                    className="w-full px-3 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleEndDateChange(new Date(e.target.value));
                      } else {
                        setEndDate(null);
                      }
                    }}
                    min={startDate ? startDate.toISOString().split('T')[0] : undefined}
                    className="w-full px-3 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#2A3440]">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm bg-[#2F6FED] text-white font-semibold rounded-lg hover:bg-[#2563EB] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

