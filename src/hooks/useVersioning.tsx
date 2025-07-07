
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  currentVersion?: string;
  [key: string]: any;
}

interface SystemVersionData {
  version: string;
  improvements?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export const useVersioning = () => {
  const [currentSystemVersion, setCurrentSystemVersion] = useState("");
  const [userVersion, setUserVersion] = useState("");
  const [shouldShowImprovements, setShouldShowImprovements] = useState(false);
  const [improvements, setImprovements] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user: UserData = JSON.parse(userStr);
    if (!user.id) return;

    // Listener para mudanças na versão do sistema
    const versionDocRef = doc(db, "system", "version");
    const unsubscribeVersion = onSnapshot(versionDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const systemData = docSnapshot.data() as SystemVersionData;
        const systemVersion = systemData.version || "1.0.0";
        setCurrentSystemVersion(systemVersion);
        setImprovements(systemData.improvements || "");

        // Verificar versão do usuário
        const userDocRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          const currentUserVersion = userData.currentVersion || "0.0.0";
          setUserVersion(currentUserVersion);

          console.log("Versioning check:", { systemVersion, currentUserVersion });

          // Se a versão do sistema é diferente da versão do usuário
          if (systemVersion !== currentUserVersion) {
            // Só faz logout se a versão do usuário for muito antiga (mais de 1 versão atrás)
            // E não é primeira versão (0.0.0)
            if (currentUserVersion !== "0.0.0" && shouldForceLogout(systemVersion, currentUserVersion)) {
              console.log("Forçando logout por versão desatualizada:", { systemVersion, currentUserVersion });
              localStorage.removeItem("user");
              navigate("/login");
              return;
            }
            
            // Se é primeiro login após atualização, mostrar melhorias
            if (currentUserVersion === "0.0.0") {
              setShouldShowImprovements(true);
            }
          }
        }
      } else {
        // Criar documento de versão se não existir
        const versionDocRef = doc(db, "system", "version");
        await setDoc(versionDocRef, {
          version: "1.0.0",
          improvements: "Versão inicial do sistema",
          updatedAt: new Date()
        });
      }
    });

    return () => unsubscribeVersion();
  }, [navigate]);

  const updateUserVersion = async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user: UserData = JSON.parse(userStr);
    if (!user.id) return;

    try {
      const userDocRef = doc(db, "users", user.id);
      await setDoc(userDocRef, {
        currentVersion: currentSystemVersion,
        lastVersionUpdate: new Date()
      }, { merge: true });
      setUserVersion(currentSystemVersion);
      setShouldShowImprovements(false);
    } catch (error) {
      console.error("Erro ao atualizar versão do usuário:", error);
    }
  };

  // Função para determinar se deve forçar logout baseado na diferença de versão
  const shouldForceLogout = (systemVersion: string, userVersion: string): boolean => {
    // Se as versões são exatamente iguais, não faz logout
    if (systemVersion === userVersion) return false;
    
    // Se versão do sistema é menor que a do usuário, não faz logout (rollback)
    if (compareVersions(systemVersion, userVersion) < 0) return false;
    
    // Só faz logout se a diferença for maior que uma versão patch (ex: 1.0.0 vs 1.0.2+)
    const versionDiff = getVersionDifference(systemVersion, userVersion);
    return versionDiff.major > 0 || versionDiff.minor > 0 || versionDiff.patch > 1;
  };

  const compareVersions = (a: string, b: string): number => {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }
    return 0;
  };

  const getVersionDifference = (newer: string, older: string) => {
    const partsNewer = newer.split('.').map(Number);
    const partsOlder = older.split('.').map(Number);
    
    return {
      major: (partsNewer[0] || 0) - (partsOlder[0] || 0),
      minor: (partsNewer[1] || 0) - (partsOlder[1] || 0),
      patch: (partsNewer[2] || 0) - (partsOlder[2] || 0),
    };
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
