'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'team' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  teamColors?: {
    primary: string;
    secondary: string;
  };
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function PremiumButton({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  teamColors,
  icon,
  iconPosition = 'right',
  disabled = false,
  fullWidth = false,
}: PremiumButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;
    if (href) {
      router.push(href);
    } else if (onClick) {
      onClick();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-6 py-2.5 text-sm',
    md: 'px-8 py-3.5 text-base',
    lg: 'px-12 py-5 text-lg',
  };

  // Base styles
  const baseClasses = `
    relative overflow-hidden
    font-bold rounded-xl
    transition-all duration-500
    transform hover:scale-[1.02] active:scale-[0.98]
    cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${className}
  `;

  // Variant styles
  const getVariantStyles = () => {
    if (variant === 'team' && teamColors) {
      return {
        background: `linear-gradient(135deg, ${teamColors.primary}, ${teamColors.secondary})`,
        boxShadow: `0 10px 40px ${teamColors.primary}40, 0 0 60px ${teamColors.secondary}30`,
        border: `2px solid ${teamColors.primary}60`,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
          boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)',
          border: '2px solid rgba(124, 58, 237, 0.5)',
        };
      case 'secondary':
        return {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        };
      case 'gradient':
        return {
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)',
          boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)',
          border: '2px solid rgba(255, 215, 0, 0.5)',
        };
      default:
        return {
          background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
          boxShadow: '0 10px 40px rgba(124, 58, 237, 0.4)',
          border: '2px solid rgba(124, 58, 237, 0.5)',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Hover styles
  const getHoverStyles = () => {
    if (variant === 'team' && teamColors) {
      return {
        boxShadow: `0 20px 60px ${teamColors.primary}60, 0 0 80px ${teamColors.secondary}40`,
      };
    }
    return {
      boxShadow: '0 20px 60px rgba(124, 58, 237, 0.6), 0 0 80px rgba(147, 51, 234, 0.4)',
    };
  };

  const buttonContent = (
    <>
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: variant === 'team' && teamColors
            ? `linear-gradient(135deg, ${teamColors.secondary}20, ${teamColors.primary}20)`
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        }}
      />

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

      {/* Glow effect on hover */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
        style={{
          background: variant === 'team' && teamColors
            ? `radial-gradient(circle, ${teamColors.primary}60, transparent)`
            : 'radial-gradient(circle, rgba(124, 58, 237, 0.6), transparent)',
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-3 font-black tracking-tight">
        {icon && iconPosition === 'left' && (
          <span className="transform group-hover:-translate-x-1 transition-transform duration-300">
            {icon}
          </span>
        )}
        <span>{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="transform group-hover:translate-x-1 transition-transform duration-300">
            {icon}
          </span>
        )}
        {!icon && (
          <svg 
            className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
      </span>

      {/* Pulse animation ring */}
      <div 
        className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 animate-ping"
        style={{
          borderColor: variant === 'team' && teamColors ? teamColors.primary : '#7C3AED',
        }}
      />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`group ${baseClasses}`}
        style={{
          ...variantStyles,
          color: '#fff',
        }}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group ${baseClasses}`}
      style={{
        ...variantStyles,
        color: '#fff',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, variantStyles);
      }}
    >
      {buttonContent}
    </button>
  );
}

