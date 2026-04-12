import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'thesis-theme';
interface ThemeContextValue {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
function getPreferredTheme(): Theme {
    if (typeof window === 'undefined')
        return 'light';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light')
        return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export const ThemeProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());
    const apply = useCallback((t: Theme) => {
        const root = document.documentElement;
        if (t === 'dark') {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        localStorage.setItem(STORAGE_KEY, t);
    }, []);
    useLayoutEffect(() => {
        apply(theme);
    }, [theme, apply]);
    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
    }, []);
    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);
    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return ctx;
}
