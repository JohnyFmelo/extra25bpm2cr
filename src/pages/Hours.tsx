import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { fetchUserHours, fetchAllUsers } from "@/services/hoursService";
import type { HoursData, UserOption } from "@/types/hours";

const Hours = () => {
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedGeneralMonth, setSelectedGeneralMonth] = useState<string>("");
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [loadingGeneral, setLoadingGeneral] = useState(false);
    const [data, setData] = useState<HoursData | null>(null);
    const [generalData, setGeneralData] = useState<HoursData | null>(null);
    const [allUsersData, setAllUsersData] = useState<HoursData[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [users, setUsers] = useState<UserOption[]>([]);
    const { toast } = useToast();
    const navigate = useNavigate();
    const [consultationTime, setConsultationTime] = useState<number>(0);  // Tempo em segundos
    const [isConsulting, setIsConsulting] = useState<boolean>(false); // Controla o estado da consulta
    const timerInterval = useRef<number | null>(null); // Usar useRef para o ID do intervalo

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
                description: "Erro ao carregar lista de usuários.",
            });
        }
    };

    const handleConsult = async () => {
        if (!userData?.registration) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Usuário não autenticado ou sem matrícula cadastrada. Por favor, atualize seu cadastro.",
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

            if (!result.length) {
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
            console.error('Error fetching data:', error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: error instanceof Error ? error.message : "Erro ao consultar dados. Por favor, tente novamente mais tarde.",
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
        setIsConsulting(true);
        setConsultationTime(0); // Resetando o tempo
        timerInterval.current = window.setInterval(() => {
            setConsultationTime(prevTime => prevTime + 0.1);
        }, 100);

        try {
            if (selectedUser === 'all') {
                const allUsersResults = [];
                console.log("Users list:", users);

                for (const user of users) {
                    console.log("Processing user:", user.registration);
                    try {
                        const result = await fetchUserHours(selectedGeneralMonth, user.registration);
                        console.log("Result for user", user.registration, ":", result);

                        if (result && result.length > 0) {
                            allUsersResults.push(result[0]);
                            console.log("Added user", user.registration, "to allUsersResults");
                        } else {
                            console.log("No data found for user", user.registration);
                        }
                    } catch (error) {
                        console.error(`Error fetching data for user ${user.registration}:`, error);
                    }
                }

                console.log("Final allUsersResults:", allUsersResults);

                if (allUsersResults.length === 0) {
                    toast({
                        variant: "destructive",
                        title: "Erro",
                        description: "Nenhum dado encontrado para o período selecionado",
                    });
                    setAllUsersData([]);
                    return;
                }

                // Ordenar os resultados por "Total" (do maior para o menor)
                const sortedResults = [...allUsersResults].sort((a, b) => (b.Total || 0) - (a.Total || 0)); // Assume 'Total' é a propriedade que você quer ordenar
                setAllUsersData(sortedResults);
                setGeneralData(null);
            } else {
                const result = await fetchUserHours(selectedGeneralMonth, selectedUser);

                if (result.error) {
                    throw new Error(result.error);
                }

                if (!result.length) {
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
            console.error('Error fetching general data:', error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Erro ao consultar dados.",
            });
        } finally {
            setLoadingGeneral(false);
            setIsConsulting(false);
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
            }
        }
    };

    // Formata o tempo para 00,0s
    const formatTime = (timeInSeconds: number): string => {
      return `${timeInSeconds.toFixed(1)}s`;
    };

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Consulta Individual */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-primary mb-4">Consulta Individual</h2>
                    <div className="space-y-4">
                        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

                        <Button
                            onClick={handleConsult}
                            disabled={loading || !userData?.registration}
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

                        {!userData?.registration && (
                            <p className="text-sm text-red-500">
                                Você precisa cadastrar sua matrícula para consultar as horas.
                            </p>
                        )}

                        {data && <UserHoursDisplay data={data} onClose={() => setData(null)} />}
                    </div>
                </div>

                {/* Consulta Geral (apenas para admin) */}
                {userData?.userType === 'admin' && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
                        <div className="space-y-4">
                            <UserSelector
                                users={users}
                                value={selectedUser}
                                onChange={setSelectedUser}
                            />

                            <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />

                            <Button
                                onClick={handleGeneralConsult}
                                disabled={loadingGeneral}
                                className="w-full"
                            >
                                {loadingGeneral ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Consultando...
                                    </>
                                ) : (
                                    "Consultar"
                                )}
                            </Button>

                            {/* Exibe o tempo de consulta ACIMA */}
                            {isConsulting && (
                                <p className="text-sm text-gray-500">
                                    Consulta: {formatTime(consultationTime)}
                                </p>
                            )}

                            {/* Renderiza o UserHoursDisplay para cada usuário na consulta "Todos" */}
                            {selectedUser === 'all' && allUsersData.map((userData, index) => (
                                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-md shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        {users.find(user => user.registration === userData.registration)?.name}
                                    </h3>
                                    <UserHoursDisplay data={userData} onClose={() => {
                                        const updatedData = [...allUsersData];
                                        updatedData.splice(index, 1);
                                        setAllUsersData(updatedData);
                                    }} />
                                </div>
                            ))}

                            {generalData && <UserHoursDisplay data={generalData} onClose={() => setGeneralData(null)} />}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Hours;
