import type { HTMLAttributes, ReactNode } from 'react';

const tones = {
  neutral: 'bg-slate-100 text-slate-700',
  demo: 'bg-amber-100 text-amber-900',
  protective: 'bg-teal-100 text-teal-900',
  critical: 'bg-red-100 text-red-800',
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
