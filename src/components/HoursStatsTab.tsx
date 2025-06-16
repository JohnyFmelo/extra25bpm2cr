
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VolunteerHoursStats from "./VolunteerHoursStats";
import AdminHoursStats from "./AdminHoursStats";

interface HoursStatsTabProps {
  isAdmin?: boolean;
}

const HoursStatsTab = ({ isAdmin = false }: HoursStatsTabProps) => {
  if (!isAdmin) {
    return <VolunteerHoursStats />;
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="detailed">Relatórios Detalhados</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-6">
        <VolunteerHoursStats />
      </TabsContent>
      
      <TabsContent value="detailed" className="mt-6">
        <AdminHoursStats />
      </TabsContent>
    </Tabs>
  );
};

export default HoursStatsTab;
