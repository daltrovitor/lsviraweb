'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, icon, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-v-blue-500 transition-colors">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-slate-200/80 bg-white/80 py-3 text-sm font-medium text-navy-950',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/25 focus:border-v-blue-500/50 transition-all',
            icon && 'pl-11 pr-4',
            !icon && 'px-4',
            className
          )}
          {...props}
        />
      </div>
      {hint && <p className="text-[11px] text-slate-400 font-medium">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-navy-950 resize-none',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-v-blue-500/25 focus:border-v-blue-500/50 transition-all',
          className
        )}
        {...props}
      />
    </div>
  )
);
Textarea.displayName = 'Textarea';
