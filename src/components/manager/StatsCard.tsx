import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  bgColor,
  trend
}: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="flex items-baseline mt-1">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <span className={`ml-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          <div className={`h-12 w-12 ${bgColor} rounded-full flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard; 