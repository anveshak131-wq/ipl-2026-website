'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit3, Sparkles } from 'lucide-react';

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl glass-effect rounded-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col backdrop-blur-xl bg-gradient-to-br from-[#0B0F13]/95 via-[#0F141F]/95 to-[#0B0F13]/95">
              {/* Header with gradient accent */}
              <div className="relative overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-ipl-gold/10 via-ipl-purple/10 to-ipl-gold/10 opacity-50"></div>
                <div className="relative flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-ipl-gold/20 to-ipl-purple/20 flex items-center justify-center border border-ipl-gold/30"
                    >
                      <Edit3 className="w-6 h-6 text-ipl-gold" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {title}
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Sparkles className="w-5 h-5 text-ipl-gold" />
                        </motion.div>
                      </h2>
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        Editing <span className="font-semibold text-ipl-gold px-2 py-0.5 rounded-md bg-ipl-gold/10">{selectedCount}</span> items
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      {field.label}
                      {errors[field.name] && (
                        <span className="text-xs text-red-400">*</span>
                      )}
                    </label>
                    {field.type === 'select' ? (
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={values[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all duration-200 cursor-pointer hover:border-white/20"
                      >
                        <option value="" className="bg-[#0B0F13] text-gray-400">-- Select --</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value} className="bg-[#0B0F13] text-white">
                            {option.label}
                          </option>
                        ))}
                      </motion.select>
                    ) : field.type === 'checkbox' ? (
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={values[field.name] || false}
                          onChange={(e) => handleChange(field.name, e.target.checked)}
                          className="w-5 h-5 text-ipl-gold bg-white/5 border-white/20 rounded focus:ring-ipl-gold/50 focus:ring-2 cursor-pointer transition-all"
                        />
                        <span className="text-sm text-gray-300">Apply to all selected items</span>
                      </motion.label>
                    ) : (
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type={field.type}
                        value={values[field.name] || ''}
                        onChange={(e) =>
                          handleChange(
                            field.name,
                            field.type === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all duration-200 hover:border-white/20"
                      />
                    )}
                    {errors[field.name] && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-400 flex items-center gap-1"
                      >
                        <span>⚠</span> {errors[field.name]}
                      </motion.p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="relative border-t border-white/10 p-6 bg-gradient-to-t from-black/20 to-transparent">
                <div className="flex items-center justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 font-medium hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-lg text-white font-semibold hover:from-ipl-gold/90 hover:to-ipl-purple/90 transition-all duration-200 shadow-lg shadow-ipl-gold/20"
                  >
                    <Save className="w-4 h-4" />
                    Apply to {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

