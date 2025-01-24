import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WeeklyCalendar from "@/components/WeeklyCalendar";

const Hours = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#E8F1F2] pt-8 px-6 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <div className="absolute right-0 -top-4 mb-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
              aria-label="Voltar para home"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
          <WeeklyCalendar showControls={true} />
        </div>
      </div>
    </div>
  );
};

export default Hours;