import { X, Bell, CheckCircle2, AlertCircle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export interface Notification {
  id: number;
  message: string;
  time: string;
  type?: "success" | "warning" | "info" | "default";
  link?: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationsPanel = ({ isOpen, onClose, notifications }: NotificationsPanelProps) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };
  
  const getNotificationBadge = (type?: string) => {
    switch (type) {
      case "success":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Success</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case "info":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      default:
        return null;
    }
  };
  
  const handleViewAll = () => {
    onClose();
    navigate("/manager/notifications");
  };
  
  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      onClose();
      navigate(notification.link);
    }
  };
  
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md overflow-hidden z-50">
      <div className="p-2 bg-slate-100 font-medium flex justify-between items-center">
        <div className="flex items-center">
          <Bell className="h-4 w-4 mr-2 text-slate-500" />
          <span>Notifications</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-3 border-b hover:bg-slate-50 cursor-pointer ${
                notification.type === "warning" ? "bg-amber-50/50" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="mr-2 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{notification.message}</p>
                    {getNotificationBadge(notification.type)}
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-slate-400 mr-1" />
                    <p className="text-xs text-slate-500">{notification.time}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-slate-500">
            <p>No notifications</p>
          </div>
        )}
      </div>
      
      <div className="p-2 bg-slate-50 text-center">
        <Button variant="ghost" size="sm" className="text-xs w-full" onClick={handleViewAll}>
          View all notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationsPanel; 