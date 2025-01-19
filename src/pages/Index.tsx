import { Clock, Calendar, BookOpen, FileText, ArrowLeft } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get user data from localStorage
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isAdmin = userData?.role === 'admin';

  const handleEditorClick = () => {
    setActiveTab("editor");
  };

  const handleExtraClick = () => {
    setActiveTab("extra");
  };

  const handleBackClick = () => {
    setActiveTab("main");
  };

  return (
    <div className="relative min-h-screen bg-primary dark:bg-primary text-foreground">
      <div className="pt-8 px-6 pb-16 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <IconCard icon={Clock} label="Horas" />
              <IconCard icon={Calendar} label="Extra" onClick={handleExtraClick} />
              {isAdmin && (
                <IconCard icon={BookOpen} label="Editor" onClick={handleEditorClick} />
              )}
              <IconCard icon={FileText} label="Escala" />
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-accent/80 transition-colors text-foreground"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <WeeklyCalendar 
                isLocked={isLocked}
                onLockChange={setIsLocked}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                showControls={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="extra">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-accent/80 transition-colors text-foreground"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-card rounded-xl shadow-lg">
                <TimeSlotsList />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;