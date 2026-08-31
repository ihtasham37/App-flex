import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'default' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
      primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg',
      secondary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg',
      outline: 'bg-white/60 border border-white text-slate-800 hover:bg-white transition-colors shadow-sm',
      ghost: 'text-slate-600 hover:bg-white/40',
      gradient: 'bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-xl shadow-blue-500/20',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-6 py-2.5 text-base rounded-xl',
      lg: 'px-8 py-3.5 text-lg rounded-2xl font-semibold',
      icon: 'p-2 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
