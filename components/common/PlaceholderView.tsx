import React from 'react';

interface PlaceholderViewProps {
    title: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p>Esta seção está em desenvolvimento.</p>
            <p>Volte em breve para mais novidades!</p>
        </div>
    );
};

export default PlaceholderView;
