
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Convocacao {
  id: string;
  monthYear: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export const useConvocacaoCheck = (userEmail: string) => {
  const [pendingConvocacao, setPendingConvocacao] = useState<Convocacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }

    checkForPendingConvocacao();
  }, [userEmail]);

  const checkForPendingConvocacao = async () => {
    try {
      // Buscar convocações ativas
      const convocacoesRef = collection(db, "convocacoes");
      const convocacoesQuery = query(convocacoesRef, where("active", "==", true));
      const convocacoesSnapshot = await getDocs(convocacoesQuery);

      for (const convocacaoDoc of convocacoesSnapshot.docs) {
        const convocacaoData = convocacaoDoc.data();
        const convocacaoId = convocacaoDoc.id;

        // Verificar se o usuário já respondeu a esta convocação
        const responseRef = doc(db, "convocacao_responses", `${convocacaoId}_${userEmail}`);
        const responseDoc = await getDoc(responseRef);

        if (!responseDoc.exists()) {
          // Usuário ainda não respondeu a esta convocação
          setPendingConvocacao({
            id: convocacaoId,
            monthYear: convocacaoData.monthYear,
            startDate: convocacaoData.startDate,
            endDate: convocacaoData.endDate,
            active: convocacaoData.active
          });
          setIsLoading(false);
          return;
        }
      }

      // Nenhuma convocação pendente
      setPendingConvocacao(null);
    } catch (error) {
      console.error("Error checking for pending convocacao:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { pendingConvocacao, isLoading, recheckConvocacao: checkForPendingConvocacao };
};
