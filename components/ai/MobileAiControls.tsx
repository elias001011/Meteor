


import React from 'react';
import ChatInput from './ChatInput';

interface MobileAiControlsProps {
    isVisible: boolean;
    onSendMessage: (text: string) => void;
    isSending: boolean;
    // New props for search and speech-to-text
    isListening: boolean;
    onToggleListening: () => void;
    isSearchEnabled: boolean;
    onToggleSearch: () => void;
    chatInputText: string;
    setChatInputText: (text: string) => void;
}

const MobileAiControls: React.FC<MobileAiControlsProps> = (props) => {
    const { isVisible, onSendMessage, isSending, ...chatInputProps } = props;
    
    return (
        <div className={`fixed bottom-20 inset-x-0 z-40 p-4 transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
             <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 p-2 rounded-2xl shadow-lg">
                <ChatInput 
                    onSendMessage={onSendMessage} 
                    isSending={isSending} 
                    text={chatInputProps.chatInputText}
                    setText={chatInputProps.setChatInputText}
                    isListening={chatInputProps.isListening}
                    onToggleListening={chatInputProps.onToggleListening}
                    isSearchEnabled={chatInputProps.isSearchEnabled}
                    onToggleSearch={chatInputProps.onToggleSearch}
                />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2 px-2">A IA pode cometer erros.</p>
        </div>
    );
};

export default MobileAiControls;