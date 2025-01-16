import { Clock, Calendar, BookOpen, FileText, ArrowLeft } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");

  const handleEditorClick = () => {
    setActiveTab("editor");
  };

  const handleBackClick = () => {
    setActiveTab("main");
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="pt-16 px-6">
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
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <WeeklyCalendar />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;