
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export const useConvocation = () => {
  const [showConvocacao, setShowConvocacao] = useState(false);
  const { toast } = useToast();

  // Função para limpar o campo SouVoluntario de todos os usuários
  const clearVolunteerStatus = async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((userDoc) => {
        const userRef = doc(db, "users", userDoc.id);
        batch.update(userRef, {
          SouVoluntario: null,
          dataResposta: null
        });
      });

      await batch.commit();
      console.log("Campo SouVoluntario limpo para todos os usuários");
    } catch (error) {
      console.error("Erro ao limpar status de voluntário:", error);
    }
  };

  // Verificar se é dia 1 do mês e limpar os campos
  useEffect(() => {
    const checkAndClearMonthly = () => {
      const today = new Date();
      const day = today.getDate();
      
      // Se for dia 1, limpar os campos
      if (day === 1) {
        const lastCleared = localStorage.getItem('lastVolunteerClear');
        const currentMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
        
        if (lastCleared !== currentMonth) {
          clearVolunteerStatus();
          localStorage.setItem('lastVolunteerClear', currentMonth);
        }
      }
    };

    checkAndClearMonthly();
    
    // Verificar diariamente
    const interval = setInterval(checkAndClearMonthly, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const iniciarConvocacao = async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      
      toast({
        title: "Convocação iniciada",
        description: `Convocação enviada para ${querySnapshot.docs.length} usuários`
      });

      // Aqui você pode adicionar lógica adicional para notificar os usuários
      // Por exemplo, enviar notificações push ou emails
      
    } catch (error) {
      console.error("Erro ao iniciar convocação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível iniciar a convocação"
      });
    }
  };

  return {
    showConvocacao,
    setShowConvocacao,
    iniciarConvocacao,
    clearVolunteerStatus
  };
};
