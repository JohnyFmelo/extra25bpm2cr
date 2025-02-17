import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MonthSelector } from "@/components/hours/MonthSelector";
import { UserSelector } from "@/components/hours/UserSelector";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
// Assuming you have initialized your supabase client somewhere, import it here
import { supabase } from "@/supabaseClient"; // Adjust path if necessary
import type { HoursData, UserOption } from "@/types/hours";

// **NEW: Function to fetch user hours from Supabase**
const fetchUserHoursFromSupabase = async (month: string, registration: string): Promise<HoursData[]> => {
    try {
        const { data, error } = await supabase
            .from('escalas') // Replace 'escalas' with your Supabase table name if different
            .select('*') // Select all columns
            .eq('Matricula', registration) // Filter by registration (assuming 'Matricula' is the column name)
            .ilike('Nome', `%${month}%`); // **IMPORTANT: Adjust month filtering logic based on your Supabase data structure. This is a basic example and might need to be refined.**
                                        //  For example, if you store the month as a separate column or in a different format, adjust the query accordingly.
                                        //  Also, 'Nome' column is used here for month filtering as a placeholder because month info is not explicitly sent in VBA code,
                                        //  you might need to adjust this to a proper date or month column if you have one in your Supabase table.
                                        //  A better approach would be to send and store a specific month/year column from VBA to Supabase.

        if (error) {
            console.error("Supabase error fetching user hours:", error);
            return [{ error: error.message } as HoursData]; // Return error in the format expected by the component
        }
        return data as HoursData[];
    } catch (error) {
        console.error("Error fetching user hours from Supabase:", error);
        return [{ error: (error as Error).message } as HoursData];
    }
};


// **NEW: Function to fetch all users from Supabase (adjust query based on your user data structure)**
const fetchAllUsersFromSupabase = async (): Promise<UserOption[]> => {
    try {
        // **IMPORTANT:** This is a basic example and assumes your user data is in the 'escalas' table and you want to extract unique users from there.
        //  If you have a separate 'users' table or a different way to manage users, you'll need to adjust this query.
        const { data, error } = await supabase
            .from('escalas') // Replace 'escalas' with your table name if different
            .select('Matricula, Nome') // Select columns for registration and name
            .order('Nome', { ascending: true }); // Order users by name for better display

        if (error) {
            console.error("Supabase error fetching all users:", error);
            return []; // Return empty array on error
        }

        // Extract unique users based on Matricula and format them as UserOption
        const uniqueUsersMap = new Map<string, UserOption>();
        data.forEach(row => {
            if (row.Matricula && row.Nome && !uniqueUsersMap.has(row.Matricula)) {
                uniqueUsersMap.set(row.Matricula, {
                    value: row.Matricula,
                    label: row.Nome,
                });
            }
        });
        return Array.from(uniqueUsersMap.values());

    } catch (error) {
        console.error("Error fetching all users from Supabase:", error);
        return []; // Return empty array on error
    }
};


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
    const {
        toast
    } = useToast();
    const navigate = useNavigate();
    const [consultationTime, setConsultationTime] = useState<number>(0);
    const [isConsulting, setIsConsulting] = useState<boolean>(false);
    const timerInterval = useRef<number | null>(null);

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
            // **MODIFIED: Use the new Supabase function**
            const fetchedUsers = await fetchAllUsersFromSupabase();
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

    const handleConsult = async () => {
        if (!userData?.registration) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Usuário não autenticado ou sem matrícula cadastrada. Por favor, atualize seu cadastro."
            });
            return;
        }
        if (!selectedMonth) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Selecione um mês"
            });
            return;
        }
        setLoading(true);
        try {
            // **MODIFIED: Use the new Supabase function**
            const result = await fetchUserHoursFromSupabase(selectedMonth, userData.registration);
            if (result.error) {
                throw new Error(result.error);
            }
            if (!result.length) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Matrícula não localizada"
                });
                setData(null);
                return;
            }
            setData(result[0]); // Assuming you want the first result
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: error instanceof Error ? error.message : "Erro ao consultar dados. Por favor, tente novamente mais tarde."
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
        setLoadingGeneral(true);
        setIsConsulting(true);
        setConsultationTime(0);
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
                        // **MODIFIED: Use the new Supabase function**
                        const result = await fetchUserHoursFromSupabase(selectedGeneralMonth, user.registration);
                        console.log("Result for user", user.registration, ":", result);
                        if (result && result.length > 0) {
                            allUsersResults.push(result[0]); // Assuming you want the first result
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
                        description: "Nenhum dado encontrado para o período selecionado"
                    });
                    setAllUsersData([]);
                    return;
                }

                const sortedResults = [...allUsersResults].sort((a, b) => (b.Total || 0) - (a.Total || 0));
                setAllUsersData(sortedResults);
                setGeneralData(null);
            } else {
                // **MODIFIED: Use the new Supabase function**
                const result = await fetchUserHoursFromSupabase(selectedGeneralMonth, selectedUser);
                if (result.error) {
                    throw new Error(result.error);
                }
                if (!result.length) {
                    toast({
                        variant: "destructive",
                        title: "Erro",
                        description: "Matrícula não localizada"
                    });
                    setGeneralData(null);
                    return;
                }
                setGeneralData(result[0]); // Assuming you want the first result
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
            setLoadingGeneral(false);
            setIsConsulting(false);
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
                timerInterval.current = null;
            }
        }
    };


    const formatTime = (timeInSeconds: number): string => {
        return `${timeInSeconds.toFixed(1)}s`;
    };

    return (
        <div className="container mx-auto p-4">
            {/* ... rest of your component UI remains largely the same ... */}
            {/*  (MonthSelector, UserSelector, Button, UserHoursDisplay, etc.) */}
            <div className="relative h-12">
                <div className="absolute right-0 top-0">
                    <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
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

                        <Button onClick={handleConsult} disabled={loading || !userData?.registration} className="w-full">
                            {loading ? <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Consultando...
                                </> : "Consultar"}
                        </Button>

                        {!userData?.registration && <p className="text-sm text-red-500">
                                Você precisa cadastrar sua matrícula para consultar as horas.
                            </p>}

                        {data && <UserHoursDisplay data={data} onClose={() => setData(null)} />}
                    </div>
                </div>

                {/* Consulta Geral (apenas para admin) */}
                {userData?.userType === 'admin' && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-primary mb-4">Consulta Geral</h2>
                        <div className="space-y-4">
                            <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />

                            <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />

                            <Button onClick={handleGeneralConsult} disabled={loadingGeneral} className="w-full">
                                {loadingGeneral ? <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Consultando...
                                    </> : "Consultar"}
                            </Button>

                            {isConsulting && <p className="text-sm text-gray-500">
                                    Consulta: {formatTime(consultationTime)}
                                </p>}

                            {selectedUser === 'all' && allUsersData.map((userData, index) => (
                                <div key={index} className="mb-4 p-4 rounded-md shadow-sm bg-orange-50">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        {users.find(user => user.registration === userData.Matricula)?.label} {/* Use Matricula to match */}
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
