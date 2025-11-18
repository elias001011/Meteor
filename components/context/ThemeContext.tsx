
import React, { createContext, useContext } from 'react';
import type { AppTheme, TransparencyMode } from '../../types';

interface ThemeClasses {
    text: string;
    bg: string;
    bgHover: string;
    border: string;
    borderFaded: string;
    ring: string;
    gradient: string;
    hex: string; // For things that need explicit values like meta tags
}

interface ThemeContextProps {
    theme: AppTheme;
    transparencyMode: TransparencyMode;
    classes: ThemeClasses;
    glassClass: string; // Helper for transparency
}

const THEME_DEFINITIONS: Record<AppTheme, ThemeClasses> = {
    cyan: { 
        text: 'text-cyan-400', 
        bg: 'bg-cyan-500', 
        bgHover: 'hover:bg-cyan-400',
        border: 'border-cyan-500', 
        borderFaded: 'border-cyan-500/30',
        ring: 'focus:ring-cyan-500',
        gradient: 'from-cyan-500 to-blue-600',
        hex: '#22d3ee'
    },
    blue: { 
        text: 'text-blue-400', 
        bg: 'bg-blue-600', 
        bgHover: 'hover:bg-blue-500',
        border: 'border-blue-500', 
        borderFaded: 'border-blue-500/30',
        ring: 'focus:ring-blue-500',
        gradient: 'from-blue-600 to-indigo-600',
        hex: '#60a5fa'
    },
    purple: { 
        text: 'text-purple-400', 
        bg: 'bg-purple-500', 
        bgHover: 'hover:bg-purple-400',
        border: 'border-purple-500', 
        borderFaded: 'border-purple-500/30',
        ring: 'focus:ring-purple-500',
        gradient: 'from-purple-500 to-fuchsia-500',
        hex: '#a855f7'
    },
    emerald: { 
        text: 'text-emerald-400', 
        bg: 'bg-emerald-600', 
        bgHover: 'hover:bg-emerald-500',
        border: 'border-emerald-500', 
        borderFaded: 'border-emerald-500/30',
        ring: 'focus:ring-emerald-500',
        gradient: 'from-emerald-600 to-teal-600',
        hex: '#34d399'
    },
    rose: { 
        text: 'text-rose-400', 
        bg: 'bg-rose-600', 
        bgHover: 'hover:bg-rose-500',
        border: 'border-rose-500', 
        borderFaded: 'border-rose-500/30',
        ring: 'focus:ring-rose-500',
        gradient: 'from-rose-600 to-pink-600',
        hex: '#fb7185'
    },
    amber: { 
        text: 'text-amber-400', 
        bg: 'bg-amber-600', 
        bgHover: 'hover:bg-amber-500',
        border: 'border-amber-500', 
        borderFaded: 'border-amber-500/30',
        ring: 'focus:ring-amber-500',
        gradient: 'from-amber-500 to-orange-600',
        hex: '#fbbf24'
    }
};

const ThemeContext = createContext<ThemeContextProps>({
    theme: 'purple',
    transparencyMode: 'glass',
    classes: THEME_DEFINITIONS.purple,
    glassClass: 'bg-gray-900/50 backdrop-blur-xl'
});

export const ThemeProvider: React.FC<{ 
    theme: AppTheme, 
    transparencyMode: TransparencyMode,
    children: React.ReactNode 
}> = ({ theme, transparencyMode, children }) => {
    
    const currentClasses = THEME_DEFINITIONS[theme] || THEME_DEFINITIONS.purple;
    
    // Define class based on mode
    let glassClass = '';
    switch (transparencyMode) {
        case 'off':
            glassClass = 'bg-gray-800'; // Solid, completely opaque
            break;
        case 'low':
            glassClass = 'bg-gray-800/95'; // Very slight transparency, no blur (replaces old 'off')
            break;
        case 'glass':
        default:
            glassClass = 'bg-gray-800/50 backdrop-blur-xl'; // Full glass effect
            break;
    }

    return (
        <ThemeContext.Provider value={{ theme, transparencyMode, classes: currentClasses, glassClass }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
