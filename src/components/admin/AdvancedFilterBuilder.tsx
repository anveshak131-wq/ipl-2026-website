'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Plus, Save, Trash2, ChevronDown } from 'lucide-react';

export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  createdAt: number;
}

interface AdvancedFilterBuilderProps {
  fields: {
    value: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: { value: string; label: string }[];
  }[];
  onApply: (conditions: FilterCondition[]) => void;
  onClear: () => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, conditions: FilterCondition[]) => void;
  onDeleteFilter?: (id: string) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
}

export default function AdvancedFilterBuilder({
  fields,
  onApply,
  onClear,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
  onLoadFilter,
}: AdvancedFilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  const operators: { value: FilterOperator; label: string }[] = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In (comma-separated)' },
  ];

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: fields[0]?.value || '',
      operator: 'equals',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleApply = () => {
    onApply(conditions);
    setIsOpen(false);
  };

  const handleSave = () => {
    if (saveName.trim() && onSaveFilter) {
      onSaveFilter(saveName.trim(), conditions);
      setShowSaveDialog(false);
      setSaveName('');
    }
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setConditions(filter.conditions);
    if (onLoadFilter) {
      onLoadFilter(filter);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setConditions([]);
    onClear();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-all duration-200"
      >
        <Filter className="w-4 h-4" />
        <span>Advanced Filters</span>
        {conditions.length > 0 && (
          <span className="px-2 py-0.5 bg-[#2F6FED] text-white text-xs font-bold rounded-full">
            {conditions.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-96 bg-[#0B0F13] border border-[#2A3440] rounded-xl shadow-2xl z-50"
          >
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#E6EDF3]">Advanced Filters</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider mb-2">
                    Saved Filters
                  </div>
                  <div className="space-y-1">
                    {savedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-2 bg-[#141A22] rounded-lg"
                      >
                        <button
                          onClick={() => handleLoadFilter(filter)}
                          className="flex-1 text-left text-sm text-[#E6EDF3] hover:text-[#2F6FED] transition-colors"
                        >
                          {filter.name}
                        </button>
                        {onDeleteFilter && (
                          <button
                            onClick={() => onDeleteFilter(filter.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditions */}
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={condition.id} className="p-3 bg-[#141A22] rounded-lg border border-[#2A3440]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#AEBAC7]">Condition {index + 1}</span>
                      <button
                        onClick={() => removeCondition(condition.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                      >
                        {fields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(condition.id, { operator: e.target.value as FilterOperator })}
                        className="w-full px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      {condition.operator === 'between' ? (
                        <div className="flex gap-2">
                          <input
                            type={fields.find((f) => f.value === condition.field)?.type || 'text'}
                            value={Array.isArray(condition.value) ? condition.value[0] : ''}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: [e.target.value, Array.isArray(condition.value) ? condition.value[1] : ''],
                              })
                            }
                            placeholder="From"
                            className="flex-1 px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                          />
                          <input
                            type={fields.find((f) => f.value === condition.field)?.type || 'text'}
                            value={Array.isArray(condition.value) ? condition.value[1] : ''}
                            onChange={(e) =>
                              updateCondition(condition.id, {
                                value: [Array.isArray(condition.value) ? condition.value[0] : '', e.target.value],
                              })
                            }
                            placeholder="To"
                            className="flex-1 px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                          />
                        </div>
                      ) : condition.operator === 'in' ? (
                        <input
                          type="text"
                          value={Array.isArray(condition.value) ? condition.value.join(',') : condition.value}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                          placeholder="Comma-separated values"
                          className="w-full px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                        />
                      ) : (() => {
                        const field = fields.find((f) => f.value === condition.field);
                        if (field?.type === 'select' && field.options) {
                          return (
                            <select
                              value={Array.isArray(condition.value) ? condition.value[0] : condition.value}
                              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                              className="w-full px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                            >
                              <option value="">Select...</option>
                              {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          );
                        }
                        return (
                          <input
                            type={field?.type || 'text'}
                            value={Array.isArray(condition.value) ? condition.value.join(',') : condition.value}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="Value"
                            className="w-full px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                          />
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2A3440]">
                <button
                  onClick={addCondition}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm hover:bg-[#141A22] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
                {onSaveFilter && conditions.length > 0 && (
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm hover:bg-[#141A22] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                )}
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-[#2F6FED] rounded-lg text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold text-[#E6EDF3] mb-4">Save Filter</h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Filter name"
                className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] mb-4 focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-[#2F6FED] rounded-lg text-white font-semibold hover:bg-[#2563EB] transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

