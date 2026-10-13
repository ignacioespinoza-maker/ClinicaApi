import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  message?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  message = 'Cargando información médica...',
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="skeleton-container"
    >
      <span className="sr-only">{message}</span>
      <div className="skeleton-bar skeleton-header" aria-hidden="true" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-row" aria-hidden="true">
          <div className="skeleton-bar skeleton-col" style={{ width: `${30 + (index % 3) * 20}%` }} />
          <div className="skeleton-bar skeleton-col" style={{ width: '20%' }} />
          <div className="skeleton-bar skeleton-col" style={{ width: '15%' }} />
        </div>
      ))}
    </div>
  );
};
