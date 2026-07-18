import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-200/60 rounded ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number, cols?: number }) {
  return (
    <div className="w-full">
      <div className="flex border-b border-border pb-4 mb-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 flex-1" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`row-${rIdx}`} className="flex gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton key={`cell-${rIdx}-${cIdx}`} className="h-10 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
