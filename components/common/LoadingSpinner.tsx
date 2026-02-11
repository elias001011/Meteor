import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'lg', text = 'Buscando dados...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-b-2',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-12 w-12 border-b-2'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-cyan-400`}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Carregando...</span>
      </div>
      {size === 'lg' && <p className="text-gray-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
