import React from 'react';
import { Theme } from '../theme';

export const getAppColors = (theme: 'light' | 'dark') => {
    const t = theme === 'dark' ? Theme.dark.colors : Theme.light.colors;
    return {
        background: t.background,
        foreground: t.foreground,
        glass: theme === 'dark' ? 'rgba(20, 20, 25, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        glassDark: theme === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)',
        border: t.border,
        borderDark: t.borderStrong,
        textMuted: t.textMuted,
        white: t.white,
        accent: t.primary,
        accentForeground: t.primaryForeground,
        error: t.error,
        secondary: t.muted,
        success: t.success,
        warning: t.warning,
        surface: theme === 'dark' ? '#1A1A24' : '#F2F2F7',
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
