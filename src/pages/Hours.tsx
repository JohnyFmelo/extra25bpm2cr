import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, Users } from "lucide-react";
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
  const [activeConsult, setActiveConsult] = useState<'individual' | 'general'>('individual');
  const { toast } = useToast();
  const navigate = useNavigate();

  // ... (previous useEffect and function implementations remain the same)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Sistema de Horas
          </h1>
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Voltar para home"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Consultation Type Selector */}
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-8 max-w-xl mx-auto backdrop-blur-sm bg-white/50">
          <div className="flex gap-2">
            <Button 
              onClick={() => setActiveConsult('individual')}
              className={`flex-1 py-6 text-base font-medium rounded-xl transition-all ${
                activeConsult === 'individual' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-5 h-5 mr-2" />
              Consulta Individual
            </Button>
            {userData?.userType === 'admin' && (
              <Button 
                onClick={() => setActiveConsult('general')}
                className={`flex-1 py-6 text-base font-medium rounded-xl transition-all ${
                  activeConsult === 'general' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                Consulta Geral
              </Button>
            )}
          </div>
        </div>

        {/* Individual Consultation Form */}
        {activeConsult === 'individual' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 max-w-2xl mx-auto transition-all duration-300 hover:shadow-md">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                Consulta Individual
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
                </div>

                <Button 
                  onClick={handleConsult} 
                  disabled={loading || !userData?.registration} 
                  className="w-full py-6 text-base font-medium rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Consultando...</span>
                    </div>
                  ) : (
                    "Consultar"
                  )}
                </Button>

                {!userData?.registration && (
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="text-sm text-red-600 text-center font-medium">
                      Você precisa cadastrar sua matrícula para consultar as horas.
                    </p>
                  </div>
                )}

                {data && (
                  <div className="mt-8 animate-fadeIn">
                    <UserHoursDisplay data={data} onClose={() => setData(null)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* General Consultation Form */}
        {activeConsult === 'general' && userData?.userType === 'admin' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 max-w-2xl mx-auto transition-all duration-300 hover:shadow-md">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                Consulta Geral
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                  <UserSelector users={users} value={selectedUser} onChange={setSelectedUser} />
                  <MonthSelector value={selectedGeneralMonth} onChange={setSelectedGeneralMonth} />
                </div>

                <Button 
                  onClick={handleGeneralConsult} 
                  disabled={loadingGeneral} 
                  className="w-full py-6 text-base font-medium rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-50"
                >
                  {loadingGeneral ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Consultando...</span>
                    </div>
                  ) : (
                    "Consultar"
                  )}
                </Button>

                {selectedUser === 'all' && (
                  <div className="space-y-6">
                    {allUsersData.map((userData, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-50 rounded-xl p-6 transition-all duration-300 hover:shadow-md"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          {users.find(user => user.registration === userData.matricula)?.label}
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
                  </div>
                )}

                {generalData && (
                  <div className="mt-8 animate-fadeIn">
                    <UserHoursDisplay data={generalData} onClose={() => setGeneralData(null)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hours;
