
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch, query, onSnapshot, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export const useConvocation = () => {
  const [showConvocacao, setShowConvocacao] = useState(false);
  const [convocacaoDeadline, setConvocacaoDeadline] = useState<string | null>(null);
  const [activeConvocation, setActiveConvocation] = useState<any>(null);
  const [userHasResponded, setUserHasResponded] = useState(false);
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

  // Listen for current user changes in real-time
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser?.id) return;

    const userDocRef = doc(db, "users", currentUser.id);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const updatedUser = { ...currentUser, ...userData };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
        
        // Check if user has responded
        const hasResponded = userData.SouVoluntario !== null && userData.SouVoluntario !== undefined;
        setUserHasResponded(hasResponded);
        
        // Hide convocation immediately if user responded
        if (hasResponded && showConvocacao) {
          console.log("Usuário respondeu, ocultando convocação imediatamente");
          setShowConvocacao(false);
        }
      }
    });

    return () => unsubscribeUser();
  }, [showConvocacao]);

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
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!snapshot.empty) {
        const convocacao = snapshot.docs[0].data();
        const convocacaoWithId = { id: snapshot.docs[0].id, ...convocacao };
        const deadline = convocacao.deadline;
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();

        console.log("Convocação encontrada:", convocacao);
        console.log("Deadline:", deadline);
        console.log("User SouVoluntario:", currentUser.SouVoluntario);

        // Check if convocation is still active
        if (deadlineTime > now) {
          setConvocacaoDeadline(deadline);
          setActiveConvocation(convocacaoWithId);
          
          // Only show if user hasn't responded AND hasn't already seen this convocation
          const hasNotResponded = currentUser.SouVoluntario === null || currentUser.SouVoluntario === undefined;
          
          if (currentUser.id && hasNotResponded && !userHasResponded) {
            console.log("Mostrando convocação para usuário que não respondeu");
            setShowConvocacao(true);
          } else {
            console.log("Usuário já respondeu ou convocação já foi vista");
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
  }, [userHasResponded]);

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
      setUserHasResponded(false);
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

  // Function to be called when user responds to hide convocation immediately
  const hideConvocation = () => {
    setShowConvocacao(false);
    setUserHasResponded(true);
  };

  return {
    showConvocacao,
    setShowConvocacao,
    convocacaoDeadline,
    activeConvocation,
    iniciarConvocacao,
    clearVolunteerStatus,
    cancelConvocation,
    hideConvocation
  };
};
