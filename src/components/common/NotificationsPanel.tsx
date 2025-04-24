
import React from 'react';
import { Bell, Check, Clock, Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface Notification {
  id: number;
  message: string;
  time: string;
  read?: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
  isOpen, 
  onClose, 
  notifications 
}) => {
  const [localNotifications, setLocalNotifications] = React.useState<Notification[]>([]);
  
  React.useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  if (!isOpen) return null;
  
  const markAsRead = (id: number) => {
    setLocalNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    toast({
      title: "Notification marked as read",
      description: "This notification has been marked as read.",
    });
  };
  
  const deleteNotification = (id: number) => {
    setLocalNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
    
    toast({
      title: "Notification deleted",
      description: "This notification has been removed from your list.",
    });
  };
  
  const markAllAsRead = () => {
    setLocalNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    });
  };
  
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md overflow-hidden z-50">
      <div className="p-2 bg-slate-100 font-medium flex justify-between items-center">
        <span>Notifications</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {localNotifications.length > 0 ? (
          <>
            <div className="p-2 bg-slate-50 text-xs text-right">
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Mark all as read
              </Button>
            </div>
            {localNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 border-b hover:bg-slate-50 ${notification.read ? 'bg-slate-50 opacity-70' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-slate-500' : 'font-medium'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{notification.time}</span>
                    </div>
                  </div>
                  <div className="flex ml-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-500"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Bell className="h-8 w-8 text-gray-300 mb-2" />
            <p>No notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
      <div className="p-2 bg-slate-50 text-center">
        <Button variant="ghost" size="sm" className="text-xs w-full">
          View all notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
