'use client';

import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'red' | 'rose' | 'indigo' | 'slate' | 'cyan' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  leftIcon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'slate',
  size = 'md',
  pulse = false,
  leftIcon,
  className,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full select-none';

  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    red: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
    indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-rose-400',
    rose: 'bg-rose-400',
    indigo: 'bg-indigo-400',
    slate: 'bg-slate-400',
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
  };

  return (
    <span className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[variant])} />
          <span className={clsx('relative inline-flex rounded-full h-2 w-2', dotColors[variant])} />
        </span>
      )}
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
    </span>
  );
}
