'use client';

import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brandIndigo/50 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variantStyles = {
      primary:
        'bg-brandIndigo hover:bg-brandIndigoHover text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30',
      secondary:
        'bg-darkSurface hover:bg-slate-800 text-slate-200 border border-darkBorder hover:border-slate-600 shadow-sm',
      outline:
        'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white border border-darkBorder hover:border-indigo-500/50',
      ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-500/30',
      success:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/30',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
      md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[42px]',
      lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 min-h-[48px]',
      icon: 'p-2.5 w-10 h-10 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
