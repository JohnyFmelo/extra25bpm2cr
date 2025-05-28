import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentPassword: string;
}
const PasswordChangeDialog = ({
  open,
  onOpenChange,
  userId,
  currentPassword
}: PasswordChangeDialogProps) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== currentPassword) {
      toast({
        title: "Erro",
        description: "Senha atual incorreta",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        password: newPassword
      });
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso"
      });
      onOpenChange(false);
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 py-[4px]">
              Senha Atual
            </label>
            <Input id="old-password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 py-0">
              Nova Senha
            </label>
            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};
export default PasswordChangeDialog;