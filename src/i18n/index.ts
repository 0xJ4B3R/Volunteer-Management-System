import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ---- Import translation files ----
// ---------- Manager (en) ----------
import enCommon from '../locales/manager/en/common.json';
import enNavigation from '../locales/manager/en/navigation.json';
import enDashboard from '../locales/manager/en/dashboard.json';
import enCalendar from '../locales/manager/en/calendar.json';
import enAppointments from '../locales/manager/en/appointments.json';
import enVolunteers from '../locales/manager/en/volunteers.json';
import enResidents from '../locales/manager/en/residents.json';
import enMatchingRules from '../locales/manager/en/matching-rules.json';
import enReports from '../locales/manager/en/reports.json';
import enSettings from '../locales/manager/en/settings.json';
// ---------- Volunteer (en) ----------
import enIndex from '../locales/volunteer/en/index.json';
import enLogin from '../locales/volunteer/en/login.json';
import enNotFound from '../locales/volunteer/en/not-found.json';
import enSidebar from '../locales/volunteer/en/sidebar.json';
import enVolunteerDashboard from '../locales/volunteer/en/dashboard.json';
import enVolunteerCalendar from '../locales/volunteer/en/calendar.json';
import enVolunteerAppointments from '../locales/volunteer/en/appointments.json';
import enVolunteerAttendance from '../locales/volunteer/en/attendance.json';
import enProfile from '../locales/volunteer/en/profile.json';
// ---------- Manager (he) ----------
import heCommon from '../locales/manager/he/common.json';
import heNavigation from '../locales/manager/he/navigation.json';
import heDashboard from '../locales/manager/he/dashboard.json';
import heCalendar from '../locales/manager/he/calendar.json';
import heAppointments from '../locales/manager/he/appointments.json';
import heVolunteers from '../locales/manager/he/volunteers.json';
import heResidents from '../locales/manager/he/residents.json';
import heMatchingRules from '../locales/manager/he/matching-rules.json';
import heReports from '../locales/manager/he/reports.json';
import heSettings from '../locales/manager/he/settings.json';
// ---------- Volunteer (he) ----------
import heIndex from '../locales/volunteer/he/index.json';
import heLogin from '../locales/volunteer/he/login.json';
import heNotFound from '../locales/volunteer/he/not-found.json';
import heSidebar from '../locales/volunteer/he/sidebar.json';
import heVolunteerDashboard from '../locales/volunteer/he/dashboard.json';
import heVolunteerCalendar from '../locales/volunteer/he/calendar.json';
import heVolunteerAppointments from '../locales/volunteer/he/appointments.json';
import heVolunteerAttendance from '../locales/volunteer/he/attendance.json';
import heVolunteerProfile from '../locales/volunteer/he/profile.json';

const resources = {
  en: {
    // Manager translations
    common: enCommon,
    settings: enSettings,
    navigation: enNavigation,
    reports: enReports,
    'matching-rules': enMatchingRules,
    residents: enResidents,
    volunteers: enVolunteers,
    'manager-appointments': enAppointments,
    'manager-calendar': enCalendar,
    'manager-dashboard': enDashboard,
    // Volunteer translations
    translation: enIndex, // Default namespace for homepage
    login: enLogin,
    'not-found': enNotFound,
    sidebar: enSidebar,
    dashboard: enVolunteerDashboard,
    calendar: enVolunteerCalendar,
    appointments: enVolunteerAppointments,
    attendance: enVolunteerAttendance,
    profile: enProfile
  },
  he: {
    // Manager translations
    common: heCommon,
    settings: heSettings,
    navigation: heNavigation,
    reports: heReports,
    'matching-rules': heMatchingRules,
    residents: heResidents,
    volunteers: heVolunteers,
    'manager-appointments': heAppointments,
    'manager-calendar': heCalendar,
    'manager-dashboard': heDashboard,
    // Volunteer translations
    translation: heIndex, // Default namespace for homepage
    login: heLogin,
    'not-found': heNotFound,
    sidebar: heSidebar,
    dashboard: heVolunteerDashboard,
    calendar: heVolunteerCalendar,
    appointments: heVolunteerAppointments,
    attendance: heVolunteerAttendance,
    profile: heVolunteerProfile
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
