import { Clock, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const BottomBar = () => {
  const navigate = useNavigate();

  const handleClick = (route: string) => {
    if (route === "extra" || route === "editor") {
      toast.info("Funcionalidade em desenvolvimento");
      return;
    }
    navigate(route);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        <button
          onClick={() => handleClick("/hours")}
          className="flex flex-col items-center p-2 text-primary hover:text-primary-light transition-colors"
        >
          <Clock className="h-6 w-6" />
          <span className="text-xs">Horas</span>
        </button>
        <button
          onClick={() => handleClick("extra")}
          className="flex flex-col items-center p-2 text-primary hover:text-primary-light transition-colors"
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Extra</span>
        </button>
        <button
          onClick={() => handleClick("editor")}
          className="flex flex-col items-center p-2 text-primary hover:text-primary-light transition-colors"
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs">Editor</span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;