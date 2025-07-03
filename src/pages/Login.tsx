import LoginForm from "@/components/LoginForm";

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
            Bem-vindo ao Sistema Extra+
          </h1>
          <p className="text-gray-600 text-center max-w-sm">
            Faça login para acessar o sistema
          </p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <LoginForm />
        </div>

        <div className="text-center text-sm text-gray-600">
          {/* --- CORRECTED LINE BELOW --- */}
          <p>Sistema de Controle de Extraordinária, Viagens e TCO</p>
          {/* This might be a version number, which is fine. If it's a placeholder, consider removing it. */}
          <p>© 16.01.2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
