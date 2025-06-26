import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enSettings from '../locales/en/settings.json';
import enNavigation from '../locales/en/navigation.json';
import enReports from '../locales/en/reports.json';
import enMatchingRules from '../locales/en/matching-rules.json';
import enResidents from '../locales/en/residents.json';
import enVolunteers from '../locales/en/volunteers.json';
import enAppointments from '../locales/en/appointments.json';
import enCalendar from '../locales/en/calendar.json';
import enDashboard from '../locales/en/dashboard.json';
import heCommon from '../locales/he/common.json';
import heSettings from '../locales/he/settings.json';
import heNavigation from '../locales/he/navigation.json';
import heReports from '../locales/he/reports.json';
import heMatchingRules from '../locales/he/matching-rules.json';
import heResidents from '../locales/he/residents.json';
import heVolunteers from '../locales/he/volunteers.json';
import heAppointments from '../locales/he/appointments.json';
import heCalendar from '../locales/he/calendar.json';
import heDashboard from '../locales/he/dashboard.json';

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    navigation: enNavigation,
    reports: enReports,
    'matching-rules': enMatchingRules,
    residents: enResidents,
    volunteers: enVolunteers,
    appointments: enAppointments,
    calendar: enCalendar,
    dashboard: enDashboard
  },
  he: {
    common: heCommon,
    settings: heSettings,
    navigation: heNavigation,
    reports: heReports,
    'matching-rules': heMatchingRules,
    residents: heResidents,
    volunteers: heVolunteers,
    appointments: heAppointments,
    calendar: heCalendar,
    dashboard: heDashboard
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n; 