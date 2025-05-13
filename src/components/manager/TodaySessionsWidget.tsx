import { 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface Session {
  id: number;
  time: string;
  type: string;
  location: string;
  volunteers: string[];
  status: "confirmed" | "unconfirmed" | "cancelled";
}

interface TodaySessionsWidgetProps {
  totalSessions: number;
  volunteersScheduled: number;
  unconfirmedSessions: number;
  sessions: Session[];
}

const TodaySessionsWidget = ({ 
  totalSessions, 
  volunteersScheduled, 
  unconfirmedSessions,
  sessions
}: TodaySessionsWidgetProps) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "unconfirmed":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getSessionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "reading":
        return "bg-blue-100 text-blue-800";
      case "music":
        return "bg-purple-100 text-purple-800";
      case "companionship":
        return "bg-pink-100 text-pink-800";
      case "games":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const handleViewCalendar = () => {
    navigate("/manager/calendar");
  };
  
  const handleViewAllSessions = () => {
    navigate("/manager/calendar");
  };
  
  const handleViewSession = (sessionId: number) => {
    navigate(`/manager/calendar/session/${sessionId}`);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Today's Sessions</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleViewCalendar}>
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-xs">View Calendar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Sessions</p>
                <p className="text-2xl font-bold mt-1">{totalSessions}</p>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Volunteers Scheduled</p>
                <p className="text-2xl font-bold mt-1">{volunteersScheduled}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unconfirmed</p>
                <p className="text-2xl font-bold mt-1">{unconfirmedSessions}</p>
              </div>
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map(session => (
              <div 
                key={session.id} 
                className="p-3 border rounded-md hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getSessionTypeColor(session.type)}>
                        {session.type}
                      </Badge>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-600 mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {session.time}
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {session.location}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex -space-x-2 mb-2">
                      {session.volunteers.map((volunteer, index) => (
                        <div 
                          key={index} 
                          className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                        >
                          {volunteer.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => handleViewSession(session.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500">
              <p>No sessions scheduled for today</p>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={handleViewAllSessions}>
            View All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaySessionsWidget; 