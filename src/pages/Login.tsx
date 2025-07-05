
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-24 w-auto mix-blend-multiply animate-float drop-shadow-2xl hover:scale-105 transition-transform duration-300" 
          />
          <h1 className="text-2xl font-semibold text-primary text-center">
            Bem-vindo ao Sistema Extra+
          </h1>
          <p className="text-gray-600 text-center max-w-sm">
            {isRegister ? "Cadastre-se para acessar o sistema" : "Faça login para acessar o sistema"}
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
            <Button
              type="button"
              variant={!isRegister ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setIsRegister(false)}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={isRegister ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setIsRegister(true)}
            >
              Cadastro
            </Button>
          </div>
          
          {isRegister ? <RegisterForm /> : <LoginForm />}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} - Sistema de Controle de Extraodinária e Viagens</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
