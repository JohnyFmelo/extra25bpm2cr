
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch, query, onSnapshot, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export const useConvocation = () => {
  const [showConvocacao, setShowConvocacao] = useState(false);
  const [convocacaoDeadline, setConvocacaoDeadline] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to clear SouVoluntario field from all users
  const clearVolunteerStatus = async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((userDoc) => {
        const userRef = doc(db, "users", userDoc.id);
        batch.update(userRef, {
          SouVoluntario: null,
          dataResposta: null,
          convocacaoDeadline: null
        });
      });

      await batch.commit();
      console.log("Campo SouVoluntario limpo para todos os usuários");
    } catch (error) {
      console.error("Erro ao limpar status de voluntário:", error);
    }
  };

  // Check if it's the 1st of the month and clear fields
  useEffect(() => {
    const checkAndClearMonthly = () => {
      const today = new Date();
      const day = today.getDate();
      
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
    const interval = setInterval(checkAndClearMonthly, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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
        const deadline = convocacao.deadline;
        const now = new Date().getTime();
        const deadlineTime = new Date(deadline).getTime();

        // Check if convocation is still active
        if (deadlineTime > now) {
          setConvocacaoDeadline(deadline);
          
          // Check if current user has already responded
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          if (currentUser.id && !currentUser.dataResposta) {
            setShowConvocacao(true);
          }
        } else {
          setConvocacaoDeadline(null);
          setShowConvocacao(false);
        }
      } else {
        setConvocacaoDeadline(null);
        setShowConvocacao(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for global convocation events
  useEffect(() => {
    const handleConvocacao = (event: CustomEvent) => {
      const { deadline } = event.detail;
      setConvocacaoDeadline(deadline);
      
      // Show convocation modal for current user if they haven't responded
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id && !currentUser.dataResposta) {
        setShowConvocacao(true);
      }
    };

    window.addEventListener('convocacaoIniciada', handleConvocacao as EventListener);
    
    return () => {
      window.removeEventListener('convocacaoIniciada', handleConvocacao as EventListener);
    };
  }, []);

  const iniciarConvocacao = () => {
    // This will be handled by the ConvocacaoConfigDialog
    return Promise.resolve();
  };

  return {
    showConvocacao,
    setShowConvocacao,
    convocacaoDeadline,
    iniciarConvocacao,
    clearVolunteerStatus
  };
};
