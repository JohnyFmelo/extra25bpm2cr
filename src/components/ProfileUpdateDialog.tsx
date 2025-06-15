
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
interface ProfileUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: {
    id: string;
    email: string;
    warName: string;
    rank?: string;
    registration?: string;
    service?: string;
  };
}
const ProfileUpdateDialog = ({
  open,
  onOpenChange,
  userData
}: ProfileUpdateDialogProps) => {
  const [email, setEmail] = useState(userData?.email || "");
  const [warName, setWarName] = useState(userData?.warName || "");
  const [rank, setRank] = useState(userData?.rank || "");
  const [registration, setRegistration] = useState(userData?.registration || "");
  // const [service, setService] = useState(userData?.service || ""); // Removido
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (userData && open) {
      console.log("ProfileUpdateDialog - Setting form data with:", userData);
      setEmail(userData.email || "");
      setWarName(userData.warName || "");
      setRank(userData.rank || "");
      setRegistration(userData.registration || "");
      // setService(userData.service || ""); // Removido
    }
  }, [userData, open]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", userData.id);
      const updatedData = {
        email,
        warName,
        rank,
        registration,
        // service, // Removido
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updatedData);

      // Update localStorage with the new data
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        ...updatedData
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Force a page reload to update all components with new user data
      window.location.reload();
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar suas informações."
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atualizar Perfil</DialogTitle>
          <DialogDescription className="text-slate-500">
            Faça as alterações necessárias no seu perfil
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warName">Nome de Guerra</Label>
            <Input id="warName" value={warName} onChange={e => setWarName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rank">Graduação</Label>
            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua graduação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sd PM">Sd PM</SelectItem>
                <SelectItem value="Cb PM">Cb PM</SelectItem>
                <SelectItem value="3° Sgt PM">3° Sgt PM</SelectItem>
                <SelectItem value="2° Sgt PM">2° Sgt PM</SelectItem>
                <SelectItem value="1° Sgt PM">1° Sgt PM</SelectItem>
                <SelectItem value="Sub Ten PM">Sub Ten PM</SelectItem>
                <SelectItem value="2° Ten PM">2° Ten PM</SelectItem>
                <SelectItem value="1° Ten PM">1° Ten PM</SelectItem>
                <SelectItem value="Cap PM">Cap PM</SelectItem>
                <SelectItem value="Maj PM">Maj PM</SelectItem>
                <SelectItem value="Ten Cel PM">Ten Cel PM</SelectItem>
                <SelectItem value="Cel PM">Cel PM</SelectItem>
                <SelectItem value="Estágio">Estágio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration">Matrícula</Label>
            <Input id="registration" value={registration} onChange={e => setRegistration(e.target.value)} />
          </div>
          {/* O campo de serviço foi removido daqui */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export default ProfileUpdateDialog;
