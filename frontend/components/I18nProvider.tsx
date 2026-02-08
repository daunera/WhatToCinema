
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { Dictionary, Locale, defaultLocale, dictionaries } from '@/lib/dictionaries';
import { hu, enUS } from 'date-fns/locale';

interface I18nContextType {
    dict: Dictionary;
    locale: Locale;
    dateLocale: any; // date-fns locale
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}

export function I18nProvider({
    children,
    locale,
    dict
}: {
    children: React.ReactNode;
    locale: Locale;
    dict: Dictionary;
}) {
    const dateLocale = useMemo(() => {
        return locale === 'hu' ? hu : enUS;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ dict, locale, dateLocale }}>
            {children}
        </I18nContext.Provider>
    );
}
