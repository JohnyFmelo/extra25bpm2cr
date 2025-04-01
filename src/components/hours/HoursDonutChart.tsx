import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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

  // Determine color based on hour thresholds
  const getColor = (hours: number) => {
    if (hours < 13) return '#F97316'; // Orange
    if (hours < 25) return '#FEF08A'; // Yellow
    if (hours < 31) return '#1B98E0'; // Blue
    if (hours < 39) return '#86EFAC'; // Light Green
    return '#22C55E'; // Green
  };
  const chartColor = getColor(hours);
  const data = [{
    name: 'Horas Trabalhadas',
    value: hours,
    color: chartColor
  }, {
    name: 'Horas Restantes',
    value: remainingHours,
    color: '#E0E0E0'
  }];

  // Get progress bar color based on the same thresholds
  const progressBarColor = hours < 13 ? 'bg-orange-500' : hours < 25 ? 'bg-yellow-300' : hours < 31 ? 'bg-blue-500' : hours < 39 ? 'bg-green-300' : 'bg-green-500';
  return <div className="flex flex-col items-center mt-4 space-y-2">
      <div className="h-40 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-2xl font-bold">{hours}h</div>
          
        </div>
      </div>
      
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs">
          <span>0h</span>
          <span>{maxHours}h</span>
        </div>
        <Progress value={percentage} className="h-2" indicatorClassName={progressBarColor} />
      </div>
    </div>;
};