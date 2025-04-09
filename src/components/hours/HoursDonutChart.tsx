
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";

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

  // Set a fixed green color for the chart to match the design
  const chartColor = '#22C55E'; // Green
  
  const data = [{
    name: 'Horas Trabalhadas',
    value: hours,
    color: chartColor
  }, {
    name: 'Horas Restantes',
    value: remainingHours,
    color: '#E0E0E0'
  }];

  return (
    <div className="flex flex-col items-center mt-4 space-y-2">
      <div className="h-40 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              innerRadius={50} 
              outerRadius={70} 
              paddingAngle={0} 
              dataKey="value" 
              startAngle={90} 
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-bold">{hours}h</div>
        </div>
      </div>

      <div className="w-full space-y-1 relative">
        <div className="flex justify-between text-xs text-gray-600">
          <span>0h</span>
          <span>{maxHours}h</span>
        </div>
        <Progress value={percentage} className="h-2" indicatorClassName="bg-green-500" />
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute top-[8px] w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2"
            style={{ left: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};
