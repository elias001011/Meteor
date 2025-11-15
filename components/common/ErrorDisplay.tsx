import React from 'react';
import { AlertTriangleIcon } from '../icons';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-400 bg-gray-800/50 p-6 rounded-2xl">
      <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">Ocorreu um erro</h3>
      <p className="mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="bg-cyan-500 text-white font-bold py-2 px-6 rounded-full hover:bg-cyan-400 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  );
};

export default ErrorDisplay;