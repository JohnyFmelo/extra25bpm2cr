import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [warName, setWarName] = useState("");
  const [rank, setRank] = useState("");
  const [registration, setRegistration] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [adminPassword, setAdminPassword] = useState("");
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
    "Sd PM
    "Estágio:"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (userType === "admin" && adminPassword !== "010355") {
      toast({
        title: "Erro no cadastro",
        description: "Senha de administrador incorreta.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      
      // Verificar se já existe um usuário com a mesma matrícula
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("registration", "==", registration));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          title: "Erro no cadastro",
          description: "Já existe um usuário com esta matrícula.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Criar novo usuário com todos os dados necessários
      const userData = {
        email,
        warName,
        rank,
        registration,
        password,
        userType,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "users"), userData);
      console.log("Usuário cadastrado com ID:", docRef.id);

      toast({
        title: "Usuário cadastrado",
        description: "Cadastro realizado com sucesso!",
        className: "bg-blue-500 text-white",
      });

      // Clear form
      setEmail("");
      setWarName("");
      setRank("");
      setRegistration("");
      setPassword("");
      setUserType("user");
      setAdminPassword("");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao realizar o cadastro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="war-name" className="block text-sm font-medium text-gray-700">
          Nome de Guerra
        </label>
        <Input
          id="war-name"
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
        <Select value={rank} onValueChange={setRank} required>
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
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Usuário
        </label>
        <RadioGroup value={userType} onValueChange={setUserType} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="user" id="user" />
            <Label htmlFor="user">Usuário</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="admin" id="admin" />
            <Label htmlFor="admin">Administrador</Label>
          </div>
        </RadioGroup>
      </div>
      {userType === "admin" && (
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
            Senha do Administrador
          </label>
          <Input
            id="admin-password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
};

export default RegisterForm;
