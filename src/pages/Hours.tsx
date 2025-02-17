
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderWithBackButton } from "@/components/hours/HeaderWithBackButton";
import { IndividualConsultation } from "@/components/hours/IndividualConsultation";
import { GeneralConsultation } from "@/components/hours/GeneralConsultation";

const Hours = () => {
  const [userData, setUserData] = useState<any>(null);

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
      <HeaderWithBackButton />

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Consulta Individual</TabsTrigger>
          <TabsTrigger value="general">Consulta Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <IndividualConsultation userData={userData} />
        </TabsContent>

        <TabsContent value="general">
          <GeneralConsultation userData={userData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Hours;
