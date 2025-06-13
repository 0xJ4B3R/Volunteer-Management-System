  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import LanguageDetector from 'i18next-browser-languagedetector';


  //EN TRANSLATIONS:
  import LoginEN from './locales/en/Login.json';
  import HomeEN from './locales/en/Home.json';
  import VolunteerDashboardEN from './locales/en/VolunteerDashboard.json';
  import sidebarEN from './locales/en/Sidebar.json';
  import CalendarEN from './locales/en/Calendar.json';
  import ProfileEN from './locales/en/Profile.json';
  import AppointmentsEN from './locales/en/Appointments.json';
  import AttendanceEN from './locales/en/Attendance.json';
  import NotFoundEN from './locales/en/NotFound.json';
  
  //HE TRANSLATIONS:
  import LoginHE from './locales/he/Login.json';
  import HomeHE from './locales/he/Home.json';
  import VolunteerDashboardHE from './locales/he/VolunteerDashboard.json';
  import sidebarHE from './locales/he/Sidebar.json';
  import CalendarHE from './locales/he/Calendar.json';
  import ProfileHE from './locales/he/Profile.json';
  import AppointmentsHE from './locales/he/Appointments.json';
  import AttendanceHE from './locales/he/Attendance.json';
  import NotFoundHE from './locales/he/NotFound.json';

  const resources = {
    en: {
      translation: {
        ...LoginEN,
        ...HomeEN,
        ...VolunteerDashboardEN,
        ...sidebarEN,
        ...CalendarEN,
        ...ProfileEN,
        ...AppointmentsEN,
        ...AttendanceEN,
        ...NotFoundEN
      }
    },
    he: {
      translation: {
        ...LoginHE,
        ...HomeHE,
        ...VolunteerDashboardHE,
        ...sidebarHE,
        ...CalendarHE,
        ...ProfileHE,
        ...AppointmentsHE,
        ...AttendanceHE,
        ...NotFoundHE
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
