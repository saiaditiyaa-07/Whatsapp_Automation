'use client';

import React from 'react';
import clsx from 'clsx';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center p-12 bg-darkCard/50 border border-darkBorder/60 rounded-2xl max-w-xl mx-auto my-8',
        className
      )}
    >
      {icon && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-brandIndigo mb-4 border border-indigo-500/20 shadow-inner">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
