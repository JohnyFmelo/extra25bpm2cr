
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, PartyPopper } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface HoursDonutChartProps {
  totalHours: number;
  maxHours?: number;
}

export const HoursDonutChart = ({
  totalHours,
  maxHours = 50
}: HoursDonutChartProps) => {
  // Ensure hours are numeric values
  const hours = typeof totalHours === 'number' ? totalHours : parseFloat(totalHours as any) || 0;
  const remainingHours = Math.max(0, maxHours - hours);
  const percentage = Math.min(100, hours / maxHours * 100);
  const isOverMaxHours = hours > maxHours;
  const isExactlyMax = hours === maxHours;
  const isAtOrAboveMax = hours >= maxHours;

  // Determine color based on hour thresholds
  const getColor = (hours: number) => {
    if (isOverMaxHours) return '#EF4444'; // Red for over max
    if (hours < 29) return '#F97316'; // Orange
    if (hours < 40) return '#0EA5E9'; // Blue
    return '#22C55E'; // Green
  };

  // Determine gradient colors based on hour thresholds
  const getGradientColors = (hours: number) => {
    if (isOverMaxHours) return {
      start: '#F87171',
      end: '#EF4444'
    }; // Red gradient for over max
    if (hours < 29) return {
      start: '#FF9900',
      end: '#F97316'
    }; // Orange gradient
    if (hours < 40) return {
      start: '#60A5FA',
      end: '#0EA5E9'
    }; // Blue gradient
    return {
      start: '#4ADE80',
      end: '#22C55E'
    }; // Green gradient
  };

  const chartColor = getColor(hours);
  const gradientColors = getGradientColors(hours);
  
  const data = [
    {
      name: 'Horas Trabalhadas',
      value: hours,
      color: chartColor
    }, 
    {
      name: 'Horas Restantes',
      value: remainingHours,
      color: '#E0E0E0'
    }
  ];

  // Get progress bar color based on the same thresholds
  const progressBarColor = 
    isOverMaxHours
      ? 'bg-gradient-to-r from-red-400 to-red-500'
      : hours < 29 
        ? 'bg-gradient-to-r from-orange-400 to-orange-500' 
        : hours < 40 
          ? 'bg-gradient-to-r from-blue-400 to-blue-500' 
          : 'bg-gradient-to-r from-green-400 to-green-500';

  return (
    <div className="flex flex-col items-center mt-4 space-y-2 relative">
      <div className="h-40 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id={`hoursFillGradient-${hours}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColors.start} />
                <stop offset="100%" stopColor={gradientColors.end} />
              </linearGradient>
            </defs>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              innerRadius={40} 
              outerRadius={70} 
              paddingAngle={0} 
              dataKey="value" 
              startAngle={90} 
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? `url(#hoursFillGradient-${hours})` : entry.color} 
                  stroke={index === 0 ? gradientColors.end : '#E0E0E0'} 
                  strokeWidth={1} 
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className={cn("text-2xl font-bold", isOverMaxHours && "text-red-600")}>{hours}h</div>
        </div>
      </div>

      <div className="w-full space-y-1 relative">
        <div className="flex justify-between text-xs text-gray-600 font-medium">
          <span>0h</span>
          <span>{maxHours}h</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", progressBarColor)} 
            style={{
              width: `${percentage}%`
            }} 
          />
        </div>
      </div>

      {isOverMaxHours && (
        <Alert variant="destructive" className="mt-2 bg-red-50 border-red-300 text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Total de horas excede o limite máximo de {maxHours}h.
          </AlertDescription>
        </Alert>
      )}

      {isExactlyMax && (
        <Alert className="mt-2 bg-green-50 border-green-300 text-green-800">
          <PartyPopper className="h-4 w-4 text-green-600" />
          <AlertTitle>Parabéns!</AlertTitle>
          <AlertDescription>
            Você atingiu o limite máximo de {maxHours}h!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
