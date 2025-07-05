import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { EyeOff, Eye, Mail, Lock, User, Shield, Badge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [warName, setWarName] = useState("");
  const [registration, setRegistration] = useState("");
  const [rank, setRank] = useState("");
  const [userType, setUserType] = useState("user");
  const [service, setService] = useState("");
  const [rgpm, setRgpm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            war_name: warName,
            registration,
            rank,
            user_type: userType,
            service,
            rgpm,
            is_volunteer: false
          }
        }
      });

      if (error) {
        console.error("Register error:", error);
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cadastro realizado",
        description: "Verifique seu email para confirmar a conta.",
        className: "bg-green-500 text-white",
      });

      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setWarName("");
      setRegistration("");
      setRank("");
      setUserType("user");
      setService("");
      setRgpm("");

    } catch (error) {
      console.error("Register error:", error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao tentar fazer o cadastro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="warName" className="block text-sm font-medium text-gray-700">
            Nome de Guerra
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="warName"
              type="text"
              value={warName}
              onChange={(e) => setWarName(e.target.value)}
              required
              className="pl-10"
              placeholder="Nome de guerra"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="registration" className="block text-sm font-medium text-gray-700">
            Matrícula
          </label>
          <div className="relative">
            <Badge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="registration"
              type="text"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              required
              className="pl-10"
              placeholder="Matrícula"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
            Graduação
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="rank"
              type="text"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              required
              className="pl-10"
              placeholder="Graduação"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
            Tipo de Usuário
          </label>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="service" className="block text-sm font-medium text-gray-700">
            Serviço
          </label>
          <Input
            id="service"
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Serviço (opcional)"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="rgpm" className="block text-sm font-medium text-gray-700">
            RGPM
          </label>
          <Input
            id="rgpm"
            type="text"
            value={rgpm}
            onChange={(e) => setRgpm(e.target.value)}
            placeholder="RGPM (opcional)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            placeholder="Digite seu email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            placeholder="Digite sua senha"
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

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmar Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10"
            placeholder="Confirme sua senha"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary-light transition-colors duration-300"
        disabled={isLoading}
      >
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
};

export default RegisterForm;