// ============================================================================
// UI Primitives
// ============================================================================

import { Loader2, Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppError } from '@/lib/errors';

// ── Loading Spinner ──

export function LoadingSpinner({
  fullScreen = false,
  size = 'md',
}: {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];

  const spinner = <Loader2 className={cn(sizeClass, 'animate-spin text-indigo-500')} />;

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}

// ── Empty State ──

export function EmptyState({
  message = 'Nessun elemento',
  description,
  icon: Icon = Inbox,
  action,
}: {
  message?: string;
  description?: string;
  icon?: React.ElementType;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Icon className="w-12 h-12 text-gray-500 mb-4" />
      <p className="text-gray-300 font-medium mb-1">{message}</p>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm
                     hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Error State ──

export function ErrorState({
  error,
  onRetry,
}: {
  error: AppError;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-gray-300 font-medium mb-1">{error.userMessage}</p>
      {error.isRetryable && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm
                     hover:bg-gray-700 active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Riprova
        </button>
      )}
    </div>
  );
}

// ── Badge ──

export function Badge({
  children,
  color = '#6B7280',
  bgColor = '#374151',
  size = 'sm',
}: {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
      style={{ color, backgroundColor: bgColor }}
    >
      {children}
    </span>
  );
}

// ── Skeleton ──

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-800 rounded', className)} />
  );
}
