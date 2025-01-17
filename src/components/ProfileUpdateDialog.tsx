import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: {
    id: string;
    email: string;
    warName: string;
    rank: string;
    registration: string;
  };
}

const ProfileUpdateDialog = ({ open, onOpenChange, userData }: ProfileUpdateDialogProps) => {
  const [email, setEmail] = useState(userData.email);
  const [warName, setWarName] = useState(userData.warName);
  const [rank, setRank] = useState(userData.rank);
  const [registration, setRegistration] = useState(userData.registration);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const ranks = [
    "Cel PM",
    "Ten Cel PM",
    "Maj PM",
    "Cap PM",
    "1° Ten PM",
    "2° Ten PM",
    "Sub Ten PM",
    "1° Sgt PM",
    "2° Sgt PM",
    "3° Sgt PM",
    "Cb PM",
    "Sd PM"
  ];

  useEffect(() => {
    setEmail(userData.email);
    setWarName(userData.warName);
    setRank(userData.rank);
    setRegistration(userData.registration);
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", userData.id);
      await updateDoc(userRef, {
        email,
        warName,
        rank,
        registration
      });

      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso",
        className: "bg-blue-500 text-white",
      });
      onOpenChange(false);
      
      // Update localStorage with new data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        email,
        warName,
        rank,
      }));
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="warName" className="block text-sm font-medium text-gray-700">
              Nome de Guerra
            </label>
            <Input
              id="warName"
              type="text"
              value={warName}
              onChange={(e) => setWarName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
              Graduação
            </label>
            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a graduação" />
              </SelectTrigger>
              <SelectContent>
                {ranks.map((rankOption) => (
                  <SelectItem key={rankOption} value={rankOption}>
                    {rankOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="registration" className="block text-sm font-medium text-gray-700">
              Matrícula
            </label>
            <Input
              id="registration"
              type="text"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Atualizando..." : "Atualizar Dados"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileUpdateDialog;