import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  ClipboardList, 
  FileText, 
  Home, 
  LogOut, 
  Settings, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VolunteerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onLogout: () => void;
}

const VolunteerSidebar: React.FC<VolunteerSidebarProps> = ({ 
  isOpen, 
  onClose, 
  isMobile,
  onLogout
}) => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isOpen, onClose]);

  // Prevent body scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        className={cn(
          "bg-white shadow-md z-50 flex-shrink-0 border-r border-gray-200 transition-all duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMobile 
            ? "fixed inset-y-0 left-0 h-[calc(100vh-56px)] w-64" 
            : "relative h-full w-64"
        )}
      >
        <div className="py-4 flex flex-col h-full">
          <div className="px-3 flex justify-between items-center lg:hidden">
            <span className="font-medium">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="space-y-1 px-2 mt-4 flex-1">
            <Link 
              to="/volunteer" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === "/volunteer" 
                  ? "bg-slate-100 text-slate-900" 
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Home className={cn(
                "mr-3 h-5 w-5",
                location.pathname === "/volunteer" ? "text-slate-900" : "text-slate-500"
              )} />
              Dashboard
            </Link>
            <Link 
              to="/volunteer/calendar" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === "/volunteer/calendar" 
                  ? "bg-slate-100 text-slate-900" 
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Calendar className={cn(
                "mr-3 h-5 w-5",
                location.pathname === "/volunteer/calendar" ? "text-slate-900" : "text-slate-500"
              )} />
              Calendar
            </Link>
            <Link 
              to="/volunteer/appointments" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === "/volunteer/appointments" 
                  ? "bg-slate-100 text-slate-900" 
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <ClipboardList className={cn(
                "mr-3 h-5 w-5",
                location.pathname === "/volunteer/appointments" ? "text-slate-900" : "text-slate-500"
              )} />
              Appointments
            </Link>
            <Link 
              to="/volunteer/attendance" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === "/volunteer/attendance" 
                  ? "bg-slate-100 text-slate-900" 
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <CheckCircle className={cn(
                "mr-3 h-5 w-5",
                location.pathname === "/volunteer/attendance" ? "text-slate-900" : "text-slate-500"
              )} />
              Confirm Attendance
            </Link>
            
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            
            <Link 
              to="/volunteer/profile" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location.pathname === "/volunteer/profile" 
                  ? "bg-slate-100 text-slate-900" 
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Settings className={cn(
                "mr-3 h-5 w-5",
                location.pathname === "/volunteer/profile" ? "text-slate-900" : "text-slate-500"
              )} />
              Profile Settings
            </Link>
          </nav>
          
          <div className="mt-auto border-t pt-2 px-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default VolunteerSidebar;
