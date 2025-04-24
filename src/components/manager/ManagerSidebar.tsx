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
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface ManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onLogout: () => void;
}

const ManagerSidebar = ({ isOpen, onClose, isMobile, onLogout }: ManagerSidebarProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside 
      className={cn(
        "bg-white shadow-md z-20 w-64 flex-shrink-0 border-r border-gray-200 transition-all duration-300",
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isMobile ? 'absolute inset-y-0 left-0 h-[calc(100%-56px)]' : 'relative'
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
            to="/manager" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard className="mr-3 h-5 w-5 text-slate-500" />
            Dashboard
          </Link>
          
          <Link 
            to="/manager/calendar" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager/calendar") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <Calendar className="mr-3 h-5 w-5 text-slate-500" />
            Calendar Management
          </Link>
          
          <Link 
            to="/manager/volunteers" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager/volunteers") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <Users className="mr-3 h-5 w-5 text-slate-500" />
            Volunteer Management
          </Link>
          
          <Link 
            to="/manager/residents" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager/residents") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <UserPlus className="mr-3 h-5 w-5 text-slate-500" />
            Resident Management
          </Link>
          
          <Link 
            to="/manager/matching-rules" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager/matching-rules") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <Sliders className="mr-3 h-5 w-5 text-slate-500" />
            Matching Rules
          </Link>
          
          <Link 
            to="/manager/reports" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager/reports") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <BarChart3 className="mr-3 h-5 w-5 text-slate-500" />
            Reports
          </Link>
          
          <Link 
            to="/manager/settings" 
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive("/manager/settings") ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <Settings className="mr-3 h-5 w-5 text-slate-500" />
            Settings
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
  );
};

export default ManagerSidebar; 