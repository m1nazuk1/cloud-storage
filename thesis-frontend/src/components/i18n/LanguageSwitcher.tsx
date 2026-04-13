import React, { Fragment, useMemo } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { persistLanguage } from '../../i18n/config';

export const LANG_OPTIONS: {
    code: string;
    short: string;
    full: string;
}[] = [
    { code: 'en', short: 'en', full: 'English' },
    { code: 'ru', short: 'ru', full: 'Русский' },
    { code: 'be', short: 'be', full: 'Беларуская' },
    { code: 'ka', short: 'ka', full: 'ქართული' },
    { code: 'az', short: 'az', full: 'Azərbaycanca' },
    { code: 'zh', short: 'zh', full: '中文' },
    { code: 'ar', short: 'ar', full: 'العربية' },
    { code: 'es', short: 'es', full: 'Español' },
];

const SUPPORTED = new Set(LANG_OPTIONS.map((o) => o.code));

function normalizeCode(lng: string | undefined): string {
    const base = (lng || 'ru').split('-')[0].toLowerCase();
    return SUPPORTED.has(base) ? base : 'en';
}

const LanguageSwitcher: React.FC = () => {
    const { t, i18n } = useTranslation();
    const current = useMemo(() => normalizeCode(i18n.resolvedLanguage || i18n.language), [i18n.resolvedLanguage, i18n.language]);
    const currentOpt = LANG_OPTIONS.find((o) => o.code === current) ?? LANG_OPTIONS[1];

    return (<Listbox value={current} onChange={(code: string) => {
        void i18n.changeLanguage(code);
        persistLanguage(code);
    }}>
            <div className="relative">
                <Listbox.Button type="button" className="relative flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 py-1.5 pl-2 pr-7 text-left shadow-sm shadow-slate-900/5 transition-colors hover:border-indigo-300/80 hover:bg-indigo-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:border-slate-600 dark:bg-slate-800/90 dark:shadow-black/20 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800 min-w-[4.25rem]" aria-label={t('header.language')} title={t('header.language')}>
                    <Languages className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400 opacity-90"/>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-100 tabular-nums antialiased">
                        {currentOpt.short}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden/>
                    </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute right-0 z-50 mt-1.5 max-h-72 min-w-[14rem] overflow-auto rounded-xl border border-slate-200/90 bg-white/95 py-1 shadow-lg shadow-slate-900/15 ring-1 ring-slate-900/5 backdrop-blur-md focus:outline-none dark:border-slate-600 dark:bg-slate-900/95 dark:ring-white/10">
                        {LANG_OPTIONS.map((o) => (<Listbox.Option key={o.code} value={o.code}>
                                {({ active, selected }) => (<span className={`relative flex w-full cursor-pointer select-none items-baseline gap-1 py-2 pl-3 pr-9 text-sm antialiased ${active
                    ? 'bg-indigo-50 text-indigo-950 dark:bg-indigo-950/50 dark:text-indigo-100'
                    : 'text-slate-800 dark:text-slate-100'}`}>
                                        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                            {o.short}
                                        </span>
                                        <span className="truncate text-slate-500 dark:text-slate-400">
                                            ({o.full})
                                        </span>
                                        {selected ? (<span className="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600 dark:text-indigo-400">
                                                <Check className="h-4 w-4 shrink-0" aria-hidden/>
                                            </span>) : null}
                                    </span>)}
                            </Listbox.Option>))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>);
};

export default LanguageSwitcher;
