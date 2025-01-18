import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { LoaderCircle } from "lucide-react";
import { ChartContainer } from "./ui/chart";

const MonthlyHoursChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["monthlyHours"],
    queryFn: async () => {
      // Simulated data - replace with actual API call
      return [
        { name: "Jan", hours: 160 },
        { name: "Fev", hours: 152 },
        { name: "Mar", hours: 168 },
        { name: "Abr", hours: 144 }
      ];
    }
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const config = {
    hours: {
      color: "#1B98E0" // Using the highlight color from the theme
    }
  };

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8F1F2" />
          <XAxis 
            dataKey="name" 
            stroke="#13293D"
            fontSize={12}
          />
          <YAxis 
            stroke="#13293D"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#E8F1F2',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Bar
            dataKey="hours"
            fill="var(--color-hours)"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default MonthlyHoursChart;