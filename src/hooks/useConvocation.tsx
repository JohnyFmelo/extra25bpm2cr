
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch, query, onSnapshot, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export const useConvocation = () => {
  const [showConvocacao, setShowConvocacao] = useState(false);
  const [convocacaoDeadline, setConvocacaoDeadline] = useState<string | null>(null);
  const [activeConvocation, setActiveConvocation] = useState<any>(null);
  const { toast } = useToast();

  // Function to clear SouVoluntario field from all users (only when new convocation starts)
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

  // Listen for active convocations
  useEffect(() => {
    const convocacoesRef = collection(db, "convocacoes");
    const q = query(
      convocacoesRef,
      where("active", "==", true),
      orderBy("startTime", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const convocacao = snapshot.docs[0].data();
        const convocacaoWithId = { id: snapshot.docs[0].id, ...convocacao };
        const deadline = convocacao.deadline;
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();

        console.log("Convocação encontrada:", convocacao);
        console.log("Deadline:", deadline);
        console.log("Agora:", now);
        console.log("Deadline time:", deadlineTime);

        // Check if convocation is still active
        if (deadlineTime > now) {
          setConvocacaoDeadline(deadline);
          setActiveConvocation(convocacaoWithId);
          
          // Get current user data
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          console.log("Current user:", currentUser);
          console.log("SouVoluntario value:", currentUser.SouVoluntario);
          
          // Show convocation only if user hasn't responded yet (SouVoluntario is null)
          if (currentUser.id && (currentUser.SouVoluntario === null || currentUser.SouVoluntario === undefined)) {
            console.log("Mostrando convocação para usuário");
            setShowConvocacao(true);
          } else {
            console.log("Usuário já respondeu ou SouVoluntario não é null");
            setShowConvocacao(false);
          }
        } else {
          console.log("Convocação expirada, desativando");
          // Auto-deactivate expired convocations
          const convocacaoRef = doc(db, "convocacoes", snapshot.docs[0].id);
          updateDoc(convocacaoRef, { active: false });
          setConvocacaoDeadline(null);
          setActiveConvocation(null);
          setShowConvocacao(false);
        }
      } else {
        console.log("Nenhuma convocação ativa encontrada");
        setConvocacaoDeadline(null);
        setActiveConvocation(null);
        setShowConvocacao(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for user data changes to update convocation visibility
  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      console.log("Dados do usuário atualizados:", updatedUser);
      
      // If user responded (SouVoluntario is no longer null), hide convocation
      if (updatedUser.SouVoluntario !== null && updatedUser.SouVoluntario !== undefined) {
        console.log("Usuário respondeu, ocultando convocação");
        setShowConvocacao(false);
      }
    };

    // Listen for storage changes
    const handleStorageChange = () => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (activeConvocation && (currentUser.SouVoluntario !== null && currentUser.SouVoluntario !== undefined)) {
        setShowConvocacao(false);
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeConvocation]);

  const cancelConvocation = async (convocacaoId: string) => {
    try {
      const convocacaoRef = doc(db, "convocacoes", convocacaoId);
      await updateDoc(convocacaoRef, {
        active: false,
        cancelledAt: new Date().toISOString()
      });

      toast({
        title: "Convocação cancelada",
        description: "A convocação foi cancelada com sucesso."
      });

      setConvocacaoDeadline(null);
      setActiveConvocation(null);
      setShowConvocacao(false);
    } catch (error) {
      console.error("Erro ao cancelar convocação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar a convocação."
      });
    }
  };

  const iniciarConvocacao = () => {
    // This will be handled by the ConvocacaoConfigDialog
    return Promise.resolve();
  };

  return {
    showConvocacao,
    setShowConvocacao,
    convocacaoDeadline,
    activeConvocation,
    iniciarConvocacao,
    clearVolunteerStatus,
    cancelConvocation
  };
};
