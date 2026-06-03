import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  max,
  className,
  variant = 'gold',
}: {
  value: number;
  max: number;
  className?: string;
  variant?: 'gold' | 'blue';
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('w-full h-2.5 bg-navy-800/20 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          variant === 'gold' ? 'bg-gradient-to-r from-gold-400 to-gold-500' : 'bg-gradient-to-r from-v-blue-400 to-v-blue-500'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
