'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface BulkEditField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: { [key: string]: any }) => void;
  fields: BulkEditField[];
  selectedCount: number;
  title?: string;
}

export default function BulkEditModal({
  isOpen,
  onClose,
  onSave,
  fields,
  selectedCount,
  title = 'Bulk Edit',
}: BulkEditModalProps) {
  const [values, setValues] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    // Validate required fields if needed
    const newErrors: { [key: string]: string } = {};
    // Add validation logic here

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(values);
    setValues({});
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setValues({});
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl bg-[#0B0F13] border border-[#2A3440] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#2A3440]">
                <div>
                  <h2 className="text-2xl font-bold text-[#E6EDF3]">{title}</h2>
                  <p className="text-sm text-[#AEBAC7] mt-1">
                    Editing <span className="font-semibold text-[#E6EDF3]">{selectedCount}</span> items
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={values[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                      >
                        <option value="">-- Select --</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={values[field.name] || false}
                          onChange={(e) => handleChange(field.name, e.target.checked)}
                          className="w-4 h-4 text-[#2F6FED] bg-[#141A22] border-[#2A3440] rounded focus:ring-[#2F6FED]"
                        />
                        <span className="text-sm text-[#AEBAC7]">Apply to all selected items</span>
                      </label>
                    ) : (
                      <input
                        type={field.type}
                        value={values[field.name] || ''}
                        onChange={(e) =>
                          handleChange(
                            field.name,
                            field.type === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                      />
                    )}
                    {errors[field.name] && (
                      <p className="mt-1 text-sm text-red-400">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2A3440]">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2F6FED] rounded-lg text-white font-semibold hover:bg-[#2563EB] transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Apply to {selectedCount} items
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

