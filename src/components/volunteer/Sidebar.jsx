import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import './styles/Sidebar.css';

import {
  Home,
  Calendar,
  ClipboardList,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  LogOut,
  ChevronDown,
  Eye
} from 'lucide-react';

export function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isVolunteer = location.pathname.includes('/volunteer');

  const navItems = isVolunteer
    ? [
        { name: t('Dashboard'), icon: Home, path: '/volunteer' },
        { name: t('Calendar'), icon: Calendar, path: '/volunteer/calendar' },
        { name: t('Appointments'), icon: ClipboardList, path: '/volunteer/appointments' },
        { name: t('Attendance'), icon: CheckCircle, path: '/volunteer/attendance' }
      ]
    : [
        { name: t('Dashboard'), icon: Home, path: '/manager' },
        { name: t('Calendar'), icon: Calendar, path: '/manager/calendar' },
        { name: t('Appointments'), icon: ClipboardList, path: '/manager/appointments' },
        { name: t('Volunteers'), icon: UserCircle, path: '/manager/volunteers' }
      ];

  const profilePath = isVolunteer ? '/volunteer/profile' : '/manager/profile';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      dir={i18n.dir()}
      className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'}
        sidebar-container
      `}
    >
      {/* Top Header */}
      <div className="sidebar-header">
        {isSidebarOpen && (
          <span>
            {isVolunteer ? t('Volunteer Portal') : t('Manager Portal')}
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle"
          aria-label={isSidebarOpen ? t('Collapse sidebar') : t('Expand sidebar')}
        >
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="mt-4 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              sidebar-link ${location.pathname === item.path ? 'active' : ''}
              ${!isSidebarOpen ? 'justify-center' : ''}
            `}
          >
            <item.icon />
            {isSidebarOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom Profile Section */}
      <div className="relative p-3 border-t border-gray-700" ref={dropdownRef}>
        <button
          onClick={() => setShowProfileMenu((prev) => !prev)}
          className={`sidebar-link ${!isSidebarOpen ? 'justify-center' : ''}`}
        >
          <UserCircle />
          {isSidebarOpen && (
            <>
              <span>{t('Profile')}</span>
              <ChevronDown className={`chevron-icon ${i18n.dir() === 'rtl' ? 'rtl-chevron' : ''}`} />
            </>
          )}
        </button>

        {showProfileMenu && isSidebarOpen && (
          <div className={`profile-dropdown ${i18n.dir() === 'rtl' ? 'rtl' : 'ltr'}`}>
            <Link to={profilePath} onClick={() => setShowProfileMenu(false)}>
              <Eye className="dropdown-icon" />
              {t('View Profile')}
            </Link>
            <button onClick={handleLogout}>
              <LogOut className="dropdown-icon" id = 'Logout-icon' />
              <p className='Logout'>
              {t('Logout')}
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
