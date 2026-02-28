import React from 'react';
import { Colors } from '../theme/colors';

export const getAppColors = (theme: 'light' | 'dark') => {
    const t = theme === 'dark' ? Colors.dark : Colors.light;
    return {
        background: t.background,
        foreground: t.foreground,
        glass: theme === 'dark' ? 'rgba(2, 6, 23, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        glassDark: theme === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)',
        border: t.border,
        borderDark: theme === 'dark' ? '#1E293B' : '#CBD5E1',
        textMuted: t.textMuted,
        white: '#FFFFFF',
        accent: t.coral,
        accentForeground: t.primaryForeground,
        error: t.red,
        secondary: t.secondary,
        success: t.green,
        warning: t.orange,
        surface: theme === 'dark' ? '#1C1C1E' : '#FFFFFF',
        card: t.card,
        cardForeground: t.cardForeground,
        // Additional colors
        primary: t.primary,
        primaryForeground: t.primaryForeground,
        muted: t.muted,
        mutedForeground: t.mutedForeground,
        destructive: t.destructive,
        destructiveForeground: t.destructiveForeground,
        input: t.input,
        ring: t.ring,
        // Brand colors
        coral: t.coral,
        coralLight: t.coralLight,
        coralDark: t.coralDark,
        // Category colors
        blue: t.coral, // Use coral instead of blue for brand consistency
        green: t.green,
        red: t.red,
        orange: t.orange,
        yellow: t.yellow,
        pink: t.pink,
        purple: t.purple,
        teal: t.teal,
        indigo: t.indigo,
    };
};

export const ThemeContext = React.createContext({
    theme: 'light' as 'light' | 'dark',
    colors: getAppColors('light'),
    setTheme: (t: 'light' | 'dark') => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const colors = getAppColors(theme);

    return (
        <ThemeContext.Provider value={{ theme, colors, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => React.useContext(ThemeContext);
