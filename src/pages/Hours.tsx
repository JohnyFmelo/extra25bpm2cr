import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
    <div className="container mx-auto p-4">
      {/* Header com botão de voltar */}
      <div className="relative h-12 mb-6"> {/* Adicionado mb-6 para mais espaço abaixo do header */}
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

      {/* Seção de botões de seleção de consulta */}
      <div className="flex justify-center gap-4 mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm"> {/* Estilização adicionada aqui */}
        <Button
          onClick={() => setActiveConsult('individual')}
          variant={activeConsult === 'individual' ? 'default' : 'outline'}
        >
          Consulta Individual
        </Button>
        {userData?.userType === 'admin' && (
          <Button
            onClick={() => setActiveConsult('general')}
            variant={activeConsult === 'general' ? 'default' : 'outline'}
          >
            Consulta Geral
          </Button>
        )}
      </div>

      {/* Grade de conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeConsult === 'individual' && (
          <IndividualConsult userData={userData} />
        )}
        {activeConsult === 'general' && userData?.userType === 'admin' && (
          <GeneralConsult users={users} />
        )}
      </div>
    </div>
  );
};

export default Hours;
