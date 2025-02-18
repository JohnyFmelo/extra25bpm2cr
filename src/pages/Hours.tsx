import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IndividualConsult } from "@/components/hours/IndividualConsult";
import { GeneralConsult } from "@/components/hours/GeneralConsult";
import { fetchAllUsers } from "@/services/hoursService";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import type { UserOption } from "@/types/hours";

const Hours = () => {
  const [activeConsult, setActiveConsult] = useState<'individual' | 'general'>('individual');
  const [users, setUsers] = useState<UserOption[]>([]);
  const userData = useUserData();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">Consulta de Horas</h1>
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-primary"
          aria-label="Voltar para home"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setActiveConsult('individual')}
            variant={activeConsult === 'individual' ? 'default' : 'outline'}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            <span>Consulta Individual</span>
          </Button>
          {userData?.userType === 'admin' && (
            <Button
              onClick={() => setActiveConsult('general')}
              variant={activeConsult === 'general' ? 'default' : 'outline'}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Consulta Geral</span>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {activeConsult === 'individual' ? (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-center">Suas Horas</h2>
            <IndividualConsult userData={userData} />
          </div>
        ) : (
          userData?.userType === 'admin' && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-center">Horas da Equipe</h2>
              <GeneralConsult users={users} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Hours;
