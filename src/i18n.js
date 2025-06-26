  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import LanguageDetector from 'i18next-browser-languagedetector';

  //EN TRANSLATIONS:
  import LoginEN from './locales/en/Login.json';
  import HomeEN from './locales/en/Home.json';
  import VolunteerDashboardEN from './locales/en/VolunteerDashboard.json';
  import sidebarEN from './locales/en/Sidebar.json';
  import CalendarEN from './locales/en/VolunteerCalendar.json';
  import ProfileEN from './locales/en/VolunteerProfile.json';
  import AppointmentsEN from './locales/en/VolunteerAppointments.json';
  import AttendanceEN from './locales/en/VolunteerAttendance.json';
  import NotFoundEN from './locales/en/NotFound.json';
  
  //HE TRANSLATIONS:
  import LoginHE from './locales/he/Login.json';
  import HomeHE from './locales/he/Home.json';
  import VolunteerDashboardHE from './locales/he/VolunteerDashboard.json';
  import sidebarHE from './locales/he/Sidebar.json';
  import CalendarHE from './locales/he/VolunteerCalendar.json';
  import ProfileHE from './locales/he/VolunteerProfile.json';
  import AppointmentsHE from './locales/he/VolunteerAppointments.json';
  import AttendanceHE from './locales/he/VolunteerAttendance.json';
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
