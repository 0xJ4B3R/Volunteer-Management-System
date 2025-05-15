import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  ClipboardList, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCheck,
  CheckCircle
} from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();

  const volunteerNavItems = [
    { 
      name: 'Dashboard', 
      icon: Home, 
      path: '/volunteer' 
    },
    { 
      name: 'Calendar', 
      icon: Calendar, 
      path: '/volunteer/calendar' 
    },
    { 
      name: 'Appointments', 
      icon: ClipboardList, 
      path: '/volunteer/appointments' 
    },
    {
      name: 'Attendance',
      icon: CheckCircle,
      path: '/volunteer/attendance'
    },
    { 
      name: 'Profile', 
      icon: User, 
      path: '/volunteer/profile' 
    },
  ];

  const managerNavItems = [
    { 
      name: 'Dashboard', 
      icon: Home, 
      path: '/manager' 
    },
    { 
      name: 'Calendar', 
      icon: Calendar, 
      path: '/manager/calendar' 
    },
    { 
      name: 'Appointments', 
      icon: ClipboardList, 
      path: '/manager/appointments' 
    },
    { 
      name: 'Volunteers', 
      icon: User, 
      path: '/manager/volunteers' 
    },
  ];

  // Determine which navigation items to show based on current route
  const navItems = location.pathname.includes('/volunteer') 
    ? volunteerNavItems 
    : managerNavItems;

  return (
    <div 
      className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-gray-800 text-white transition-all duration-300 flex flex-col
      `}
    >
      <div className="flex items-center justify-between p-4 bg-gray-900">
        {isSidebarOpen && (
          <span className="text-lg font-bold">
            {location.pathname.includes('/volunteer') ? 'Volunteer' : 'Manager'} Portal
          </span>
        )}
        <button 
          onClick={toggleSidebar}
          className="hover:bg-gray-700 p-2 rounded"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
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
            `}
          >
            <item.icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-2' : ''}`} />
            {isSidebarOpen && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;