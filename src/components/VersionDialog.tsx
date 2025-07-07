
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface VersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VersionDialog = ({ open, onOpenChange }: VersionDialogProps) => {
  const [currentVersion, setCurrentVersion] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCurrentVersion();
    }
  }, [open]);

  const loadCurrentVersion = async () => {
    try {
      const versionDoc = await getDoc(doc(db, "system", "version"));
      if (versionDoc.exists()) {
        const data = versionDoc.data();
        setCurrentVersion(data.version || "1.0.0");
        setNewVersion(data.version || "1.0.0");
        setImprovements(data.improvements || "");
      } else {
        setCurrentVersion("1.0.0");
        setNewVersion("1.0.0");
      }
    } catch (error) {
      console.error("Erro ao carregar versão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a versão atual.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateVersion = async () => {
    if (!newVersion.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma versão válida.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar a versão do sistema
      await setDoc(doc(db, "system", "version"), {
        version: newVersion,
        improvements: improvements,
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem("user") || "{}").id
      });

      // Resetar a versão de todos os usuários apenas se for uma atualização major
      if (shouldForceGlobalLogout(currentVersion, newVersion)) {
        console.log("Forçando logout global devido a atualização major:", { currentVersion, newVersion });
        const usersSnapshot = await getDocs(collection(db, "users"));
        const batch = [];
        
        usersSnapshot.docs.forEach((userDoc) => {
          batch.push(
            setDoc(doc(db, "users", userDoc.id), {
              ...userDoc.data(),
              currentVersion: "0.0.0" // Versão antiga para forçar atualização
            })
          );
        });

        await Promise.all(batch);

        toast({
          title: "Sucesso",
          description: "Versão atualizada com sucesso! Todos os usuários serão deslogados devido à grande atualização.",
        });

        // Forçar logout e refresh da página
        localStorage.removeItem("user");
        window.location.reload();
      } else {
        toast({
          title: "Sucesso", 
          description: "Versão atualizada com sucesso! Usuários verão as melhorias no próximo login.",
        });
        
        onOpenChange(false);
      }
      
    } catch (error) {
      console.error("Erro ao atualizar versão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a versão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para determinar se uma atualização requer logout global
  const shouldForceGlobalLogout = (oldVersion: string, newVersion: string): boolean => {
    const parseVersion = (version: string) => {
      const parts = version.split('.').map(Number);
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
    };

    const oldV = parseVersion(oldVersion);
    const newV = parseVersion(newVersion);

    // Força logout apenas se mudou versão major ou minor significativa
    return newV.major > oldV.major || (newV.major === oldV.major && newV.minor > oldV.minor + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Versão do Sistema</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Versão Atual</Label>
            <Input value={currentVersion} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label>Nova Versão</Label>
            <Input
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="Ex: 1.0.1"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Melhorias Implementadas</Label>
            <Textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Descreva as melhorias e novidades desta versão..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
            <strong>Atenção:</strong> Atualizações major (ex: 1.0.0 → 2.0.0) ou minor significativas (ex: 1.0.0 → 1.2.0) farão logout automático de todos os usuários. Atualizações patch (ex: 1.0.0 → 1.0.1) não deslogam usuários.
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateVersion}
            disabled={isLoading || !newVersion.trim()}
          >
            {isLoading ? "Atualizando..." : "Atualizar Versão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VersionDialog;
