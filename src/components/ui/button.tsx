'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 shadow-lg shadow-navy-900/20 border border-navy-800',
  secondary:
    'bg-white text-navy-900 border border-slate-200 hover:bg-slate-50 hover:border-v-blue-400/40',
  gold:
    'bg-gold-400 text-navy-950 hover:bg-gold-500 shadow-lg shadow-gold-400/25 font-bold border border-gold-500/30',
  ghost: 'bg-transparent text-navy-700 hover:bg-navy-50',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  outline:
    'bg-transparent border border-v-blue-500/40 text-v-blue-600 hover:bg-v-blue-500/5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, fullWidth, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
