import React from 'react';
import ChatInput from './ChatInput';

interface MobileAiControlsProps {
    isVisible: boolean;
    onSendMessage: (text: string) => void;
    isSending: boolean;
}

const MobileAiControls: React.FC<MobileAiControlsProps> = ({ isVisible, onSendMessage, isSending }) => {
    return (
        <div className={`fixed bottom-24 inset-x-0 z-30 p-4 pt-2 transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
             <div className="bg-gray-800/80 backdrop-blur-lg border-t border-gray-700/50 p-2 rounded-t-2xl">
                <ChatInput onSendMessage={onSendMessage} isSending={isSending} />
            </div>
        </div>
    );
};

export default MobileAiControls;