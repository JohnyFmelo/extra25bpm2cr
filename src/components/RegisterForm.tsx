import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [warName, setWarName] = useState("");
  const [registration, setRegistration] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      await addDoc(collection(db, "users"), {
        email,
        warName,
        registration,
        password, // Note: In a production environment, you should hash passwords
        userType,
        createdAt: new Date(),
      });

      toast({
        title: "Usuário cadastrado",
        description: "Cadastro realizado com sucesso!",
        className: "bg-blue-500 text-white",
      });

      // Clear form
      setEmail("");
      setWarName("");
      setRegistration("");
      setPassword("");
      setUserType("user");
      setAdminPassword("");
    } catch (error) {
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