import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
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
      color: "#247BA0"
    }
  };

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Bar
          dataKey="hours"
          fill="var(--color-hours)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default MonthlyHoursChart;