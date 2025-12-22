
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    // Auto-close after 2 seconds
    useEffect(() => {
        if (isOpen && data) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, data, onClose]);

    if (!isOpen || !data || !mounted) return null;

    // Usamos Portal para jogar o elemento direto no body.
    // Isso garante que o position: fixed seja relativo à TELA (viewport)
    // e não ao container pai (que pode ter transform/overflow que quebra o fixed).
    return createPortal(
        <div className="fixed bottom-24 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-4">
            {/* Minimal Floating Toast - Pílula Sólida Inferior */}
            <div className="bg-gray-900 border border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.6)] px-6 py-3 rounded-full animate-fast-pop flex items-center justify-center min-w-[140px] max-w-[80%]">
                <span className="text-white font-bold capitalize text-sm tracking-wide text-center truncate">
                    {data.description}
                </span>
            </div>
        </div>,
        document.body
    );
};

export default ForecastDetailModal;
