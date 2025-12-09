// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Default language
let savedLang: 'en' | 'uz' | 'ru' = 'ru';

// Only access localStorage on the client side
if (typeof window !== 'undefined') {
  const lang = localStorage.getItem('lang') as 'en' | 'uz' | 'ru' | null;
  if (lang) {
    savedLang = lang;
  }
}

i18n
  .use(HttpBackend) // Load translations using HTTP backend
  .use(initReactI18next) // Bind react-i18next to i18next
  .init({
    lng: savedLang, // Set the initial language
    fallbackLng: 'en', // Fallback language if translation is missing
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    backend: {
      loadPath: '/locales/{{lng}}.json', // Path to translation files
    },
    react: {
      useSuspense: false, 
    },
  });

export default i18n;