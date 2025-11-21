

import React, { createContext, useContext, useEffect } from 'react';
import type { AppTheme, TransparencyMode, BackgroundMode, LayoutDensity } from '../../types';

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

interface DensityClasses {
    padding: string;
    gap: string;
    text: string;
    subtext: string;
    // New specific typography scalers
    titleText: string; // For City Name
    tempText: string; // For the main temperature number
    iconSize: string; // For weather icons
    sectionTitle: string; // For headers like "Hourly Forecast"
    settingsGap: string; // Specific for settings page spacing
    itemGap: string; // Gap between small items (like color buttons)
}

interface ThemeContextProps {
    theme: AppTheme;
    transparencyMode: TransparencyMode;
    classes: ThemeClasses;
    glassClass: string; // For generic overlays
    cardClass: string; // For main content containers (The "Glass" look)
    headerClass: string; // Specifically for the top navigation
    appBackgroundClass: string; // The main app background
    isPerformanceMode: boolean;
    density: DensityClasses;
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

const DENSITY_DEFINITIONS: Record<LayoutDensity, DensityClasses> = {
    comfortable: {
        padding: 'p-6',
        gap: 'gap-6',
        text: 'text-base',
        subtext: 'text-sm',
        titleText: 'text-3xl',
        tempText: 'text-8xl',
        iconSize: 'w-5 h-5',
        sectionTitle: 'text-sm mb-3',
        settingsGap: 'space-y-6',
        itemGap: 'gap-4'
    },
    compact: {
        // Aggressive compact mode
        padding: 'p-3', 
        gap: 'gap-2', 
        text: 'text-xs',
        subtext: 'text-[10px]',
        titleText: 'text-xl',
        tempText: 'text-5xl', 
        iconSize: 'w-4 h-4',
        sectionTitle: 'text-[10px] mb-1 font-bold',
        settingsGap: 'space-y-3',
        itemGap: 'gap-2'
    }
};

const ThemeContext = createContext<ThemeContextProps>({
    theme: 'purple',
    transparencyMode: 'glass',
    classes: THEME_DEFINITIONS.purple,
    glassClass: 'bg-black/40 backdrop-blur-xl border border-white/10',
    cardClass: 'bg-white/5 backdrop-blur-lg border border-white/5',
    headerClass: 'bg-[#131B2E]/70 backdrop-blur-md border-b border-white/5',
    appBackgroundClass: 'bg-slate-900',
    isPerformanceMode: false,
    density: DENSITY_DEFINITIONS.comfortable
});

export const ThemeProvider: React.FC<{ 
    theme: AppTheme, 
    transparencyMode: TransparencyMode,
    backgroundMode?: BackgroundMode,
    performanceMode?: boolean,
    reducedMotion?: boolean,
    layoutDensity?: LayoutDensity,
    children: React.ReactNode 
}> = ({ theme, transparencyMode, backgroundMode = 'gradient', performanceMode = false, reducedMotion = false, layoutDensity = 'comfortable', children }) => {
    
    const currentClasses = THEME_DEFINITIONS[theme] || THEME_DEFINITIONS.purple;
    const currentDensity = DENSITY_DEFINITIONS[layoutDensity] || DENSITY_DEFINITIONS.comfortable;
    
    // Generic overlay glass (modals, nav bars)
    let glassClass = '';
    // Card container glass (weather widgets, settings sections)
    let cardClass = '';
    // Header specific style
    let headerClass = '';
    // Background
    let appBackgroundClass = '';

    // Apply Reduced Motion Class to Body
    useEffect(() => {
        if (reducedMotion || performanceMode) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }, [reducedMotion, performanceMode]);

    if (performanceMode) {
        // --- PERFORMANCE MODE ON: REMOVE BLUR, SHADOWS, GRADIENTS ---
        glassClass = 'bg-gray-900 border border-gray-700'; // Solid background, no blur
        cardClass = 'bg-gray-800 border border-gray-700'; // Solid cards
        headerClass = 'bg-gray-900 border-b border-gray-700'; // Solid header
        appBackgroundClass = 'bg-[#0f172a]'; // Solid slate background
    } else {
        // --- NORMAL MODE ---
        switch (transparencyMode) {
            case 'off':
                glassClass = 'bg-slate-900 border border-gray-700'; 
                cardClass = 'bg-slate-800 border border-gray-700';
                headerClass = 'bg-[#0f172a] border-b border-gray-800';
                break;
            case 'low':
                glassClass = 'bg-slate-900/95 border border-white/10'; 
                cardClass = 'bg-slate-800/80 border border-white/5';
                headerClass = 'bg-[#0f172a]/90 backdrop-blur-sm border-b border-white/5';
                break;
            case 'glass':
            default:
                // Elegant, premium glass feel
                glassClass = 'bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl'; 
                cardClass = 'bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-colors duration-300';
                headerClass = 'bg-[#0f172a]/70 backdrop-blur-md border-b border-white/5';
                break;
        }
        
        appBackgroundClass = backgroundMode === 'solid' 
            ? 'bg-[#0f172a]' 
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-black bg-fixed';
    }

    return (
        <ThemeContext.Provider value={{ theme, transparencyMode, classes: currentClasses, glassClass, cardClass, headerClass, appBackgroundClass, isPerformanceMode: performanceMode, density: currentDensity }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
