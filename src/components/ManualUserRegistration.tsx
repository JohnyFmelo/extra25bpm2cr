
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManualUserRegistration = () => {
  const [email, setEmail] = useState("");
  const [warName, setWarName] = useState("");
  const [rank, setRank] = useState("");
  const [registration, setRegistration] = useState("");
  const [rgpm, setRgpm] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [service, setService] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const ranks = ["Cel PM", "Ten Cel PM", "Maj PM", "Cap PM", "1° Ten PM", "2° Ten PM", "Sub Ten PM", "1° Sgt PM", "2° Sgt PM", "3° Sgt PM", "Cb PM", "Sd PM", "Estágio"];

  const handleRgpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric digits
    if (/^\d*$/.test(value)) {
      setRgpm(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (!email || !warName || !rank || !registration || !rgpm || !password) {
      toast({
        title: "Erro no cadastro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
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
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Verificar se já existe um usuário com o mesmo RGPM
      const rgpmQuery = query(usersRef, where("rgpm", "==", rgpm));
      const rgpmSnapshot = await getDocs(rgpmQuery);
      
      if (!rgpmSnapshot.empty) {
        toast({
          title: "Erro no cadastro",
          description: "Já existe um usuário com este RGPM.",
          variant: "destructive"
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
        rgpm,
        password,
        userType,
        service,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, "users"), userData);
      console.log("Usuário cadastrado com ID:", docRef.id);

      toast({
        title: "Usuário cadastrado",
        description: "Cadastro realizado com sucesso!",
        className: "bg-blue-500 text-white"
      });

      // Clear form
      setEmail("");
      setWarName("");
      setRank("");
      setRegistration("");
      setRgpm("");
      setPassword("");
      setUserType("user");
      setService("");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao realizar o cadastro.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastro Novos Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="register-email">Email *</Label>
            <Input 
              id="register-email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="war-name">Nome de Guerra *</Label>
            <Input 
              id="war-name" 
              type="text" 
              value={warName} 
              onChange={e => setWarName(e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="rank">Graduação *</Label>
            <Select value={rank} onValueChange={setRank} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a graduação" />
              </SelectTrigger>
              <SelectContent>
                {ranks.map(rankOption => 
                  <SelectItem key={rankOption} value={rankOption}>
                    {rankOption}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="registration">Matrícula *</Label>
            <Input 
              id="registration" 
              type="text" 
              value={registration} 
              onChange={e => setRegistration(e.target.value)} 
              required 
            />
          </div>

          <div>
            <Label htmlFor="rgpm">RGPM *</Label>
            <Input 
              id="rgpm" 
              type="text" 
              value={rgpm} 
              onChange={handleRgpmChange}
              placeholder="Digite apenas números"
              required 
            />
          </div>
          
          <div>
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
          
          <div>
            <Label htmlFor="register-password">Senha *</Label>
            <Input 
              id="register-password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tipo de Usuário *</Label>
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
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Cadastrando..." : "Cadastrar Usuário"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualUserRegistration;
