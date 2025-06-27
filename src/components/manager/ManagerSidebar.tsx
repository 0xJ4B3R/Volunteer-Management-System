import {
  LayoutDashboard,
  Calendar,
  Users,
  UserPlus,
  FileText,
  Settings,
  X,
  ChevronRight,
  LogOut,
  BarChart3,
  FileSpreadsheet,
  UserCog,
  Users2,
  ClipboardList,
  Bell,
  Sliders,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

interface ManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onLogout: () => void;
}

const ManagerSidebar = ({ isOpen, onClose, isMobile, onLogout }: ManagerSidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const { isRTL } = useLanguage();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={cn(
        "bg-white shadow-md z-20 w-64 flex-shrink-0 border-r border-gray-200 transition-all duration-300",
        isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
        isMobile ? `absolute inset-y-0 h-[calc(100%-56px)] ${isRTL ? 'right-0' : 'left-0'}` : 'relative',
        isRTL && 'border-l border-r-0'
      )}
    >
      <div className="py-4 flex flex-col h-full">
        <div className={cn(
          "px-3 flex justify-between items-center lg:hidden",
          isRTL && "flex-row-reverse"
        )}>
          <span className="font-medium">{t('menu')}</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-1 px-2 mt-4 flex-1">
          <Link
            to="/manager"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <LayoutDashboard className="h-5 w-5 text-slate-500" />
            <span>{t('dashboard')}</span>
          </Link>

          <Link
            to="/manager/calendar"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/calendar") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <Calendar className="h-5 w-5 text-slate-500" />
            <span>{t('calendar')}</span>
          </Link>

          <Link
            to="/manager/appointments"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/appointments") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <Clock className="h-5 w-5 text-slate-500" />
            <span>{t('appointments')}</span>
          </Link>

          <Link
            to="/manager/volunteers"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/volunteers") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <Users className="h-5 w-5 text-slate-500" />
            <span>{t('volunteers')}</span>
          </Link>

          <Link
            to="/manager/residents"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/residents") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <UserPlus className="h-5 w-5 text-slate-500" />
            <span>{t('residents')}</span>
          </Link>

          <Link
            to="/manager/matching-rules"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/matching-rules") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <Sliders className="h-5 w-5 text-slate-500" />
            <span>{t('matchingRules')}</span>
          </Link>

          <Link
            to="/manager/reports"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/reports") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <BarChart3 className="h-5 w-5 text-slate-500" />
            <span>{t('reports')}</span>
          </Link>

          <Link
            to="/manager/settings"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3",
              isActive("/manager/settings") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
              isRTL && "space-x-reverse text-right"
            )}
          >
            <Settings className="h-5 w-5 text-slate-500" />
            <span>{t('settings')}</span>
          </Link>
        </nav>

        {/* Logo Section */}
        <div className="mt-auto px-3 py-6">
          <img
            src="/logo.png"
            alt="Volunteer Management System Logo"
            className="w-full h-52 object-contain"
          />
        </div>

        <div className="border-t pt-2 px-2">
          <button
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer",
              isRTL && "space-x-reverse text-right"
            )}
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ManagerSidebar; 