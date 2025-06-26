
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

  // Listen for active convocations and user data changes
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser.id) return;

    const convocacoesRef = collection(db, "convocacoes");
    const q = query(
      convocacoesRef,
      where("active", "==", true),
      orderBy("startTime", "desc"),
      limit(1)
    );

    const unsubscribeConvocacao = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const convocacao = snapshot.docs[0].data();
        const convocacaoWithId = { id: snapshot.docs[0].id, ...convocacao };
        const deadline = convocacao.deadline;
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();

        // Check if convocation is still active
        if (deadlineTime > now) {
          setConvocacaoDeadline(deadline);
          setActiveConvocation(convocacaoWithId);
        } else {
          // Auto-deactivate expired convocations
          const convocacaoRef = doc(db, "convocacoes", snapshot.docs[0].id);
          updateDoc(convocacaoRef, { active: false });
          setConvocacaoDeadline(null);
          setActiveConvocation(null);
          setShowConvocacao(false);
        }
      } else {
        setConvocacaoDeadline(null);
        setActiveConvocation(null);
        setShowConvocacao(false);
      }
    });

    // Listen to user data changes to check SouVoluntario status
    const userDocRef = doc(db, "users", currentUser.id);
    const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Show convocation only if there's an active one and user hasn't responded
        if (activeConvocation && userData.SouVoluntario === null) {
          setShowConvocacao(true);
        } else {
          setShowConvocacao(false);
        }
      }
    });

    return () => {
      unsubscribeConvocacao();
      unsubscribeUser();
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
