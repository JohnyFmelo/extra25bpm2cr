
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-24 w-auto mix-blend-multiply animate-float drop-shadow-2xl hover:scale-105 transition-transform duration-300" 
          />
          <h1 className="text-2xl font-semibold text-primary text-center">
            Bem-vindo ao Sistema
          </h1>
          <p className="text-gray-600 text-center max-w-sm">
            Faça login ou cadastre-se para acessar o sistema
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-1">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/50 rounded-xl mb-2">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary rounded-lg transition-all duration-300"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary rounded-lg transition-all duration-300"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <LoginForm />
              </div>
            </TabsContent>
            <TabsContent value="register">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <RegisterForm />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} - Sistema de Controle de Viagens</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
