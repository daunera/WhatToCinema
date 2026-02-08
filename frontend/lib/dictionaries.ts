


import hu from '@/locales/hu.json';
import en from '@/locales/en.json';

export type Locale = 'en' | 'hu';

export const defaultLocale: Locale = 'en';

export const locales: Locale[] = ['en', 'hu'];

export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = {
    hu,
    en
};


export const getDictionary = (locale: Locale = defaultLocale) => {
    return dictionaries[locale] || dictionaries[defaultLocale];
};

