

import React, { createContext, useContext, useEffect } from 'react';
import type { AppTheme, TransparencyMode, BackgroundMode, LayoutDensity, GlassScope } from '../../types';

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
        // Adjusted to be less aggressive - slightly reduced version of normal
        padding: 'p-5', 
        gap: 'gap-5', 
        text: 'text-[15px]', // Slightly smaller than base, bigger than sm
        subtext: 'text-xs',
        titleText: 'text-2xl',
        tempText: 'text-7xl', 
        iconSize: 'w-5 h-5',
        sectionTitle: 'text-xs mb-2 font-bold',
        settingsGap: 'space-y-5',
        itemGap: 'gap-3'
    }
};

const ThemeContext = createContext<ThemeContextProps>({
    theme: 'purple',
    transparencyMode: 'glass',
    classes: THEME_DEFINITIONS.purple,
    glassClass: 'bg-[#0f172a]/60 backdrop-blur-xl border border-white/10',
    cardClass: 'bg-[#0f172a]/60 backdrop-blur-xl border border-white/10',
    headerClass: 'bg-[#0f172a]/60 backdrop-blur-xl border-b border-white/10',
    appBackgroundClass: 'bg-[#0f172a]',
    isPerformanceMode: false,
    density: DENSITY_DEFINITIONS.comfortable
});

export const ThemeProvider: React.FC<{ 
    theme: AppTheme, 
    transparencyMode: TransparencyMode,
    glassScope?: GlassScope, // Granular control
    backgroundMode?: BackgroundMode,
    performanceMode?: boolean,
    reducedMotion?: boolean,
    layoutDensity?: LayoutDensity,
    children: React.ReactNode 
}> = ({ 
    theme, 
    transparencyMode, 
    glassScope = { header: true, cards: true, overlays: true }, 
    backgroundMode = 'gradient', 
    performanceMode = false, 
    reducedMotion = false, 
    layoutDensity = 'comfortable', 
    children 
}) => {
    
    const currentClasses = THEME_DEFINITIONS[theme] || THEME_DEFINITIONS.purple;
    const currentDensity = DENSITY_DEFINITIONS[layoutDensity] || DENSITY_DEFINITIONS.comfortable;
    
    // --- DEFINITIONS FOR DIFFERENT MODES (MATCHING HEADER STYLE) ---

    // Base Colors - UNIFIED TO DEEP DARK (#0f172a)
    // Removed #1e293b to fix the "washed out" look in solid/hybrid modes.
    const baseDark = 'bg-[#0f172a]'; 
    const baseCard = 'bg-[#0f172a]'; 

    // 1. SOLID / PERFORMANCE MODE (No Blur, 100% Opacity)
    // "Sólido é sólido"
    // We add a subtle white/10 border to define edges since bg is same as body.
    const solidOverlay = `${baseDark} border border-white/10 shadow-xl`;
    const solidCard = `${baseCard} border border-white/10 shadow-none`; 
    const solidHeader = `${baseDark} border-b border-white/10`;

    // 2. HYBRID / LOW (Semi-Transparent, NO BLUR)
    // "Híbrido é só semi transparente, seco mesmo"
    // 90% opacity for readability, ZERO filter.
    const hybridOverlay = `${baseDark}/90 border border-white/10 shadow-xl`; 
    const hybridCard = `${baseCard}/90 border border-white/10 shadow-md`;
    const hybridHeader = `${baseDark}/90 border-b border-white/10`;

    // 3. GLASS / HIGH (Transparency + High Blur)
    // "Vidro DEVE TER A PORRA DO EFEITO DE VIDRO"
    // 60% opacity + backdrop-blur-xl
    const glassOverlay = `${baseDark}/60 backdrop-blur-xl border border-white/10 shadow-2xl`; 
    const glassCard = `${baseCard}/60 backdrop-blur-xl border border-white/10 shadow-lg hover:bg-white/5 transition-colors duration-300`;
    const glassHeader = `${baseDark}/60 backdrop-blur-xl border-b border-white/10`;

    // Initialize Variables
    let glassClass = '';
    let cardClass = '';
    let headerClass = '';
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
        // --- PERFORMANCE MODE ON: FORCE SOLID ---
        glassClass = solidOverlay;
        cardClass = solidCard;
        headerClass = solidHeader;
        appBackgroundClass = baseDark; 
    } else {
        // --- NORMAL MODES ---
        
        // 1. Overlays (Modals, Nav, Dropdowns)
        if (transparencyMode === 'glass' && glassScope.overlays) {
            glassClass = glassOverlay;
        } else if (transparencyMode === 'off') {
            glassClass = solidOverlay;
        } else {
            // Low/Hybrid falls here
            glassClass = hybridOverlay;
        }

        // 2. Cards (Widgets, Sections)
        if (transparencyMode === 'glass' && glassScope.cards) {
            cardClass = glassCard;
        } else if (transparencyMode === 'off') {
            cardClass = solidCard;
        } else {
            cardClass = hybridCard;
        }

        // 3. Header
        if (transparencyMode === 'glass' && glassScope.header) {
            headerClass = glassHeader;
        } else if (transparencyMode === 'off') {
            headerClass = solidHeader;
        } else {
            headerClass = hybridHeader;
        }
        
        appBackgroundClass = backgroundMode === 'solid' 
            ? baseDark
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-black bg-fixed';
    }

    return (
        <ThemeContext.Provider value={{ theme, transparencyMode, classes: currentClasses, glassClass, cardClass, headerClass, appBackgroundClass, isPerformanceMode: performanceMode, density: currentDensity }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);