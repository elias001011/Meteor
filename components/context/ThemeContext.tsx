

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { AppTheme, TransparencyMode, BackgroundMode, LayoutDensity, GlassScope } from '../../types';

interface ThemeClasses {
    text: string;
    bg: string;
    bgHover: string;
    border: string;
    borderFaded: string;
    ring: string;
    gradient: string;
    hex: string;
}

interface DensityClasses {
    padding: string;
    gap: string;
    text: string;
    subtext: string;
    titleText: string;
    tempText: string;
    iconSize: string;
    sectionTitle: string;
    settingsGap: string;
    itemGap: string;
}

interface ThemeContextProps {
    theme: AppTheme;
    transparencyMode: TransparencyMode;
    classes: ThemeClasses;
    glassClass: string; 
    cardClass: string;
    headerClass: string;
    miniClass: string;
    appBackgroundClass: string;
    isPerformanceMode: boolean;
    isAmoled: boolean;
    density: DensityClasses;
}

const THEME_DEFINITIONS: Record<AppTheme, ThemeClasses> = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', bgHover: 'hover:bg-cyan-400', border: 'border-cyan-500', borderFaded: 'border-cyan-500/30', ring: 'focus:ring-cyan-500', gradient: 'from-cyan-500 to-blue-600', hex: '#22d3ee' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-600', bgHover: 'hover:bg-blue-500', border: 'border-blue-500', borderFaded: 'border-blue-500/30', ring: 'focus:ring-blue-500', gradient: 'from-blue-600 to-indigo-600', hex: '#60a5fa' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500', bgHover: 'hover:bg-purple-400', border: 'border-purple-500', borderFaded: 'border-purple-500/30', ring: 'focus:ring-purple-500', gradient: 'from-purple-500 to-fuchsia-500', hex: '#a855f7' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', bgHover: 'hover:bg-emerald-500', border: 'border-emerald-500', borderFaded: 'border-emerald-500/30', ring: 'focus:ring-emerald-500', gradient: 'from-emerald-600 to-teal-600', hex: '#34d399' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-600', bgHover: 'hover:bg-rose-500', border: 'border-rose-500', borderFaded: 'border-rose-500/30', ring: 'focus:ring-rose-500', gradient: 'from-rose-600 to-pink-600', hex: '#fb7185' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-600', bgHover: 'hover:bg-amber-500', border: 'border-amber-500', borderFaded: 'border-amber-500/30', ring: 'focus:ring-amber-500', gradient: 'from-amber-500 to-orange-600', hex: '#fbbf24' }
};

const DENSITY_DEFINITIONS: Record<LayoutDensity, DensityClasses> = {
    comfortable: { padding: 'p-6', gap: 'gap-6', text: 'text-base', subtext: 'text-sm', titleText: 'text-3xl', tempText: 'text-8xl', iconSize: 'w-5 h-5', sectionTitle: 'text-sm mb-3', settingsGap: 'space-y-6', itemGap: 'gap-4' },
    compact: { padding: 'p-5', gap: 'gap-5', text: 'text-[15px]', subtext: 'text-xs', titleText: 'text-2xl', tempText: 'text-7xl', iconSize: 'w-5 h-5', sectionTitle: 'text-xs mb-2 font-bold', settingsGap: 'space-y-5', itemGap: 'gap-3' }
};

const ThemeContext = createContext<ThemeContextProps>({
    theme: 'purple',
    transparencyMode: 'glass',
    classes: THEME_DEFINITIONS.purple,
    glassClass: '',
    cardClass: '',
    headerClass: '',
    miniClass: '',
    appBackgroundClass: '',
    isPerformanceMode: false,
    isAmoled: false,
    density: DENSITY_DEFINITIONS.comfortable
});

export const ThemeProvider: React.FC<{ 
    theme: AppTheme, 
    transparencyMode: TransparencyMode,
    glassScope?: GlassScope, 
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
    
    // Base Color Strategy: Always use Gray 900 (#111827) as the base.
    
    const getFinalStyle = useMemo(() => (scopeType: keyof GlassScope) => {
        // Surfaces stay intentionally quiet. Transparency is a preference, not a visual effect layer.
        const baseBorder = backgroundMode === 'amoled' ? 'border border-white/10' : 'border border-white/[0.08]';
        const shadow = 'shadow-none';
        const solidSurface = backgroundMode === 'amoled' ? 'bg-black' : 'bg-[#111419]';

        // 1. PERFORMANCE MODE: Always Solid, No Blur, No Transparency
        if (performanceMode) {
             return `${solidSurface} ${baseBorder} ${shadow}`;
        }

        // 2. SCOPE DISABLED: If this specific element shouldn't have glass/transparency
        if (!glassScope[scopeType]) {
            return `${solidSurface} ${baseBorder} ${shadow}`;
        }

        // 3. TRANSPARENCY MODES - RECALIBRATED FOR REAL VISIBILITY
        switch (transparencyMode) {
            case 'off': 
                // Solid: 100% Opacity
                return `${solidSurface} ${baseBorder} ${shadow}`;
            
            case 'subtle': 
                // Subtle: 85% Opacity (Enough to see contrast, but very dark)
                return `${backgroundMode === 'amoled' ? 'bg-black' : 'bg-[#111419]/94'} ${baseBorder} ${shadow}`;
            
            case 'balanced': 
                // Balanced: 60% Opacity (Distinctly transparent, no blur)
                return `${backgroundMode === 'amoled' ? 'bg-black' : 'bg-[#111419]/88'} ${baseBorder} ${shadow}`;
            
            case 'transparent': 
                // Legacy Transparent: 40% Opacity (Very transparent, no blur)
                return `${backgroundMode === 'amoled' ? 'bg-black' : 'bg-[#111419]/82'} ${baseBorder} ${shadow}`;

            case 'glass': 
                // Glass: Low Opacity (30%) + Heavy Blur. 
                // This allows the rain to be seen "through" the card, blurred.
                // Added backdrop-saturate to pop colors behind the glass.
                return `${backgroundMode === 'amoled' ? 'bg-black' : 'bg-[#111419]/86 backdrop-blur-md'} ${baseBorder} ${shadow}`;
            
            default:
                return `${solidSurface} ${baseBorder} ${shadow}`;
        }

    }, [transparencyMode, glassScope, performanceMode, backgroundMode]);

    const headerClass = getFinalStyle('header').replace('border ', 'border-b ').replace('shadow-lg', '');
    const cardClass = getFinalStyle('cards');
    const glassClass = getFinalStyle('overlays'); // Used for modals, dropdowns
    
    // Mini widgets always keep a bit of transparency/blur for contrast against the cards
    const miniClass = backgroundMode === 'amoled'
        ? 'bg-black/80 border border-white/15'
        : 'bg-[#111419] border border-white/10';

    const appBackgroundClass = backgroundMode === 'amoled'
        ? 'bg-black'
        : backgroundMode === 'solid'
            ? 'bg-[#0b0d10]'
            : 'bg-[linear-gradient(180deg,_#0d1014_0%,_#090b0e_100%)] bg-fixed';

    useEffect(() => {
        if (reducedMotion || performanceMode) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }, [reducedMotion, performanceMode]);

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            transparencyMode, 
            classes: currentClasses, 
            glassClass, 
            cardClass, 
            headerClass, 
            miniClass, 
            appBackgroundClass, 
            isPerformanceMode: performanceMode,
            isAmoled: backgroundMode === 'amoled',
            density: currentDensity 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
