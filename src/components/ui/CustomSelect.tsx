'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: ReactNode;
  iconColor?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  icon,
  iconColor = 'text-gray-400',
  className = '',
  required = false,
  disabled = false,
  searchable = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative group ${className}`} ref={selectRef}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full pl-12 pr-12 py-3.5 
          bg-gradient-to-br from-gray-800/80 to-gray-900/60 
          border-2 border-white/10 
          rounded-xl text-white 
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
          transition-all duration-300 
          appearance-none cursor-pointer 
          hover:border-white/20 hover:bg-gray-800/80 hover:shadow-lg 
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-blue-500/50 bg-gray-800/90 shadow-lg shadow-blue-500/10' : ''}
          ${disabled ? '' : 'group-hover:scale-[1.01]'}
        `}
      >
        {/* Gradient hover background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Icon */}
        {icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${iconColor} group-hover:text-blue-300`}>
            {icon}
          </div>
        )}

        {/* Selected value or placeholder */}
        <span className={`block text-left truncate ${!selectedOption ? 'text-gray-400' : 'text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* Chevron */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-all duration-300 ${
              isOpen ? 'rotate-180 text-blue-400' : 'group-hover:text-blue-400'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute z-50 w-full mt-2 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl border-2 border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Gradient accent line */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              {/* Search input (if searchable) */}
              {searchable && (
                <div className="p-3 border-b border-white/10">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="w-full px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              )}

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-gray-700/50">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = option.value === value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`
                          w-full px-4 py-3 text-left 
                          flex items-center gap-3
                          transition-all duration-200
                          relative
                          ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-l-4 border-blue-400'
                              : 'text-gray-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:text-white'
                          }
                        `}
                      >
                        {/* Icon if provided */}
                        {option.icon && (
                          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {option.icon}
                          </div>
                        )}

                        {/* Option label */}
                        <span className="flex-1 font-medium">{option.label}</span>

                        {/* Checkmark for selected option */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="flex-shrink-0"
                          >
                            <Check className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        )}

                        {/* Hover effect gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer with count */}
              {searchable && filteredOptions.length > 0 && (
                <div className="px-4 py-2 border-t border-white/10 bg-gray-900/50 text-xs text-gray-400 text-center">
                  {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''} found
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

