
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

interface ForcePasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const ForcePasswordResetDialog = ({
  open,
  onOpenChange,
  userId,
}: ForcePasswordResetDialogProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
        toast({
            title: "Erro",
            description: "A senha deve ter no mínimo 6 caracteres.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        password: newPassword,
        passwordReset: false,
      });

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id === userId) {
        user.password = newPassword;
        user.passwordReset = false;
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: user }));
      }

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso. Você será redirecionado.",
      });

      onOpenChange(false);
      navigate('/');
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
          <DialogDescription>
            Sua senha foi resetada pelo administrador. Por favor, defina uma nova senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1">
            <label htmlFor="new-password">Nova Senha</label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Digite sua nova senha"
              />
               <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-password">Confirmar Nova Senha</label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirme sua nova senha"
              />
               <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForcePasswordResetDialog;
