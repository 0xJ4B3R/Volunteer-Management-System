import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface VolunteerEngagementWidgetProps {
  activeVolunteers: number;
  newVolunteers: number;
  inactivityRate: string;
  trend: {
    activeVolunteers: number;
    newVolunteers: number;
    inactivityRate: number;
  };
}

const VolunteerEngagementWidget = ({ 
  activeVolunteers, 
  newVolunteers, 
  inactivityRate,
  trend
}: VolunteerEngagementWidgetProps) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate("/manager/reports/volunteers");
  };
  
  const handleManageVolunteers = () => {
    navigate("/manager/volunteers");
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Volunteer Engagement</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleViewDetails}>
            <BarChart3 className="h-4 w-4 mr-1" />
            <span className="text-xs">View Details</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Volunteers</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold">{activeVolunteers}</p>
                  <span className={`ml-2 text-xs ${trend.activeVolunteers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.activeVolunteers >= 0 ? '+' : '-'}{Math.abs(trend.activeVolunteers)}%
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">New Volunteers</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold">{newVolunteers}</p>
                  <span className={`ml-2 text-xs ${trend.newVolunteers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.newVolunteers >= 0 ? '+' : '-'}{Math.abs(trend.newVolunteers)}%
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Inactivity Rate</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold">{inactivityRate}</p>
                  <span className={`ml-2 text-xs ${trend.inactivityRate <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.inactivityRate <= 0 ? '-' : '+'}{Math.abs(trend.inactivityRate)}%
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Active vs. Inactive</span>
              <span className="font-medium">{activeVolunteers} / {parseInt(inactivityRate) / 100 * activeVolunteers}</span>
            </div>
            <Progress value={100 - parseInt(inactivityRate)} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 p-2 rounded-md">
              <div className="flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs font-medium text-green-700">Active</span>
              </div>
              <p className="text-sm font-medium mt-1">{activeVolunteers}</p>
            </div>
            
            <div className="bg-red-50 p-2 rounded-md">
              <div className="flex items-center">
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-xs font-medium text-red-700">Inactive</span>
              </div>
              <p className="text-sm font-medium mt-1">{Math.round(parseInt(inactivityRate) / 100 * activeVolunteers)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={handleManageVolunteers}>
            Manage Volunteers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VolunteerEngagementWidget; 