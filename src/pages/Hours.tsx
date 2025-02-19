import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react"; // Corrected the import path
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { fetchUserHours, fetchAllUsers } from "@/services/hoursService";
import type { HoursData, UserOption } from "@/types/hours";

const Hours = () => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedGeneralMonth, setSelectedGeneralMonth] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [data, setData] = useState(null);
  const [generalData, setGeneralData] = useState(null);
  const [allUsersData, setAllUsersData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeConsult, setActiveConsult] = useState("individual");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData(storedUser);

    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUserData(updatedUser);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (userData?.userType === "admin") {
      fetchUsersList();
    }
  }, [userData?.userType]);

  const fetchUsersList = async () => {
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de usuários.",
      });
    }
  };

  const handleConsult = async () => {
    if (!userData?.registration) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Usuário não autenticado ou sem matrícula cadastrada. Por favor, atualize seu cadastro.",
      });
      return;
    }

    if (!selectedMonth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um mês",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await fetchUserHours(selectedMonth, userData.registration);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result || result.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Matrícula não localizada",
        });
        setData(null);
        return;
      }

      setData(result[0]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao consultar dados. Por favor, tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralConsult = async () => {
    if (!selectedGeneralMonth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um mês",
      });
      return;
    }

    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um usuário",
      });
      return;
    }

    setLoadingGeneral(true);

    try {
      let results;

      if (selectedUser === "all") {
        results = [];
        for (const user of users) {
          try {
            const result = await fetchUserHours(
              selectedGeneralMonth,
              user.registration
            );

            if (result && result.length > 0) {
              results.push(result[0]);
            }
          } catch (error) {
            console.error(
              `Error fetching data for user ${user.registration}:`,
              error
            );
          }
        }

        if (results.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Nenhum dado encontrado para o período selecionado",
          });
          setAllUsersData([]);
          return;
        }

        const sortedResults = [...results].sort(
          (a, b) => (b["Total Geral"] || 0) - (a["Total Geral"] || 0)
        );
        setAllUsersData(sortedResults);
        setGeneralData(null);
      } else {
        const result = await fetchUserHours(
          selectedGeneralMonth,
          selectedUser
        );

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result || result.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Matrícula não localizada",
          });
          setGeneralData(null);
          return;
        }

        setGeneralData(result[0]);
        setAllUsersData([]);
      }
    } catch (error) {
      console.error("Error fetching general data:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao consultar dados.",
      });
    } finally {
      setLoadingGeneral(false);
    }
  };

  return (
    <div>
      <Button
        onClick={() => navigate("/")}
        className="p-3 rounded-full bg-white hover:bg-gray-50 transition-colors"
        aria-label="Voltar para home"
      >
        <ArrowLeft />
      </Button>

      <div className="flex space-x-4">
        <Button
          onClick={() => setActiveConsult("individual")}
          className={`flex-1 py-7 text-lg font-semibold rounded-xl transition-all ${
            activeConsult === "individual"
              ? "bg-primary text-white shadow-md"
              : "bg-transparent text-gray-700 hover:bg-gray-50"
          }`}
        >
          Consulta Individual
        </Button>

        {userData?.userType === "admin" && (
          <Button
            onClick={() => setActiveConsult("general")}
            className={`flex-1 py-7 text-lg font-semibold rounded-xl transition-all ${
              activeConsult === "general"
                ? "bg-primary text-white shadow-md"
                : "bg-transparent text-gray-700 hover:bg-gray-50"
            }`}
          >
            Consulta Geral
          </Button>
        )}
      </div>

      {activeConsult === "individual" && (
        <div>
          {!userData?.registration && (
            <p>Você precisa cadastrar sua matrícula para consultar as horas.</p>
          )}

          <MonthSelector
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />

          <Button
            onClick={handleConsult}
            disabled={loading}
            className={`mt-4 w-full py-3 text-lg font-semibold rounded-xl transition-all ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-primary text-white"
            }`}
          >
            {loading ? "Consultando..." : "Consultar"}
          </Button>

          {data && <UserHoursDisplay data={data} />}
        </div>
      )}

      {activeConsult === "general" && userData?.userType === "admin" && (
        <div>
          <MonthSelector
            selectedMonth={selectedGeneralMonth}
            setSelectedMonth={setSelectedGeneralMonth}
          />

          <UserSelector
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />

          <Button
            onClick={handleGeneralConsult}
            disabled={loadingGeneral}
            className={`mt-4 w-full py-3 text-lg font-semibold rounded-xl transition-all ${
              loadingGeneral ? "bg-gray-500 cursor-not-allowed" : "bg-primary text-white"
            }`}
          >
            {loadingGeneral ? "Consultando..." : "Consultar"}
          </Button>

          {selectedUser === "all" && allUsersData.length > 0 && (
            <ul>
              {allUsersData.map((userData, index) => (
                <li key={index}>
                  {users.find((user) => user.registration === userData.matricula)?.label}
                  {/* Add any additional display logic here */}
                </li>
              ))}
            </ul>
          )}

          {generalData && <UserHoursDisplay data={generalData} />}
        </div>
      )}
    </div>
  );
};

export default Hours;
