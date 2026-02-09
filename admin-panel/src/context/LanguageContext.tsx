"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language } from "@/utils/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['fr']) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'fr',
    setLanguage: () => { },
    t: (key) => key,
    isRTL: false,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>('fr');

    useEffect(() => {
        const savedLang = localStorage.getItem('admin_lang') as Language;
        if (savedLang && (savedLang === 'fr' || savedLang === 'ar')) {
            setLanguage(savedLang);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('admin_lang', language);
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: keyof typeof translations['fr']): string => {
        return translations[language][key] || translations['fr'][key] || key;
    };

    const isRTL = language === 'ar';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
