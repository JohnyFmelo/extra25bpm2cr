import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoursData } from "@/types/hours";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({ data, onClose }: UserHoursDisplayProps) => {
  // Prepare data for the donut chart
  const totalGeneral = Math.min(data["Total Geral"] || 0, 50); // Cap total at 50
  const chartData = {
    labels: ["25° BPM", "Sonora", "Sinfra", "Restante"],
    datasets: [
      {
        data: [
          Math.min(data["Total 25° BPM"] || 0, 50), // Hours for 25° BPM
          Math.min(data.Sonora || 0, 50), // Hours for Sonora
          Math.min(data.Sinfra || 0, 50), // Hours for Sinfra
          Math.max(50 - totalGeneral, 0), // Remaining hours to reach 50
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // 25° BPM
          "rgba(255, 159, 64, 0.6)", // Sonora
          "rgba(153, 102, 255, 0.6)", // Sinfra
          "rgba(200, 200, 200, 0.6)", // Remaining
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(200, 200, 200, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw} horas`,
        },
      },
    },
    cutout: "60%", // Makes it a donut chart
  };

  return (
    <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>

      <div>
        <h3 className="font-bold mb-2">Dias trabalhados:</h3>
        {data["Horas 25° BPM"] && <p>25° BPM: {data["Horas 25° BPM"]}</p>}
        {data.Sonora && <p>Sonora: {data.Sonora}</p>}
        {data.Sinfra && <p>Sinfra: {data.Sinfra}</p>}
      </div>

      <Separator />

      <div>
        <h3 className="font-bold mb-2">Horas:</h3>
        {data["Total 25° BPM"] && (
          <p className="font-normal">25° BPM: {data["Total 25° BPM"]}</p>
        )}
        {data["Total Geral"] && (
          <p className="font-bold text-green-600">
            Total: {data["Total Geral"]}
          </p>
        )}
      </div>

      {/* Donut Chart */}
      <div className="mt-4">
        <h3 className="font-bold mb-2 text-center">Distribuição de Horas (Máx. 50h)</h3>
        <div className="max-w-xs mx-auto">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>

      <Button variant="destructive" className="w-full mt-4" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
