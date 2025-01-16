import { Clock, Calendar, BookOpen, FileText, ArrowLeft } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const navigate = useNavigate();

  const handleEditorClick = () => {
    setActiveTab("editor");
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
        aria-label="Voltar para home"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <IconCard icon={Clock} label="Horas" />
              <IconCard icon={Calendar} label="Extra" />
              <IconCard icon={BookOpen} label="Editor" onClick={handleEditorClick} />
              <IconCard icon={FileText} label="Escala" />
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <WeeklyCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;