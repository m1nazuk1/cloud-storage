import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { EN, RU } from './localeBundle';
import es from './locales/es.json';
import be from './locales/be.json';
import ka from './locales/ka.json';
import az from './locales/az.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

const STORAGE_KEY = 'i18n_lang';

function asStrings(x: unknown): Record<string, string> {
    return x as Record<string, string>;
}

void i18n.use(initReactI18next).init({
    resources: {
        en: { translation: EN },
        ru: { translation: RU },
        es: { translation: asStrings(es) },
        be: { translation: asStrings(be) },
        ka: { translation: asStrings(ka) },
        az: { translation: asStrings(az) },
        zh: { translation: asStrings(zh) },
        ar: { translation: asStrings(ar) },
    },
    lng: typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || 'ru') : 'ru',
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'be', 'ka', 'az', 'zh', 'ar', 'es'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    react: {
        useSuspense: false,
    },
});

i18n.on('languageChanged', (lng) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lng.split('-')[0];
    }
});

if (typeof document !== 'undefined') {
    document.documentElement.lang = (i18n.language || 'ru').split('-')[0];
}

export function persistLanguage(lng: string) {
    localStorage.setItem(STORAGE_KEY, lng);
}

export default i18n;
