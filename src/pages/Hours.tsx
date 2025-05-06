
import React, { useState, useEffect } from "react";
import { MonthSelector, getCurrentMonthValue, months } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { AllUsersHours } from "@/components/hours/AllUsersHours";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { HoursData, UserOption } from "@/types/hours";
import { useToast } from "@/hooks/use-toast";
// Fix 1: Fix the import path for supabase - using default export
import supabase from "@/lib/supabaseClient";
import { Separator } from "@/components/ui/separator";
import IconCard from "@/components/IconCard";

type ViewMode = "all" | "individual" | "monthly-summary";

const Hours = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  // Fix 2: Fix the UserOption type to match the import
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<HoursData | null>(null);
  const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [showUserHours, setShowUserHours] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Add search term state for AllUsersHours

  // Find the month name based on the selected month value
  const getSelectedMonthName = () => {
    const selectedMonth = months.find(month => month.value === selectedMonth);
    return selectedMonth ? selectedMonth.label : "";
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSelectedUserData(null);

    try {
      // Fetch hours data from Supabase
      const { data, error } = await supabase
        .from('hours')
        .select('*')
        .eq('month', selectedMonth);

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Extract unique user names
        const uniqueUsers = [...new Set(data.map(item => item.Nome))].sort();
        // Fix 3: Include registration property in UserOption
        const userOptions = uniqueUsers.map(name => ({
          value: name,
          label: name,
          registration: name // Using name as registration as a fallback
        }));
        setUsers(userOptions);
        setAllUsersData(data);
      } else {
        setUsers([]);
        setAllUsersData([]);
        setError("Nenhum dado encontrado para este mês.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    setSelectedUserData(null);
  };

  const handleUserSelect = (userName: string) => {
    const userData = allUsersData.find(data => data.Nome === userName);
    if (userData) {
      setSelectedUserData(userData);
    }
  };

  const clearSelectedUser = () => {
    setSelectedUserData(null);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  if (showUserHours && selectedUserData) {
    return (
      <div className="p-6">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => setShowUserHours(false)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <UserHoursDisplay 
              data={selectedUserData} 
              onClose={() => setShowUserHours(false)} 
              monthName={getSelectedMonthName()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button
        variant="outline"
        className="mb-4"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="space-y-6">
        <MonthSelector
          value={selectedMonth}
          onChange={handleMonthChange}
        />

        <UserSelector
          disabled={!selectedMonth || loading}
          onSelectUser={handleUserSelect}
          users={users}
        />

        {selectedUserData && (
          <div className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <UserHoursDisplay 
                  data={selectedUserData} 
                  onClose={clearSelectedUser}
                  monthName={getSelectedMonthName()}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {selectedMonth && !selectedUserData && !error && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4">Relatório do mês: {getSelectedMonthName()}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <IconCard
                // Fix 4: Use proper icon component
                icon={ArrowLeft}
                label="Ver Todos os Usuários"
                onClick={() => setViewMode("all")}
              />
              <IconCard
                // Fix 4: Use proper icon component
                icon={ArrowLeft}
                label="Resumo Mensal"
                onClick={() => setViewMode("monthly-summary")}
              />
            </div>

            <Separator className="my-6" />

            {viewMode === "all" && (
              // Fix 5: Add missing props to AllUsersHours component
              <AllUsersHours
                users={allUsersData}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
              />
            )}

            {viewMode === "monthly-summary" && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Resumo de Horas - {getSelectedMonthName()}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-800">Total de Usuários</h4>
                        <p className="text-2xl font-bold text-blue-600">{allUsersData.length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h4 className="font-medium text-green-800">Total de Horas</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {allUsersData.reduce((sum, user) => {
                            const hours = user["Total Geral"] 
                              ? parseFloat(user["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) 
                              : 0;
                            return sum + hours;
                          }, 0).toFixed(2).replace('.', ',')}h
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h4 className="font-medium text-purple-800">Média por Usuário</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {(allUsersData.reduce((sum, user) => {
                            const hours = user["Total Geral"] 
                              ? parseFloat(user["Total Geral"].replace(/[^0-9,.]/g, '').replace(',', '.')) 
                              : 0;
                            return sum + hours;
                          }, 0) / (allUsersData.length || 1)).toFixed(2).replace('.', ',')}h
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hours;
