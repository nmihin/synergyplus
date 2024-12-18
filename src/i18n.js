import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './locales/translations.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hr: {
        translation: translations,
      },
    },
    lng: 'hr',
    fallbackLng: 'en',
    keySeparator: '.', 
    interpolation: {
      escapeValue: false,
    },
  });


export default i18n;
