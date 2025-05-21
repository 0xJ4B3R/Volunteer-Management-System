  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import LanguageDetector from 'i18next-browser-languagedetector';

  import LoginEN from './locales/en/Login.json';
  import LoginHE from './locales/he/Login.json';
  import ForgotPasswordEN from './locales/en/ForgotPassword.json';
  import ForgotPasswordHE from './locales/he/ForgotPassword.json';
  import VolunteerDashboardEN from './locales/en/VolunteerDashboard.json';
  import VolunteerDashboardHE from './locales/he/VolunteerDashboard.json';
  import sidebarEN from './locales/en/Sidebar.json';
  import sidebarHE from './locales/he/Sidebar.json';
  import CalendarEN from './locales/en/Calendar.json';
  import CalendarHE from './locales/he/Calendar.json';



  const resources = {
    en: {
      translation: {
        ...LoginEN,
        ...ForgotPasswordEN,
        ...VolunteerDashboardEN,
        ...sidebarEN,
        ...CalendarEN
      }
    },
    he: {
      translation: {
        ...LoginHE,
        ...ForgotPasswordHE,
        ...VolunteerDashboardHE,
        ...sidebarHE,
        ...CalendarHE
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
