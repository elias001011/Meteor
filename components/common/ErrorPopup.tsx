import React from 'react';
import { InfoIcon, XIcon } from '../icons';

interface ErrorPopupProps {
    message: string;
    onClose: () => void;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, onClose }) => {
    return (
        <div 
            className="fixed top-20 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md"
            role="alert"
        >
            <div className="bg-blue-600/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 border border-blue-500/50">
                <div className="flex items-center gap-3">
                    <InfoIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0" aria-label="Fechar aviso">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ErrorPopup;