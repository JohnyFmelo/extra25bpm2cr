
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { fetchUserHours, fetchAllUsers } from "@/services/hoursService";
import type { HoursData, UserOption } from "@/types/hours";
import { Card, CardContent } from "@/components/ui/card";

interface GeneralConsultationProps {
  userData: any;
}

export const GeneralConsultation = ({ userData }: GeneralConsultationProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generalData, setGeneralData] = useState<HoursData | null>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (userData?.userType === 'admin') {
      fetchUsersList();
    }
  }, [userData?.userType]);

  const fetchUsersList = async () => {
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de usuários."
      });
    }
  };

  const handleGeneralConsult = async () => {
    if (!selectedMonth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um mês"
      });
      return;
    }
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um usuário"
      });
      return;
    }

    setLoading(true);
    try {
      if (selectedUser === 'all') {
        const allUsersResults = [];
        for (const user of users) {
          try {
            const result = await fetchUserHours(selectedMonth, user.registration);
            if (result && result.length > 0) {
              allUsersResults.push(result[0]);
            }
          } catch (error) {
            console.error(`Error fetching data for user ${user.registration}:`, error);
          }
        }
        if (allUsersResults.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Nenhum dado encontrado para o período selecionado"
          });
          setAllUsersData([]);
          return;
        }
        const sortedResults = [...allUsersResults].sort((a, b) => {
          const totalA = a["Total Geral"] ? parseFloat(a["Total Geral"].toString().replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
          const totalB = b["Total Geral"] ? parseFloat(b["Total Geral"].toString().replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;
          return totalB - totalA;
        });
        setAllUsersData(sortedResults);
        setGeneralData(null);
      } else {
        const result = await fetchUserHours(selectedMonth, selectedUser);
        if (result.error) {
          throw new Error(result.error);
        }
        if (!result || result.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Matrícula não localizada"
          });
          setGeneralData(null);
          return;
        }
        setGeneralData(result[0]);
        setAllUsersData([]);
      }
    } catch (error) {
      console.error('Error fetching general data:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao consultar dados."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none rounded-md shadow-md">
      <CardContent className="p-6 pt-6">
        <h2 className="text-xl font-bold text-primary mb-6">Consulta Geral</h2>
        <div className="space-y-5">
          <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />

          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

          <Button 
            onClick={handleGeneralConsult} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consultando...
              </>
            ) : (
              "Consultar"
            )}
          </Button>

          {selectedUser === 'all' && allUsersData.map((userData, index) => (
            <div key={index} className="mb-5 p-4 rounded-lg shadow-sm bg-white">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {users.find(user => user.registration === userData.Matricula)?.label}
              </h3>
              <UserHoursDisplay
                data={userData}
                onClose={() => {
                  const updatedData = [...allUsersData];
                  updatedData.splice(index, 1);
                  setAllUsersData(updatedData);
                }}
              />
            </div>
          ))}

          {generalData && <UserHoursDisplay data={generalData} onClose={() => setGeneralData(null)} />}
        </div>
      </CardContent>
    </Card>
  );
};
