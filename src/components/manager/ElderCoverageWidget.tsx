import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  BarChart3,
  Heart,
  Shield,
  Clock,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface ElderCoverageWidgetProps {
  totalElders: number;
  newElders: number;
  coverageRate: string;
  trend: {
    totalElders: number;
    newElders: number;
    coverageRate: number;
  };
  coverageByType: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

const ElderCoverageWidget = ({ 
  totalElders, 
  newElders, 
  coverageRate,
  trend,
  coverageByType
}: ElderCoverageWidgetProps) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate("/manager/reports/residents");
  };
  
  const handleManageElders = () => {
    navigate("/manager/residents");
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Elder Coverage</CardTitle>
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
                <p className="text-sm font-medium text-slate-600">Total Elders</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold">{totalElders}</p>
                  <span className={`ml-2 text-xs ${trend.totalElders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.totalElders >= 0 ? '+' : '-'}{Math.abs(trend.totalElders)}%
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
                <p className="text-sm font-medium text-slate-600">New Elders</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold">{newElders}</p>
                  <span className={`ml-2 text-xs ${trend.newElders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.newElders >= 0 ? '+' : '-'}{Math.abs(trend.newElders)}%
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
                <p className="text-sm font-medium text-slate-600">Coverage Rate</p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold">{coverageRate}</p>
                  <span className={`ml-2 text-xs ${trend.coverageRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.coverageRate >= 0 ? '+' : '-'}{Math.abs(trend.coverageRate)}%
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Coverage Progress</span>
              <span className="font-medium">{coverageRate}</span>
            </div>
            <Progress value={parseInt(coverageRate)} className="h-2" />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {coverageByType.map((type) => (
              <div key={type.type} className="bg-slate-50 p-2 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {type.type === 'Medical' && <Heart className="h-4 w-4 text-red-600 mr-1" />}
                    {type.type === 'Social' && <Users className="h-4 w-4 text-blue-600 mr-1" />}
                    {type.type === 'Emergency' && <AlertCircle className="h-4 w-4 text-amber-600 mr-1" />}
                    {type.type === 'Regular' && <Clock className="h-4 w-4 text-green-600 mr-1" />}
                    <span className="text-xs font-medium text-slate-700">{type.type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{type.count}</span>
                    <span className="text-xs text-slate-500">({type.percentage}%)</span>
                  </div>
                </div>
                <Progress value={type.percentage} className="h-1 mt-1" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={handleManageElders}>
            Manage Elders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElderCoverageWidget; 