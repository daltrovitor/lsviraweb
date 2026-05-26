'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LogEntry {
  msg: string;
  time: Date;
}

export function LogTerminal({
  logs,
  title = 'Logs do Sistema',
  className,
  emptyMessage = 'Aguardando início...',
}: {
  logs: LogEntry[];
  title?: string;
  className?: string;
  emptyMessage?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-navy-950 border border-navy-800/80 p-5 font-mono text-xs shadow-xl',
        className
      )}
    >
      <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2 mb-4 shrink-0">
        <Clock size={14} className="text-gold-400" />
        {title}
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-72">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">{emptyMessage}</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3 border-b border-slate-800/60 pb-2">
              <span className="text-slate-500 shrink-0">[{log.time.toLocaleTimeString()}]</span>
              <span className="text-slate-300 break-words">{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
