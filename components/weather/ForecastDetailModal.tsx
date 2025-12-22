
import React, { useEffect } from 'react';

interface ForecastDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title?: string;
        temp?: number;
        icon?: string;
        description: string;
        pop?: number;
    } | null;
}

const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({ isOpen, onClose, data }) => {
    
    // Auto-close after 2 seconds
    useEffect(() => {
        if (isOpen && data) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, data, onClose]);

    if (!isOpen || !data) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-full flex justify-center px-4">
            {/* Minimal Floating Toast - Pílula Sólida Inferior */}
            <div className="bg-gray-900 border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] px-6 py-3 rounded-full animate-fast-pop flex items-center justify-center min-w-[150px]">
                <span className="text-white font-bold capitalize text-sm tracking-wide text-center">
                    {data.description}
                </span>
            </div>
        </div>
    );
};

export default ForecastDetailModal;
