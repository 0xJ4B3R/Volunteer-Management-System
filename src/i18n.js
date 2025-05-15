  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import LanguageDetector from 'i18next-browser-languagedetector';

  import LoginEN from './locales/en/Login.json';
  import LoginHE from './locales/he/Login.json';
  import ForgotPasswordEN from './locales/en/ForgotPassword.json';
  import ForgotPasswordHE from './locales/he/ForgotPassword.json';


  const resources = {
    en: {
      translation: {
        ... LoginEN,
        ...ForgotPasswordEN
      }
    },
    he: {
      translation: {
        ...LoginHE,
        ...ForgotPasswordHE
      }
    }
  };

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });

  export default i18n;
