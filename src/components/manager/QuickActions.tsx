import { 
  UserPlus, 
  CalendarPlus, 
  UserCog, 
  FileSpreadsheet,
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface QuickActionsProps {
  onAddVolunteer?: () => void;
  onAddElder?: () => void;
  onAddSession?: () => void;
  onGenerateReport?: () => void;
}

const quickActions: QuickAction[] = [
  {
    id: "add-volunteer",
    title: "Add Volunteer",
    description: "Register a new volunteer",
    icon: <UserPlus className="h-5 w-5" />,
    href: "/manager/volunteers/new",
    color: "bg-blue-100 text-blue-700"
  },
  {
    id: "create-slot",
    title: "Create Time Slot",
    description: "Schedule a new session",
    icon: <CalendarPlus className="h-5 w-5" />,
    href: "/manager/calendar/new",
    color: "bg-green-100 text-green-700"
  },
  {
    id: "add-resident",
    title: "Add Resident",
    description: "Register a new resident",
    icon: <UserCog className="h-5 w-5" />,
    href: "/manager/residents/new",
    color: "bg-purple-100 text-purple-700"
  },
  {
    id: "open-reports",
    title: "Open Reports",
    description: "View analytics and reports",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    href: "/manager/reports",
    color: "bg-amber-100 text-amber-700"
  }
];

const QuickActions = ({ 
  onAddVolunteer, 
  onAddElder, 
  onAddSession, 
  onGenerateReport 
}: QuickActionsProps) => {
  const handleActionClick = (action: QuickAction) => {
    switch (action.id) {
      case "add-volunteer":
        if (onAddVolunteer) onAddVolunteer();
        break;
      case "add-resident":
        if (onAddElder) onAddElder();
        break;
      case "create-slot":
        if (onAddSession) onAddSession();
        break;
      case "open-reports":
        if (onGenerateReport) onGenerateReport();
        break;
      default:
        window.location.href = action.href;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map(action => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto p-3 justify-start hover:bg-slate-50"
              onClick={() => handleActionClick(action)}
            >
              <div className={`p-2 rounded-full mr-3 ${action.color}`}>
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-slate-500">{action.description}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions; 