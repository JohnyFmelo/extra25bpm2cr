import { Clock, Calendar, FileText, BookOpen } from "lucide-react";
import IconCard from "@/components/IconCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <IconCard icon={Clock} label="Horas" />
          <IconCard icon={Calendar} label="Extra" />
          <IconCard icon={BookOpen} label="Editor" showCalendar />
          <IconCard icon={FileText} label="Escala" />
        </div>
      </div>
    </div>
  );
};

export default Index;