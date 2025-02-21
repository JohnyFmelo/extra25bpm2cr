import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoursData } from "@/types/hours";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({
  data,
  onClose
}: UserHoursDisplayProps) => {

  const totalHours = data["Total Geral"] ? parseFloat(data["Total Geral"]) : 0;
  const maxHours = 50;
  const remainingHours = Math.max(0, maxHours - totalHours);
  const percentage = (totalHours / maxHours) * 100;
  const chartData = {
    labels: ['Horas Trabalhadas', 'Horas Restantes'],
    datasets: [
      {
        label: 'Horas',
        data: [totalHours, remainingHours],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)', // Azul para horas trabalhadas
          'rgba(201, 203, 207, 0.8)', // Cinza para horas restantes
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(201, 203, 207, 1)',
        ],
        borderWidth: 1,
        cutout: '70%', // Para criar o efeito de rosca
        circumference: 360,
        rotation: 270,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Oculta a legenda
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR').format(context.parsed.y) + " horas";
            }
            return label;
          }
        }
      },
    },
  };


  return <div className="mt-6 space-y-4 my-0">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>

      <div className="relative h-48 w-48 mx-auto"> {/* Container para o gráfico */}
        <Doughnut data={chartData} options={chartOptions} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{totalHours.toFixed(1)}</span>
          <span className="text-sm text-gray-500">Total Horas</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">Dias trabalhados:</h3>
        {data["Horas 25° BPM"] && <p>25° BPM: {data["Horas 25° BPM"]}</p>}
        {data.Sonora && <p>Sonora: {data.Sonora}</p>}
        {data.Sinfra && <p>Sinfra: {data.Sinfra}</p>}
      </div>

      <Separator />

      <div>
        <h3 className="font-bold mb-2">Horas:</h3>
        {data["Total 25° BPM"] && <p className="font-normal">25° BPM: {data["Total 25° BPM"]}</p>}
        {data["Total Geral"] && <p className="font-bold text-green-600">
            Total: {data["Total Geral"]}
          </p>}
      </div>

      <Button variant="destructive" className="w-full mt-4" onClick={onClose}>
        Fechar
      </Button>
    </div>;
};
