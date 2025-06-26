
import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

interface ConvocacaoModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  deadline: string;
  onResponse?: () => void;
}

const ConvocacaoModal = ({ open, onClose, user, deadline, onResponse }: ConvocacaoModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days} dias`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes} minutos`);
        }
      } else {
        setTimeLeft("Prazo expirado");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [open, deadline]);

  const handleResponse = async (isVolunteer: boolean) => {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.id);
      const updateData = {
        SouVoluntario: isVolunteer,
        dataResposta: new Date().toISOString()
      };
      
      await updateDoc(userRef, updateData);

      // Update localStorage immediately
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Dispatch event for immediate UI updates
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));

      toast({
        title: "Resposta registrada",
        description: `Sua resposta foi salva: ${isVolunteer ? "SIM, SOU VOLUNTÁRIO" : "NÃO SOU VOLUNTÁRIO"}`
      });

      // Call onResponse callback to hide modal immediately
      if (onResponse) {
        onResponse();
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar sua resposta. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-5">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/20 relative">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600"></div>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-gray-600 text-lg transition-all duration-300 hover:scale-110 z-10"
        >
          ×
        </button>

        {/* Header */}
        <div className="pt-8 pb-5 px-6 text-center relative">
          <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-semibold mb-4 shadow-lg">
            🚨 CONVOCAÇÃO EXTRA
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Serviço Extraordinário
          </h1>
          <p className="text-gray-600 text-sm font-medium capitalize">{currentMonth}</p>
        </div>

        {/* Timer */}
        <div className="mx-6 mb-6 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-2xl p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/></svg>')}")`,
            backgroundSize: '60px 60px'
          }}></div>
          <div className="relative z-10">
            <div className="text-2xl mb-2">⏰</div>
            <div className="text-orange-800 font-semibold text-sm">
              Prazo para resposta: {timeLeft}
            </div>
          </div>
        </div>

        {/* Warning card */}
        <div className="mx-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-white/10 to-transparent animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <span className="text-xl mr-2">⚠️</span>
                <span className="text-sm font-bold">LEIA COM ATENÇÃO</span>
              </div>
              <div className="text-xs leading-relaxed opacity-95">
                O militar que se manifestar como <strong>VOLUNTÁRIO</strong> poderá ser escalado 
                independente de comunicação prévia no período de folga, conforme necessidade 
                do serviço. Esta decisão é definitiva e vinculativa.
                <br /><br />
                <strong>IMPORTANTE:</strong> Faltas injustificadas resultarão na suspensão da 
                extraordinária do mês, salvo necessidade da Administração.
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-6 px-6">
          <div className="text-lg font-semibold text-gray-800 mb-2">
            Você aceita ser voluntário?
          </div>
          <div className="text-xs text-gray-600">
            Sua resposta será registrada no sistema
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => handleResponse(true)}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl py-4 px-6 text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
            <span className="text-lg">✅</span>
            <span>SIM, SOU VOLUNTÁRIO</span>
          </button>
          
          <button
            onClick={() => handleResponse(false)}
            disabled={isLoading}
            className="w-full bg-white text-gray-600 border-2 border-gray-300 rounded-2xl py-4 px-6 text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
            <span className="text-lg">❌</span>
            <span>NÃO SOU VOLUNTÁRIO</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-5 px-6 bg-black/5 border-t border-black/10">
          <div className="text-xs text-gray-500 leading-relaxed">
            Sistema TCG • Sua resposta será registrada automaticamente
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvocacaoModal;
