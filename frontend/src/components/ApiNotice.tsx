import { AlertCircle, CheckCircle2, LoaderCircle, Radio } from 'lucide-react';
import type { DataMode } from '../types/api.types';
import { Button } from './ui/Button';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface ApiNoticeProps {
  mode: 'MOCK' | 'API';
  state: LoadState;
  dataMode?: DataMode;
  message?: string;
  onRetry?: () => void;
}

const baseStyles =
  'relative z-10 flex min-h-12 items-center gap-2 border-b px-4 py-2 text-xs font-semibold sm:px-6 sm:text-sm';

export function ApiNotice({ mode, state, dataMode, message, onRetry }: ApiNoticeProps) {
  if (state === 'idle') return null;

  if (state === 'loading') {
    return (
      <div className={`${baseStyles} border-blue-100 bg-blue-50 text-blue-950`} role="status">
        <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        Connecting to SunShield services…
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        className={`${baseStyles} border-red-200 bg-red-50 text-red-900`}
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle aria-hidden="true" className="shrink-0" size={18} />
        <span className="flex-1">
          {message || 'SunShield services are unavailable. Please retry.'}
        </span>
        {onRetry && (
          <Button className="min-h-10 px-3 py-2 text-xs" onClick={onRetry} variant="secondary">
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (mode === 'MOCK') {
    return (
      <div className={`${baseStyles} border-amber-200 bg-amber-50 text-amber-950`} role="status">
        <Radio aria-hidden="true" className="shrink-0" size={18} />
        DEMONSTRATION DATA · Not live weather or a verified safety assessment.
      </div>
    );
  }

  const cached = dataMode === 'CACHED';
  return (
    <div
      className={`${baseStyles} ${cached ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-teal-200 bg-teal-50 text-teal-950'}`}
      role="status"
    >
      <CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
      {cached
        ? 'Cached conditions · Check the timestamp before acting.'
        : 'Connected to SunShield API'}
    </div>
  );
}
