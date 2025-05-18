import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import './styles/Sidebar.css';

import {
  Home,
  Calendar,
  ClipboardList,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

export function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const { t } = useTranslation();

  const volunteerNavItems = [
    { name: t('Dashboard'), icon: Home, path: '/volunteer' },
    { name: t('Calendar'), icon: Calendar, path: '/volunteer/calendar' },
    { name: t('Appointments'), icon: ClipboardList, path: '/volunteer/appointments' },
    { name: t('Attendance'), icon: CheckCircle, path: '/volunteer/attendance' },
    { name: t('Profile'), icon: User, path: '/volunteer/profile' },
  ];

  const managerNavItems = [
    { name: t('Dashboard'), icon: Home, path: '/manager' },
    { name: t('Calendar'), icon: Calendar, path: '/manager/calendar' },
    { name: t('Appointments'), icon: ClipboardList, path: '/manager/appointments' },
    { name: t('Volunteers'), icon: User, path: '/manager/volunteers' },
  ];

  const navItems = location.pathname.includes('/volunteer')
    ? volunteerNavItems
    : managerNavItems;

  return (
    <div
      dir={i18n.dir()} // RTL/LTR support
      className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        bg-gray-800 text-white transition-all duration-300 flex flex-col
        sidebar-container
      `}
    >
      <div className="flex items-center justify-between p-4 bg-gray-900">
        {isSidebarOpen && (
          <span className="text-lg font-bold">
            {location.pathname.includes('/volunteer')
              ? t('Volunteer Portal')
              : t('Manager Portal')}
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="hover:bg-gray-700 p-2 rounded"
          aria-label={isSidebarOpen ? t('Collapse sidebar') : t('Expand sidebar')}
        >
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      <nav className="mt-4 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              w-full flex items-center p-3 relative
              ${location.pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'}
              ${!isSidebarOpen && 'justify-center'}
              transition-colors
              sidebar-link
            `}
          >
            <item.icon className={`h-5 w-5 ${isSidebarOpen ? 'me-2' : ''}`} />
            {isSidebarOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
