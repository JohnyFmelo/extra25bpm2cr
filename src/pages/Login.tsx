import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <LoginForm />
            </div>
          </TabsContent>
          <TabsContent value="register">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <RegisterForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;