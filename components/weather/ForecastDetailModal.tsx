
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            {/* Minimal Floating Toast - Solid & Auto-fading */}
            <div className="bg-gray-900 border border-gray-700 shadow-2xl px-6 py-3 rounded-full animate-fast-pop flex items-center justify-center">
                <span className="text-white font-bold capitalize text-sm tracking-wide">
                    {data.description}
                </span>
            </div>
        </div>
    );
};

export default ForecastDetailModal;
