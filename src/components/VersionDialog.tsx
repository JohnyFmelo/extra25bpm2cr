
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDoc, collection, getDocs } from "firebase/firestore";
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
      await updateDoc(doc(db, "system", "version"), {
        version: newVersion,
        improvements: improvements,
        updatedAt: new Date(),
        updatedBy: JSON.parse(localStorage.getItem("user") || "{}").id
      });

      // Resetar a versão de todos os usuários para forçar novo login
      const usersSnapshot = await getDocs(collection(db, "users"));
      const batch = [];
      
      usersSnapshot.docs.forEach((userDoc) => {
        batch.push(
          updateDoc(doc(db, "users", userDoc.id), {
            currentVersion: "0.0.0" // Versão antiga para forçar atualização
          })
        );
      });

      await Promise.all(batch);

      toast({
        title: "Sucesso",
        description: "Versão atualizada com sucesso! Todos os usuários serão deslogados.",
      });

      // Forçar logout e refresh da página
      localStorage.removeItem("user");
      window.location.reload();
      
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
            <strong>Atenção:</strong> Ao atualizar a versão, todos os usuários serão deslogados automaticamente.
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
