import React from 'react';
import { DivideIcon, LucideIcon } from 'lucide-react';

export interface MetricsCardProps {
  title: string;
  value: number;
  icon: typeof DivideIcon;
  color?: string;
  textColor?: string;
  borderColor?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "bg-white", 
  textColor = "text-navy", 
  borderColor = "border-neutral-200"
}) => {
  return (
    <div className={`bg-white shadow-sm rounded-sm p-5 border ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <h2 className={`mt-2 text-2xl font-medium ${textColor}`}>{value}</h2>
        </div>
        <div className={`p-2 rounded-sm ${color}`}>
          <Icon className={`h-5 w-5 ${color === "bg-white" ? "text-primary" : "text-white"}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;