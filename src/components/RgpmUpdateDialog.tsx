import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RgpmUpdateDialogProps {
  open: boolean;
  onSuccess: () => void;
}

const RgpmUpdateDialog = ({ open, onSuccess }: RgpmUpdateDialogProps) => {
  const { user, setUser } = useUser();
  const [rgpm, setRgpm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRgpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    setRgpm(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (rgpm.length !== 6) {
        toast({
            variant: "destructive",
            title: "Erro de Validação",
            description: "O RGPM deve conter exatamente 6 dígitos numéricos.",
        });
        return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { rgpm });

      const updatedUser = { ...user, rgpm };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      window.dispatchEvent(new CustomEvent('userDataUpdated', { 
        detail: updatedUser 
      }));

      toast({
        title: "Sucesso",
        description: "RGPM atualizado com sucesso.",
      });
      onSuccess();
    } catch (error) {
      console.error("Error updating RGPM:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o RGPM.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Atualizar RGPM</DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-300">
            Para continuar, por favor, informe seu RGPM. Ele deve conter 6 dígitos e não pode ter pontos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="rgpm">RGPM</Label>
            <Input
              id="rgpm"
              value={rgpm}
              onChange={handleRgpmChange}
              placeholder="Digite os 6 dígitos"
              maxLength={6}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RgpmUpdateDialog;
