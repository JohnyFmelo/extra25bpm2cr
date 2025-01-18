import MonthlyHoursChart from "@/components/MonthlyHoursChart";
import BottomBar from "@/components/BottomBar";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="flex-1 p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Total de Horas no Mês</h2>
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <MonthlyHoursChart />
          </div>
        </div>
      </div>
      <BottomBar />
    </div>
  );
};

export default Index;