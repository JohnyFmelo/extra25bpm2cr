
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: {
    id: string;
    email: string;
    warName: string;
    rank?: string;
    registration?: string;
    userType?: string;
    service?: string;
    rgpm?: string;
  } | null;
  onUserUpdated: () => void;
}

const UserDetailsDialog = ({ open, onOpenChange, userData, onUserUpdated }: UserDetailsDialogProps) => {
  const [email, setEmail] = useState("");
  const [warName, setWarName] = useState("");
  const [rank, setRank] = useState("");
  const [registration, setRegistration] = useState("");
  const [userType, setUserType] = useState("");
  const [service, setService] = useState("");
  const [rgpm, setRgpm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userData && open) {
      setEmail(userData.email || "");
      setWarName(userData.warName || "");
      setRank(userData.rank || "");
      setRegistration(userData.registration || "");
      setUserType(userData.userType || "");
      setService(userData.service || "");
      setRgpm(userData.rgpm || "");
    }
  }, [userData, open]);

  const handleRgpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setRgpm(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", userData.id);
      const updatedData = {
        email,
        warName,
        rank,
        registration,
        userType,
        service,
        rgpm,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, updatedData);

      // Update localStorage if the updated user is the currently logged-in user
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id === userData.id) {
        const updatedUser = {
          ...currentUser,
          ...updatedData,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Dispatch custom event to update TopBar and other components
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: updatedUser 
        }));
      }

      toast({
        title: "Sucesso",
        description: "Dados do usuário atualizados com sucesso.",
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os dados do usuário.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warName">Nome de Guerra</Label>
            <Input
              id="warName"
              value={warName}
              onChange={(e) => setWarName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rgpm">RGPM</Label>
            <Input
              id="rgpm"
              value={rgpm}
              onChange={handleRgpmChange}
              placeholder="Digite apenas números"
              maxLength={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rank">Graduação</Label>
            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a graduação" />
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
            <Input
              id="registration"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Inteligência">Inteligência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userType">Tipo de Usuário</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
