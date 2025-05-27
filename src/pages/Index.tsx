import { Users, MessageSquare, Plus, ArrowLeft, RefreshCw, LogOut, CalendarDays, Clock, MapPin, Calendar, Navigation } from "lucide-react";
// IconCard não está sendo usado diretamente, mas pode ser usado por subcomponentes. Mantendo por precaução.
// import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import InformationDialog from "@/components/InformationDialog";
import NotificationsList, { useNotifications } from "@/components/NotificationsList";
import { TravelManagement } from "@/components/TravelManagement";
import { useToast } from "@/hooks/use-toast";
import TCOForm from "@/components/TCOForm";
import TCOmeus from "@/components/tco/TCOmeus";
import { Button } from "@/components/ui/button";
import BottomMenuBar from "@/components/BottomMenuBar";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// Users as UsersIcon já está importado como Users. Mantendo apenas um.
import UpcomingShifts from "@/components/UpcomingShifts";
import MonthlyHoursSummary from "@/components/MonthlyHoursSummary";
import ActiveTrips from "@/components/ActiveTrips";
import MonthlyExtraCalendar from "@/components/MonthlyExtraCalendar";
import RankingChart from "@/components/RankingChart";

interface IndexProps {
  initialActiveTab?: string;
}

const Index = ({ initialActiveTab = "main" }: IndexProps) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [travelTab, setTravelTab] = useState("trips");
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications();
  const navigate = useNavigate();

  const [selectedTco, setSelectedTco] = useState<any>(null);
  const [tcoTab, setTcoTab] = useState("list");

  useEffect(() => {
    const handleNotificationsChange = (count: number) => {
      setHasNotifications(count > 0);
    };
    if (unreadCount > 0) {
      setHasNotifications(true);
    }
    const eventListener = (e: Event) => handleNotificationsChange((e as CustomEvent).detail.count);
    window.addEventListener('notificationsUpdate', eventListener);
    return () => {
      window.removeEventListener('notificationsUpdate', eventListener);
    };
  }, [unreadCount]);

  useEffect(() => {
    const today = new Date();
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef, where("archived", "==", false));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const trips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((trip: any) => {
        const startDate = new Date(trip.startDate + "T00:00:00");
        const endDate = new Date(trip.endDate + "T00:00:00");
        return today <= endDate && (today < startDate && !trip.isLocked || today >= startDate && today <= endDate);
      }).sort((a: any, b: any) => {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
      setActiveTrips(trips);
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
    toast({
      title: "Atualizando",
      description: "Recarregando dados do sistema."
    });
  };

  const handleEditorClick = () => {
    setActiveTab("editor");
  };

  const handleBackClick = () => {
    if (activeTab === "editor") {
      setActiveTab("extra");
    } else if (activeTab === "users") {
      setActiveTab("settings"); // Voltar de 'users' para 'settings'
    } else if (activeTab === "settings" || activeTab === "travel" || activeTab === "tco" || activeTab === "notifications" /* Adicione outras abas que voltam para main */) {
      setActiveTab("main");
    } else {
      // Comportamento padrão de voltar para 'main' se não for um dos casos acima
      // ou se já estiver em 'main' (o que não mudaria nada)
      setActiveTab("main");
    }
  };

  // handleSettingsClick e handleTravelClick não são estritamente necessárias se o BottomMenuBar
  // já chama handleTabChange com 'settings' ou 'travel'.
  // Elas poderiam ser usadas por outros botões específicos se existirem.
  // const handleSettingsClick = () => {
  //   setActiveTab("settings");
  // };

  // const handleTravelClick = () => {
  //   setActiveTab("travel");
  // };

  // handleTCOClick é usado pelo BottomMenuBar para lógica específica de TCO
  const handleTCOClick = () => {
    if (user.userType === "admin") {
      setActiveTab("tco");
    } else {
      toast({
        variant: "warning",
        title: "Funcionalidade Restrita",
        description: "O módulo TCO está em desenvolvimento e disponível apenas para administradores."
      });
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
    setShowLogoutDialog(false);
  };

  const handleTabChange = (targetTab: string) => {
    // !! PONTO CRÍTICO PARA DEBUG !!
    // Verifique o valor de 'targetTab' no console do navegador quando você está na aba "editor"
    // e clica no item "Extra" do BottomMenuBar.
    //
    // - Se o console mostrar: "handleTabChange: Tentando ir para 'extra'. Aba atual: 'editor'"
    //   E a aba NÃO mudar para 'extra', então o problema pode estar no useEffect de initialActiveTab
    //   (ver console.log lá) ou em alguma outra re-renderização que redefine a aba.
    //
    // - Se o console mostrar: "handleTabChange: Tentando ir para 'editor'. Aba atual: 'editor'"
    //   Então o PROBLEMA ESTÁ NO COMPONENTE BottomMenuBar. Ele está enviando o nome da aba
    //   ATUAL ('editor') em vez do nome da aba de DESTINO ('extra').
    //   Nesse caso, você PRECISA CORRIGIR o BottomMenuBar para que, ao clicar em "Extra",
    //   ele chame props.onTabChange('extra').
    console.log(`handleTabChange: Tentando ir para '${targetTab}'. Aba atual: '${activeTab}'`);

    if (targetTab === 'hours') {
      navigate('/hours');
    } else if (targetTab === 'extra') {
      // Se o BottomMenuBar (ou outra fonte) chamou com 'extra', definimos a aba ativa como 'extra'.
      setActiveTab('extra');
    } else if (targetTab === 'tco') {
      // A função handleTCOClick já tem essa lógica, mas se for chamada diretamente por
      // handleTabChange (ex: BottomMenuBar passa 'tco' diretamente), precisa da verificação.
      if (user.userType === "admin") {
        setActiveTab(targetTab);
      } else {
        toast({
          variant: "warning",
          title: "Funcionalidade Restrita",
          description: "O módulo TCO está em desenvolvimento e disponível apenas para administradores."
        });
        return; // Impede a mudança de aba se não for admin e o alvo for 'tco'
      }
    } else {
      // Para todas as outras abas ('main', 'settings', 'notifications', 'travel', 'users', 'editor')
      setActiveTab(targetTab);
    }
  };

  useEffect(() => {
    // Este useEffect sincroniza o activeTab com a prop initialActiveTab.
    // Se initialActiveTab mudar DEPOIS da montagem inicial, activeTab será atualizado.
    // Se, após handleTabChange definir a aba para 'extra', esta prop initialActiveTab
    // for (ou mudar para) 'editor', ela pode reverter a mudança.
    // Verifique se initialActiveTab está se comportando como esperado.
    if (initialActiveTab && initialActiveTab !== activeTab) {
      console.log(`useEffect[initialActiveTab, activeTab]: initialActiveTab ('${initialActiveTab}') é diferente de activeTab ('${activeTab}'). Mudando activeTab para initialActiveTab ('${initialActiveTab}').`);
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab, activeTab]);

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      <div className="flex-grow w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 flex flex-col flex-grow py-0">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
            <TabsTrigger value="tco">TCO</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="flex-grow">
            <div className="space-y-8">
              {hasNotifications && <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-amber-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-2">
                      <CalendarDays className="h-5 w-5 text-amber-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
                    </div>
                    <NotificationsList showOnlyUnread={true} />
                  </CardContent>
                </Card>}
              <MonthlyHoursSummary />
              <MonthlyExtraCalendar />
              <UpcomingShifts />
              <ActiveTrips trips={activeTrips} onTravelClick={() => handleTabChange("travel")} />
            </div>
          </TabsContent>

          <TabsContent value="extra">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                {/* Espaço para botões, se necessário */}
              </div>
              {user.userType === "admin" && (
                <div className="fixed bottom-8 right-8 z-10">
                  <Button onClick={handleEditorClick} className="fixed bottom-6 right-6 rounded-full p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 my-[69px] mx-0 px-[18px] py-[26px] bg-green-500 hover:bg-green-400" aria-label="Adicionar ou editar horários">
                    <Plus className="h-8 w-8" />
                  </Button>
                </div>
              )}
              <TimeSlotsList />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} aria-label="Voltar para tela principal" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-blue-600">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => setShowProfileDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <h3 className="font-semibold text-gray-800">Alterar Cadastro</h3>
                      <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
                    </button>
                    <button onClick={() => setShowPasswordDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <h3 className="font-semibold text-gray-800">Alterar Senha</h3>
                      <p className="text-sm text-gray-600">Modifique sua senha de acesso</p>
                    </button>
                    <button onClick={() => setShowInformationDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <h3 className="font-semibold text-gray-800">Informações</h3>
                      <p className="text-sm text-gray-600">Visualize a estrutura funcional do sistema</p>
                    </button>
                    <button onClick={handleRefresh} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Atualizar</h3>
                      </div>
                      <p className="text-sm text-gray-600">Recarregar dados do sistema</p>
                    </button>
                    {user.userType === "admin" && (
                      <button onClick={() => setActiveTab("users")} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-800">Usuários</h3>
                        </div>
                        <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                      </button>
                    )}
                    <button onClick={() => setShowLogoutDialog(true)} className="p-4 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-red-500">Sair</h3>
                      </div>
                      <p className="text-sm text-red-600">Encerrar a sessão atual</p>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700" aria-label="Voltar para aba extra">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <WeeklyCalendar isLocked={isLocked} onLockChange={setIsLocked} currentDate={currentDate} onDateChange={setCurrentDate} showControls={true} />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700" aria-label="Voltar para configurações">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <UsersList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="travel">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} aria-label="Voltar para tela principal" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-blue-600">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-6 my-0 mx-0 px-[9px] py-[13px]">
                  <Tabs value={travelTab} onValueChange={setTravelTab} className="w-full">
                    <TabsList className="w-full mb-6 justify-between py-[20px] my-[11px]">
                      <TabsTrigger value="trips" className="flex-1">Viagens</TabsTrigger>
                      <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="trips" className="mt-0">
                      <TravelManagement />
                    </TabsContent>
                    
                    <TabsContent value="ranking" className="mt-0">
                      <RankingChart />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tco" className="flex flex-col flex-grow">
            <div className="flex flex-col flex-grow">
              <div className="relative">
                <div className="absolute right-0 -top-14">
                  <button onClick={handleBackClick} aria-label="Voltar para tela principal" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-blue-600">
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                </div>
                <Tabs value={tcoTab} onValueChange={setTcoTab} className="space-y-6 flex flex-col flex-grow">
                  <TabsList className="shadow-md rounded-lg p-4 flex justify-center gap-4 py-[24px] px-[6px] bg-gray-100">
                    <TabsTrigger value="list" aria-label="Visualizar Meus TCOs" className="flex-1 py-3 px-4 rounded-md text-gray-800 font-medium bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-center">
                      Meus TCOs
                    </TabsTrigger>
                    <TabsTrigger value="form" aria-label="Criar ou editar TCO" onClick={() => setSelectedTco(null)} className="flex-1 py-3 px-4 rounded-md text-gray-800 font-medium bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-center">
                      Novo TCO
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="flex-grow">
                    <Card className="shadow-md">
                      <CardContent className="p-6 px-[9px]">
                        <TCOmeus user={user} toast={toast} setSelectedTco={setSelectedTco} selectedTco={selectedTco} setTcoTab={setTcoTab} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="form" className="flex-grow">
                    <Card className="shadow-md">
                      <CardContent className="p-6 px-0">
                        <TCOForm selectedTco={selectedTco} onFormSubmit={() => setTcoTab("list")} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProfileUpdateDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} userData={user} />
      <PasswordChangeDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} userId={user.id || ''} currentPassword="" />
      <InformationDialog open={showInformationDialog} onOpenChange={setShowInformationDialog} isAdmin={user.userType === 'admin'} />
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar logout</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/*
        CRUCIAL: Verifique a implementação do BottomMenuBar.
        Para o botão "Extra", ele DEVE chamar props.onTabChange('extra').
        Use o console.log em handleTabChange para verificar o valor recebido.
        A função handleTCOClick é específica para o botão TCO se ele tiver lógica especial.
        Os outros botões do BottomMenuBar devem chamar onTabChange com o nome da aba destino.
      */}
      <BottomMenuBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onTCOClick={handleTCOClick} // Se o TCO tiver um handler dedicado no BottomMenuBar
        isAdmin={user?.userType === 'admin'} 
      />
    </div>
  );
};

export default Index;
