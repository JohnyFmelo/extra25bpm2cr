
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/TopBar";
import BottomMenuBar from "@/components/BottomMenuBar";
import TimeSlotsList from "@/components/TimeSlotsList";
import NotificationsDialog from "@/components/NotificationsDialog";
import ConvocacaoDialog from "@/components/ConvocacaoDialog";
import ConvocacaoResponseDialog from "@/components/ConvocacaoResponseDialog";
import { UserPlus, Calendar, Settings } from "lucide-react";
import { useConvocation } from "@/hooks/useConvocation";

const Index = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConvocacao, setShowConvocacao] = useState(false);

  // Get user data from localStorage
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userEmail = userData?.email || '';
  const userName = userData?.warName ? `${userData.rank || ''} ${userData.warName}`.trim() : '';
  const isAdmin = userData?.userType === 'admin';

  // Use convocation hook
  const {
    activeConvocation,
    loading: convocationLoading,
    shouldShowDialog,
    setShouldShowDialog,
    markAsResponded
  } = useConvocation(userEmail);

  const handleConvocacaoResponse = () => {
    markAsResponded();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Painel de Controle
            </h1>
            <p className="text-gray-600">
              Gerencie horários e escala de serviços
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Button 
              onClick={() => setShowNotifications(true)}
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Calendar className="h-6 w-6" />
              <span>Notificações</span>
            </Button>
            
            {isAdmin && (
              <Button 
                onClick={() => setShowConvocacao(true)}
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span>Convocação Extra</span>
              </Button>
            )}
          </div>

          {/* Time Slots List */}
          <TimeSlotsList />
        </div>
      </main>

      <BottomMenuBar />

      {/* Dialogs */}
      <NotificationsDialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications} 
      />
      
      {isAdmin && (
        <ConvocacaoDialog 
          open={showConvocacao} 
          onOpenChange={setShowConvocacao} 
        />
      )}

      {/* Convocation Response Dialog */}
      {!convocationLoading && shouldShowDialog && activeConvocation && (
        <ConvocacaoResponseDialog
          open={shouldShowDialog}
          onOpenChange={(open) => {
            // Só permite fechar se o usuário já respondeu
            if (!open) {
              setShouldShowDialog(false);
            }
          }}
          convocation={activeConvocation}
          userEmail={userEmail}
          userName={userName}
        />
      )}
    </div>
  );
};

export default Index;
