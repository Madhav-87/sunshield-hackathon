export const variants = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-900',
  protective: 'bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-700',
  critical: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-800',
  secondary:
    'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-teal-700',
} as const;

export type ButtonVariant = keyof typeof variants;

const baseStyles =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export function buttonStyles(variant: ButtonVariant = 'primary'): string {
  return `${baseStyles} ${variants[variant]}`;
}
