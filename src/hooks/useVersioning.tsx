
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

export const useVersioning = () => {
  const [currentSystemVersion, setCurrentSystemVersion] = useState("");
  const [userVersion, setUserVersion] = useState("");
  const [shouldShowImprovements, setShouldShowImprovements] = useState(false);
  const [improvements, setImprovements] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    // Listener para mudanças na versão do sistema
    const versionDocRef = doc(db, "system", "version");
    const unsubscribeVersion = onSnapshot(versionDocRef, async (doc) => {
      if (doc.exists()) {
        const systemData = doc.data();
        const systemVersion = systemData.version || "1.0.0";
        setCurrentSystemVersion(systemVersion);
        setImprovements(systemData.improvements || "");

        // Verificar versão do usuário
        const userDocRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentUserVersion = userData.currentVersion || "0.0.0";
          setUserVersion(currentUserVersion);

          // Se a versão do sistema é diferente da versão do usuário
          if (systemVersion !== currentUserVersion) {
            // Se o usuário está logado e sua versão é antiga, fazer logout
            if (currentUserVersion !== "0.0.0") {
              localStorage.removeItem("user");
              navigate("/login");
              return;
            }
            
            // Se é primeiro login após atualização, mostrar melhorias
            setShouldShowImprovements(true);
          }
        }
      } else {
        // Criar documento de versão se não existir
        await updateDoc(doc(db, "system", "version"), {
          version: "1.0.0",
          improvements: "Versão inicial do sistema",
          updatedAt: new Date()
        });
      }
    });

    return () => unsubscribeVersion();
  }, [navigate]);

  const updateUserVersion = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    try {
      await updateDoc(doc(db, "users", user.id), {
        currentVersion: currentSystemVersion,
        lastVersionUpdate: new Date()
      });
      setUserVersion(currentSystemVersion);
      setShouldShowImprovements(false);
    } catch (error) {
      console.error("Erro ao atualizar versão do usuário:", error);
    }
  };

  return {
    currentSystemVersion,
    userVersion,
    shouldShowImprovements,
    improvements,
    updateUserVersion,
    setShouldShowImprovements
  };
};
