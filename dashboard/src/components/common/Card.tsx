'use client';

import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'bordered' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  header,
  footer,
  className,
  onClick,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200 overflow-hidden';
  
  const variantStyles = {
    default: 'bg-darkCard border border-darkBorder/70 shadow-sm',
    glass: 'glass-card',
    bordered: 'bg-darkSurface/90 border border-darkBorder shadow-sm',
    elevated: 'bg-darkCard border border-darkBorder shadow-xl shadow-black/40',
    interactive: 'bg-darkCard border border-darkBorder/70 glass-card-hover cursor-pointer'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        className
      )}
      onClick={onClick}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-darkBorder/60 bg-darkSurface/50 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={clsx(paddingStyles[padding])}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-darkBorder/60 bg-darkSurface/40 flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}
