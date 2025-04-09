
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndividualConsultation } from "@/components/hours/IndividualConsultation";
import { GeneralConsultation } from "@/components/hours/GeneralConsultation";

const Hours = () => {
  const [userData, setUserData] = useState<any>(null);
  const [activeConsult, setActiveConsult] = useState<'individual' | 'general'>('individual');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(storedUser);
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData(updatedUser);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="relative h-12">
        <div className="absolute right-0 top-0">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" 
            aria-label="Voltar para home"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Tabs 
          defaultValue="individual" 
          value={activeConsult} 
          onValueChange={(value) => setActiveConsult(value as 'individual' | 'general')} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-lg mb-6">
            <TabsTrigger
              value="individual"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md border-none py-3 text-base"
            >
              Consulta Individual
            </TabsTrigger>
            {userData?.userType === 'admin' && (
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md border-none py-3 text-base"
              >
                Consulta Geral
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="individual">
            <IndividualConsultation userData={userData} />
          </TabsContent>

          {userData?.userType === 'admin' && (
            <TabsContent value="general">
              <GeneralConsultation userData={userData} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Hours;
