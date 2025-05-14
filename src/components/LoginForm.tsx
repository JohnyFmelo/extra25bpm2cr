
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { EyeOff, Eye, Mail, Lock } from "lucide-react";
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Check if user is blocked
      if (userData.blocked) {
        toast({
          title: "Usuário Bloqueado",
          description: "Seu usuário está bloqueado. Por favor, contate a P1.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store ALL user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: userDoc.id,
        email: userData.email,
        userType: userData.userType,
        warName: userData.warName,
        registration: userData.registration,
        rank: userData.rank,
        blocked: userData.blocked
      }));

      toast({
        title: "Login realizado",
        description: "Você será redirecionado em instantes.",
        className: "bg-blue-500 text-white",
      });

      // Clear form
      setEmail("");
      setPassword("");

      // Navigate to index page
      navigate("/");

    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary-light transition-colors duration-300"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};

export default LoginForm;
