'use client';

import { X } from 'lucide-react';
import { FilterCondition } from './AdvancedFilterBuilder';

interface FilterChipsProps {
  conditions: FilterCondition[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  getFieldLabel: (field: string) => string;
}

export default function FilterChips({ conditions, onRemove, onClearAll, getFieldLabel }: FilterChipsProps) {
  if (conditions.length === 0) return null;

  const getOperatorLabel = (operator: string): string => {
    const labels: { [key: string]: string } = {
      equals: '=',
      contains: 'contains',
      startsWith: 'starts with',
      endsWith: 'ends with',
      greaterThan: '>',
      lessThan: '<',
      between: 'between',
      in: 'in',
    };
    return labels[operator] || operator;
  };

  const formatValue = (value: string | string[]): string => {
    if (Array.isArray(value)) {
      return value.join(' - ');
    }
    return String(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider">Filters:</span>
      {conditions.map((condition) => (
        <div
          key={condition.id}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2332] border border-[#2A3440] rounded-lg text-sm"
        >
          <span className="text-[#E6EDF3] font-medium">{getFieldLabel(condition.field)}</span>
          <span className="text-[#6B7280]">{getOperatorLabel(condition.operator)}</span>
          <span className="text-[#2F6FED]">{formatValue(condition.value)}</span>
          <button
            onClick={() => onRemove(condition.id)}
            className="ml-1 p-0.5 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={onClearAll}
        className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}

