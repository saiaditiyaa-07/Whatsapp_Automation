'use client';

import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  onChange?: (value: string, e?: React.ChangeEvent<HTMLSelectElement>) => void;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      onChange,
      className,
      containerClassName,
      leftIcon,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value, e);
      }
    };

    return (
      <div className={clsx('flex flex-col gap-1.5 w-full text-left', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-300">
            {label}
            {props.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            value={value}
            onChange={handleChange}
            className={clsx(
              'w-full appearance-none bg-darkBg border rounded-xl text-xs sm:text-sm text-slate-100 py-2.5 transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]',
              leftIcon ? 'pl-10' : 'pl-3.5',
              'pr-10',
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-darkBorder hover:border-slate-600 focus:border-brandIndigo focus:ring-brandIndigo/20',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-darkSurface text-slate-200 py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error ? (
          <span className="text-[11px] font-medium text-rose-400">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-slate-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
