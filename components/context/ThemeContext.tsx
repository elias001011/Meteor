
import React, { createContext, useContext } from 'react';
import type { AppTheme, TransparencyLevel } from '../../types';

interface ThemeClasses {
    text: string;
    bg: string;
    bgHover: string;
    border: string;
    ring: string;
    gradient: string;
    hex: string; // For things that need explicit values like meta tags
}

interface ThemeContextProps {
    theme: AppTheme;
    transparencyLevel: TransparencyLevel;
    classes: ThemeClasses;
    glassClass: string; // Helper for transparency
}

const THEME_DEFINITIONS: Record<AppTheme, ThemeClasses> = {
    cyan: { 
        text: 'text-cyan-400', 
        bg: 'bg-cyan-500', 
        bgHover: 'hover:bg-cyan-400',
        border: 'border-cyan-500', 
        ring: 'focus:ring-cyan-500',
        gradient: 'from-cyan-500 to-blue-600',
        hex: '#22d3ee'
    },
    blue: { 
        text: 'text-blue-400', 
        bg: 'bg-blue-600', 
        bgHover: 'hover:bg-blue-500',
        border: 'border-blue-500', 
        ring: 'focus:ring-blue-500',
        gradient: 'from-blue-600 to-indigo-600',
        hex: '#60a5fa'
    },
    purple: { 
        text: 'text-purple-400', 
        bg: 'bg-purple-600', 
        bgHover: 'hover:bg-purple-500',
        border: 'border-purple-500', 
        ring: 'focus:ring-purple-500',
        gradient: 'from-purple-600 to-fuchsia-600',
        hex: '#c084fc'
    },
    emerald: { 
        text: 'text-emerald-400', 
        bg: 'bg-emerald-600', 
        bgHover: 'hover:bg-emerald-500',
        border: 'border-emerald-500', 
        ring: 'focus:ring-emerald-500',
        gradient: 'from-emerald-600 to-teal-600',
        hex: '#34d399'
    },
    rose: { 
        text: 'text-rose-400', 
        bg: 'bg-rose-600', 
        bgHover: 'hover:bg-rose-500',
        border: 'border-rose-500', 
        ring: 'focus:ring-rose-500',
        gradient: 'from-rose-600 to-pink-600',
        hex: '#fb7185'
    },
    amber: { 
        text: 'text-amber-400', 
        bg: 'bg-amber-600', 
        bgHover: 'hover:bg-amber-500',
        border: 'border-amber-500', 
        ring: 'focus:ring-amber-500',
        gradient: 'from-amber-500 to-orange-600',
        hex: '#fbbf24'
    }
};

const ThemeContext = createContext<ThemeContextProps>({
    theme: 'cyan',
    transparencyLevel: 'none',
    classes: THEME_DEFINITIONS.cyan,
    glassClass: 'bg-gray-900'
});

export const ThemeProvider: React.FC<{ 
    theme: AppTheme, 
    transparencyLevel?: TransparencyLevel, // Now optional or derived
    enableTransparency?: boolean, // Backward compatibility prop
    children: React.ReactNode 
}> = ({ theme, transparencyLevel, enableTransparency, children }) => {
    
    // Resolve level
    let level: TransparencyLevel = transparencyLevel || 'none';
    // If enableTransparency is passed but transparencyLevel is not, assume it's legacy code
    if (transparencyLevel === undefined && enableTransparency !== undefined) {
        level = enableTransparency ? 'high' : 'none';
    }

    const currentClasses = THEME_DEFINITIONS[theme];
    
    let glassClass = 'bg-gray-900';
    if (level === 'low') {
        glassClass = 'bg-gray-900/95 backdrop-blur-sm border-white/5';
    } else if (level === 'high') {
        glassClass = 'bg-gray-900/60 backdrop-blur-md border-white/10';
    }

    return (
        <ThemeContext.Provider value={{ theme, transparencyLevel: level, classes: currentClasses, glassClass }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);