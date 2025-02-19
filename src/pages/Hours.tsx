
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="relative h-12 mb-6">
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

      <div className="flex justify-center gap-4 mb-8">
        <Button 
          onClick={() => setActiveConsult('individual')}
          variant={activeConsult === 'individual' ? 'default' : 'outline'}
          className={`h-12 px-8 rounded-full text-lg font-medium ${
            activeConsult === 'individual' 
              ? 'bg-white text-gray-900 shadow-md' 
              : 'text-gray-500'
          }`}
        >
          Consulta Individual
        </Button>
        {userData?.userType === 'admin' && (
          <Button 
            onClick={() => setActiveConsult('general')}
            variant={activeConsult === 'general' ? 'default' : 'outline'}
            className={`h-12 px-8 rounded-full text-lg font-medium ${
              activeConsult === 'general' 
                ? 'bg-white text-gray-900 shadow-md' 
                : 'text-gray-500'
            }`}
          >
            Consulta Geral
          </Button>
        )}
      </div>

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
