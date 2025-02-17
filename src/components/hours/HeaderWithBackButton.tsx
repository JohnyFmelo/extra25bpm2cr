
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeaderWithBackButton = () => {
  const navigate = useNavigate();

  return (
    <div className="relative h-12">
      <div className="absolute right-0 top-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
          aria-label="Voltar para home"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
