'use client';

import React from 'react';
import clsx from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className, containerClassName, id, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
      <div className={clsx('flex flex-col gap-1.5 w-full text-left', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-slate-300">
            {label}
            {props.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={clsx(
            'w-full bg-darkBg border rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 p-3.5 transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-darkSurface disabled:cursor-not-allowed resize-y min-h-[96px]',
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-darkBorder hover:border-slate-600 focus:border-brandIndigo focus:ring-brandIndigo/20',
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-[11px] font-medium text-rose-400">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-slate-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
