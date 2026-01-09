'use client';

import React, { useState } from 'react';

interface AnimatedFormFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: string;
  error?: string;
  success?: boolean;
}

export default function AnimatedFormField({
  label,
  placeholder,
  type = 'text',
  value = '',
  onChange,
  icon,
  error,
  success,
}: AnimatedFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
    <style>{`
      @keyframes labelFloat {
        0% { transform: translateY(0); opacity: 0.7; }
        100% { transform: translateY(-24px); opacity: 1; }
      }
      @keyframes borderGlow {
        0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        100% { box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2); }
      }
      @keyframes successCheck {
        0% { transform: scale(0) rotate(-45deg); opacity: 0; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      .form-field-wrapper {
        position: relative;
      }
      .form-field-label {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .form-field-label.floating {
        animation: labelFloat 0.3s ease-out forwards;
      }
      .form-field-input {
        transition: all 0.3s ease;
      }
      .form-field-input:focus {
        animation: borderGlow 0.6s ease-out;
      }
      .form-field-success {
        animation: successCheck 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
    `}</style>
  ) || (
    <div className="form-field-wrapper">
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl transition-all duration-300">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          id={name || label?.toLowerCase().replace(/\s+/g, '-')}
          name={name || label?.toLowerCase().replace(/\s+/g, '-')}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`form-field-input w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-lg bg-white/5 border-2 transition-all duration-300 text-white placeholder-gray-500 focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-400'
              : success
              ? 'border-green-500 focus:border-green-400'
              : isFocused
              ? 'border-ipl-gold bg-white/10'
              : 'border-white/10 hover:border-white/20'
          }`}
        />

        {/* Floating Label */}
        <label
          htmlFor={name || label?.toLowerCase().replace(/\s+/g, '-')}
          className={`form-field-label absolute left-4 top-3 text-gray-400 text-sm pointer-events-none ${
            isFocused || value ? 'floating' : ''
          }`}
        >
          {label}
        </label>

        {/* Success Checkmark */}
        {success && (
          <div className="form-field-success absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Error Icon */}
        {error && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-400 animate-fade-in">{error}</p>
      )}
    </div>
    </>
  );
}
