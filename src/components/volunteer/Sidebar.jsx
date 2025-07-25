import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout } from '@/store/slices/authSlice';
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
  Eye,
  Menu
} from 'lucide-react';

export function Sidebar({ isSidebarOpen, toggleSidebar, isMobile = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['sidebar', 'dashboard']);
  const dispatch = useAppDispatch();
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
    // Clear localStorage
    localStorage.clear();
    // Clear Redux state
    dispatch(logout());
    // Navigate to homepage
    navigate('/');
  };

  // Close sidebar when clicking navigation on mobile
  const handleNavClick = () => {
    if (isMobile) {
      toggleSidebar();
    }
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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      const handleClickOutside = (event) => {
        const sidebar = document.querySelector('.sidebar-container');
        const mobileButton = document.querySelector('.mobile-menu-button-bar');
        if (sidebar && !sidebar.contains(event.target) && 
            mobileButton && !mobileButton.contains(event.target)) {
          toggleSidebar();
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isSidebarOpen, toggleSidebar]);

  return (
    <>
      {/* Mobile Top Bar - fixed at top */}
      {isMobile && (
        <div className="mobile-top-bar" dir={i18n.dir()}>
          <div className="mobile-top-bar-content">
            <button
              className="mobile-menu-button-bar"
              onClick={toggleSidebar}
              aria-label={t('Open menu')}
            >
              <Menu />
            </button>
            <span className="mobile-top-bar-title">
              {isVolunteer ? (
                location.pathname === '/volunteer' || location.pathname === '/volunteer/' 
                  ? t('dashboard.title', { ns: 'dashboard' })
                  : t('Volunteer Portal')
              ) : t('Manager Portal')}
            </span>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-999"
          onClick={toggleSidebar}
        />
      )}
      
      <div
        dir={i18n.dir()}
        className={`
          ${isMobile ? '' : (isSidebarOpen ? 'w-64' : 'w-20')}
          sidebar-container
          ${isMobile && isSidebarOpen ? 'open' : ''}
        `}
      >
        {/* Top Header */}
        <div className="sidebar-header">
          {(isSidebarOpen || isMobile) && (
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
              onClick={handleNavClick}
              className={`
                sidebar-link ${location.pathname === item.path ? 'active' : ''}
                ${!isSidebarOpen && !isMobile ? 'justify-center' : ''}
              `}
            >
              <item.icon />
              {(isSidebarOpen || isMobile) && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Profile Section */}
        <div className="relative p-3 border-t border-gray-700" ref={dropdownRef}>
          <button
            onClick={() => {
              if (!isSidebarOpen && !isMobile) toggleSidebar();
              setShowProfileMenu((prev) => !prev);
            }}
            className={`sidebar-link ${!isSidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <UserCircle />
            {(isSidebarOpen || isMobile) && (
              <>
                <span>{t('Profile')}</span>
                <ChevronDown className={`chevron-icon ${i18n.dir() === 'rtl' ? 'rtl-chevron' : ''}`} />
              </>
            )}
          </button>

          {showProfileMenu && (isSidebarOpen || isMobile) && (
            <div className={`profile-dropdown ${i18n.dir() === 'rtl' ? 'rtl' : 'ltr'}`}>
              <Link to={profilePath} onClick={() => {
                setShowProfileMenu(false);
                handleNavClick();
              }}>
                <Eye className="dropdown-icon" />
                {t('View Profile')}
              </Link>
              <button onClick={handleLogout}>
                <LogOut className="dropdown-icon" id='Logout-icon' />
                <p className='Logout'>
                  {t('Logout')}
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;