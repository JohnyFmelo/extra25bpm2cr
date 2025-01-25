import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

const Login = () => {
  return (
    <div className="min-h-screen bg-[#E8F1F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-primary"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <LoginForm />
            </div>
          </TabsContent>
          <TabsContent value="register">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <RegisterForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
