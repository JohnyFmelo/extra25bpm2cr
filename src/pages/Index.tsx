import { Users, MessageSquare, Plus, ArrowLeft, RefreshCw, LogOut, UserPlus } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import InformationDialog from "@/components/InformationDialog";
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
import { Users as UsersIcon, Clock, MapPin, Calendar, Navigation } from "lucide-react";
import UpcomingShifts from "@/components/UpcomingShifts";
import MonthlyHoursSummary from "@/components/MonthlyHoursSummary";
import ActiveTrips from "@/components/ActiveTrips";
import MonthlyExtraCalendar from "@/components/MonthlyExtraCalendar";
import RankingChart from "@/components/RankingChart";
import ManualUserRegistration from "@/components/ManualUserRegistration";
import VersionDialog from "@/components/VersionDialog";
import TCOProductivityRanking from "@/components/TCOProductivityRanking";
import TCONatureRanking from "@/components/TCONatureRanking";
import VolunteersManager from "@/components/VolunteersManager";
import ConvocacaoModal from "@/components/ConvocacaoModal";
import { useConvocation } from "@/hooks/useConvocation";

interface IndexProps {
  initialActiveTab?: string;
}
const Index = ({
  initialActiveTab = "main"
}: IndexProps) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [travelTab, setTravelTab] = useState("trips");
  const [extraSubTab, setExtraSubTab] = useState("extra");
  const {
    toast
  } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  // Use convocation hook
  const {
    showConvocacao,
    setShowConvocacao,
    convocacaoDeadline
  } = useConvocation();

  // States for TCO management
  const [selectedTco, setSelectedTco] = useState<any>(null);
  const [tcoTab, setTcoTab] = useState("list");

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
  const handleExtraClick = () => {
    setActiveTab("extra");
  };
  const handleBackClick = () => {
    if (activeTab === "editor") {
      setActiveTab("extra");
    } else if (activeTab === "register") {
      setActiveTab("settings");
    } else {
      setActiveTab("main");
    }
  };
  const handleSettingsClick = () => {
    setActiveTab("settings");
  };
  const handleTravelClick = () => {
    setActiveTab("travel");
  };
  const handleTCOClick = () => {
    setActiveTab("tco");
  };
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
    setShowLogoutDialog(false);
  };
  const handleTabChange = (tab: string) => {
    if (tab === 'hours') {
      navigate('/hours');
    } else if (tab === 'extra') {
      setActiveTab('extra');
    } else if (tab === 'tco') {
      setActiveTab(tab);
    } else {
      setActiveTab(tab);
    }
  };
  useEffect(() => {
    // Update activeTab when initialActiveTab prop changes
    if (initialActiveTab && initialActiveTab !== activeTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // Standardized class strings
  const tabListClasses = "w-full flex gap-1 rounded-lg p-1 bg-slate-200 mb-4";
  const tabTriggerClasses = "flex-1 text-center py-2.5 px-4 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-700 hover:bg-slate-300/70 data-[state=active]:hover:bg-blue-700/90";
  
  return <div className="relative min-h-screen w-full flex flex-col">
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
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="flex-grow">
            <div className="space-y-8">
              <TCOProductivityRanking />
              <TCONatureRanking />
              <MonthlyHoursSummary />
              <MonthlyExtraCalendar />
              <UpcomingShifts />
              <ActiveTrips trips={activeTrips} onTravelClick={() => handleTabChange("travel")} />
            </div>
          </TabsContent>

          <TabsContent value="extra">
            {user.userType === "admin" ? (
              <Tabs value={extraSubTab} onValueChange={setExtraSubTab} className="w-full">
                <TabsList className={tabListClasses}>
                  <TabsTrigger value="extra" className={tabTriggerClasses}>Extra</TabsTrigger>
                  <TabsTrigger value="volunteers" className={tabTriggerClasses}>Voluntários</TabsTrigger>
                </TabsList>
                <TabsContent value="extra">
                  <div className="relative">
                    <div className="absolute right-0 -top-14">
                    </div>
                      <div className="fixed bottom-8 right-8 z-10">
                        <Button onClick={handleEditorClick} className="fixed bottom-6 right-6 rounded-full p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 my-[69px] mx-0 px-[18px] py-[26px] bg-green-500 hover:bg-green-400">
                          <Plus className="h-8 w-8" />
                        </Button>
                      </div>
                    <TimeSlotsList />
                  </div>
                </TabsContent>
                <TabsContent value="volunteers">
                  <VolunteersManager />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative">
                <div className="absolute right-0 -top-14">
                </div>
                <TimeSlotsList />
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} aria-label="Voltar para home" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-blue-600">
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
                    {user.userType === "admin" && <>
                        <button onClick={() => setActiveTab("users")} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Usuários</h3>
                          </div>
                          <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                        </button>
                        <button onClick={() => setActiveTab("register")} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <UserPlus className="h-5 w-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Cadastro</h3>
                          </div>
                          <p className="text-sm text-gray-600">Cadastrar novos usuários manualmente</p>
                        </button>
                        <button onClick={() => setShowVersionDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="h-5 w-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Versão</h3>
                          </div>
                          <p className="text-sm text-gray-600">Gerenciar versão do sistema</p>
                        </button>
                      </>}
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
              <div className="absolute left-0 -top-14">
                <button onClick={() => setActiveTab("extra")} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700" aria-label="Voltar para aba extra">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <WeeklyCalendar isLocked={isLocked} onLockChange={setIsLocked} currentDate={currentDate} onDateChange={setCurrentDate} showControls={true} />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={() => setActiveTab("settings")} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700" aria-label="Voltar para configurações">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-6 px-[10px] my-0">
                  <UsersList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700" aria-label="Voltar para configurações">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <ManualUserRegistration />
            </div>
          </TabsContent>

          <TabsContent value="travel">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button onClick={handleBackClick} aria-label="Voltar para home" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-blue-600">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-6 my-0 mx-0 px-[9px] py-[13px]">
                  <Tabs value={travelTab} onValueChange={setTravelTab} className="w-full">
                    <TabsList className={tabListClasses}>
                      <TabsTrigger value="trips" className={tabTriggerClasses}>Viagens</TabsTrigger>
                      <TabsTrigger value="ranking" className={tabTriggerClasses}>Ranking</TabsTrigger>
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
                  <button onClick={handleBackClick} aria-label="Voltar para home" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-blue-600">
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                </div>
                <Tabs value={tcoTab} onValueChange={setTcoTab} className="space-y-6 flex flex-col flex-grow">
                  <TabsList className={tabListClasses}>
                    <TabsTrigger value="list" aria-label="Visualizar Meus TCOs" className={tabTriggerClasses}>
                      Meus TCOs
                    </TabsTrigger>
                    <TabsTrigger value="form" aria-label="Criar ou editar TCO" onClick={() => setSelectedTco(null)} className={tabTriggerClasses}>
                      Novo TCO
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="flex-grow">
                    <Card className="shadow-md px-0 my-0 py-0">
                      <CardContent className="p-6 px-0 mx-[5px] my-[3px] py-0">
                        <TCOmeus user={user} toast={toast} setSelectedTco={setSelectedTco} selectedTco={selectedTco} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="form" className="flex-grow">
                    <Card className="shadow-md">
                      <CardContent className="p-6 px-0">
                        <TCOForm selectedTco={selectedTco} />
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
      <VersionDialog open={showVersionDialog} onOpenChange={setShowVersionDialog} />
      
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

      {/* Convocation Modal */}
      <ConvocacaoModal 
        open={showConvocacao} 
        onClose={() => setShowConvocacao(false)}
        user={user}
        deadline={convocacaoDeadline || ""}
      />

      <BottomMenuBar activeTab={activeTab} onTabChange={handleTabChange} isAdmin={user?.userType === 'admin'} />
    </div>;
};
export default Index;
