

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
        accent: t.primary,
        accentForeground: t.primaryForeground,
        error: t.red,
        secondary: t.secondary,
        success: t.green,
        warning: t.orange,
        surface: theme === 'dark' ? '#0F172A' : '#F8FAFC',
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
