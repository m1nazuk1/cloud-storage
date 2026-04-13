import React from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
const ThemeToggle: React.FC = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    return (<button type="button" onClick={toggleTheme} className="relative rounded-xl p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-colors duration-200" title={theme === 'dark' ? t('theme.light') : t('theme.dark')} aria-label={theme === 'dark' ? t('theme.enableLight') : t('theme.enableDark')}>
            {theme === 'dark' ? <Sun className="h-6 w-6"/> : <Moon className="h-6 w-6"/>}
        </button>);
};
export default ThemeToggle;
