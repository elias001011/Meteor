import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Carregando...</span>
      </div>
      <p className="text-gray-400">Buscando dados...</p>
    </div>
  );
};

export default LoadingSpinner;