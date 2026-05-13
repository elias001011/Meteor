import React, { useEffect, useState } from 'react';
import ChatInput from './ChatInput';
import { useTheme } from '../context/ThemeContext';

interface MobileAiControlsProps {
    isVisible: boolean;
    onSendMessage: (text: string) => void;
    isSending: boolean;
    isListening: boolean;
    onToggleListening: () => void;
    chatInputText: string;
    setChatInputText: (text: string) => void;
}

const MobileAiControls: React.FC<MobileAiControlsProps> = (props) => {
    const { isVisible, onSendMessage, isSending, ...chatInputProps } = props;
    const { glassClass } = useTheme();
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setKeyboardOffset(0);
            return;
        }

        const updateKeyboardOffset = () => {
            const viewport = window.visualViewport;
            if (!viewport) {
                setKeyboardOffset(0);
                return;
            }

            const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
            setKeyboardOffset(Math.round(offset));
        };

        updateKeyboardOffset();

        const viewport = window.visualViewport;
        viewport?.addEventListener('resize', updateKeyboardOffset);
        viewport?.addEventListener('scroll', updateKeyboardOffset);
        window.addEventListener('orientationchange', updateKeyboardOffset);

        return () => {
            viewport?.removeEventListener('resize', updateKeyboardOffset);
            viewport?.removeEventListener('scroll', updateKeyboardOffset);
            window.removeEventListener('orientationchange', updateKeyboardOffset);
            setKeyboardOffset(0);
        };
    }, [isVisible]);
    
    return (
        <div
            className={`fixed inset-x-0 z-40 p-4 transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
            style={{ bottom: `calc(5rem + env(safe-area-inset-bottom, 0px) + ${keyboardOffset}px)` }}
        >
             <div className={`${glassClass} p-2 rounded-2xl shadow-lg`}>
                <ChatInput 
                    onSendMessage={onSendMessage} 
                    isSending={isSending} 
                    text={chatInputProps.chatInputText}
                    setText={chatInputProps.setChatInputText}
                    isListening={chatInputProps.isListening}
                    onToggleListening={chatInputProps.onToggleListening}
                />
            </div>
        </div>
    );
};

export default MobileAiControls;
