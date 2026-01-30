'use client';

import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  );
}

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  progress?: number;
  children?: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  show, 
  message = 'Loading...', 
  progress,
  children,
  className 
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'bg-background/80 backdrop-blur-sm',
      className
    )}>
      <div className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg shadow-lg border">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-sm font-medium">{message}</p>
          {typeof progress === 'number' && (
            <div className="mt-2 w-64">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  message?: string;
  progress?: number;
  status?: 'loading' | 'error' | 'success';
  onRetry?: () => void;
  className?: string;
}

export function LoadingCard({ 
  title = 'Loading',
  message = 'Please wait...',
  progress,
  status = 'loading',
  onRetry,
  className 
}: LoadingCardProps) {
  const getIcon = () => {
    switch (status) {
      case 'error':
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      case 'success':
        return <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-white" />
        </div>;
      default:
        return <LoadingSpinner size="md" />;
    }
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 space-y-4',
      'bg-card rounded-lg border shadow-sm',
      className
    )}>
      {getIcon()}
      
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {typeof progress === 'number' && (
        <div className="w-full max-w-sm">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {status === 'error' && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn(
      'animate-pulse bg-muted rounded',
      className
    )} />
  );
}

interface LoadingGridProps {
  count?: number;
  itemClassName?: string;
  className?: string;
}

export function LoadingGrid({ 
  count = 6, 
  itemClassName = 'h-48',
  className 
}: LoadingGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton 
          key={i} 
          className={cn('w-full', itemClassName)} 
        />
      ))}
    </div>
  );
}

interface LoadingListProps {
  count?: number;
  itemClassName?: string;
  className?: string;
}

export function LoadingList({ 
  count = 5, 
  itemClassName = 'h-16',
  className 
}: LoadingListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <LoadingSkeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <LoadingSkeleton className={cn('w-full', itemClassName)} />
            <LoadingSkeleton className="w-2/3 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Page-level loading component
interface LoadingPageProps {
  title?: string;
  message?: string;
  showSkeleton?: boolean;
}

export function LoadingPage({ 
  title = 'Loading Page',
  message = 'Please wait while we load your content...',
  showSkeleton = false 
}: LoadingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {showSkeleton ? (
          <div className="space-y-6">
            <LoadingSkeleton className="h-8 w-3/4 mx-auto" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-2/3 mx-auto" />
            <div className="space-y-3 mt-8">
              <LoadingSkeleton className="h-16 w-full" />
              <LoadingSkeleton className="h-16 w-full" />
              <LoadingSkeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <LoadingCard title={title} message={message} />
        )}
      </div>
    </div>
  );
}