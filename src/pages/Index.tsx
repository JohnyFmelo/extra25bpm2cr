import { Users, MessageSquare, Plus, ArrowLeft, RefreshCw, LogOut } from "lucide-react";
import IconCard from "@/components/IconCard";
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
import { CalendarDays, Users as UsersIcon, Clock, MapPin, Calendar, Navigation } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications();
  const navigate = useNavigate();

  // States for TCO management
  const [selectedTco, setSelectedTco] = useState<any>(null);
  const [tcoTab, setTcoTab] = useState("list");

  useEffect(() => {
    const handleNotificationsChange = (count: number) => {
      setHasNotifications(count > 0);
    };
    
    if (unreadCount > 0) {
      setHasNotifications(true);
    }
    
    const notificationsChangeEvent = new CustomEvent('notificationsUpdate', { detail: { count: unreadCount } });
    window.addEventListener('notificationsUpdate', (e: any) => handleNotificationsChange(e.detail.count));
    
    return () => {
      window.removeEventListener('notificationsUpdate', (e: any) => handleNotificationsChange(e.detail.count));
    };
  }, [unreadCount]);

  useEffect(() => {
    const today = new Date();
    const travelsRef = collection(db, "travels");
    const q = query(
      travelsRef,
      where("archived", "==", false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const trips = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((trip: any) => {
          const startDate = new Date(trip.startDate + "T00:00:00");
          const endDate = new Date(trip.endDate + "T00:00:00");
          return ((today <= endDate) && 
                 ((today < startDate && !trip.isLocked) || 
                  (today >= startDate && today <= endDate)));
        })
        .sort((a: any, b: any) => {
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
      description: "Recarregando dados do sistema.",
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

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col">
      <div className="pt-10 px-4 sm:px-6 lg:px-8 pb-28 max-w-7xl mx-auto flex flex-col flex-grow w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 flex flex-col flex-grow">
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
            {hasNotifications && (
              <Card className="mb-6 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <NotificationsList showOnlyUnread={true} />
                </CardContent>
              </Card>
            )}

            {activeTrips.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Viagens Ativas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTrips.map((trip) => {
                    const travelStart = new Date(trip.startDate + "T00:00:00");
                    const travelEnd = new Date(trip.endDate + "T00:00:00");
                    const today = new Date();
                    const isInTransit = today >= travelStart && today <= travelEnd;
                    const isOpen = today < travelStart;
                    const numDays = Math.floor((travelEnd.getTime() - travelStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const dailyCount = trip.halfLastDay ? numDays - 0.5 : numDays;

                    return (
                      <Card 
                        key={trip.id} 
                        className={`relative overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
                          isInTransit ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-white'
                        }`}
                      >
                        <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-medium text-white ${
                          isInTransit ? 'bg-green-600' : 'bg-blue-600'
                        } rounded-bl-lg`}>
                          {isInTransit ? 'Em Trânsito' : 'Em Aberto'}
                        </div>
                        
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-4 text-gray-900">
                            {trip.destination}
                          </h3>
                          <div className="space-y-3 text-gray-700">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-blue-500" />
                              <p>{trip.destination}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-blue-500" />
                              <p>{isInTransit ? 'Período: ' : 'Início: '} 
                                {travelStart.toLocaleDateString()}
                                {isInTransit && ` até ${travelEnd.toLocaleDateString()}`}
                              </p>
                            </div>
                            
                            {!isInTransit && (
                              <div className="flex items-center gap-3">
                                <UsersIcon className="h-5 w-5 text-blue-500" />
                                <p>Vagas: {trip.slots}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-blue-500" />
                              <p>{dailyCount.toLocaleString("pt-BR", {
                                minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
                                maximumFractionDigits: 1
                              })} diárias</p>
                            </div>

                            {isInTransit && trip.selectedVolunteers && trip.selectedVolunteers.length > 0 && (
                              <div className="mt-4">
                                <p className="font-medium text-sm text-gray-800">Viajantes:</p>
                                <div className="mt-2 space-y-2">
                                  {trip.selectedVolunteers.map((volunteer: string, idx: number) => (
                                    <div key={idx} className="text-sm bg-white/80 px-3 py-1 rounded-md">
                                      {volunteer}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {isOpen && (
                            <Button 
                              onClick={() => handleTravelClick()}
                              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                              <Navigation className="h-5 w-5 mr-2" />
                              Ver detalhes
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTrips.length === 0 && (
              <Card className="shadow-md">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">Nenhuma viagem ativa no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="extra">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              {user.userType === "admin" && (
                <div className="fixed bottom-8 right-8 z-10">
                  <Button
                    onClick={handleEditorClick}
                    className="rounded-full w-16 h-16 shadow-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                  >
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
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowProfileDialog(true)}
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-gray-800">Alterar Cadastro</h3>
                      <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
                    </button>
                    <button
                      onClick={() => setShowPasswordDialog(true)}
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-gray-800">Alterar Senha</h3>
                      <p className="text-sm text-gray-600">Modifique sua senha de acesso</p>
                    </button>
                    <button
                      onClick={() => setShowInformationDialog(true)}
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-gray-800">Informações</h3>
                      <p className="text-sm text-gray-600">Visualize a estrutura funcional do sistema</p>
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Atualizar</h3>
                      </div>
                      <p className="text-sm text-gray-600">Recarregar dados do sistema</p>
                    </button>
                    {user.userType === "admin" && (
                      <button
                        onClick={() => setActiveTab("users")}
                        className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-800">Usuários</h3>
                        </div>
                        <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                      </button>
                    )}
                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className="p-4 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
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
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label="Voltar para aba extra"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <WeeklyCalendar
                isLocked={isLocked}
                onLockChange={setIsLocked}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                showControls={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative">
              <div className="absolute right-0 -top-14">
                <button
                  onClick={() => setActiveTab("settings")}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label="Voltar para configurações"
                >
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
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <TravelManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tco" className="flex flex-col flex-grow">
            <div className="flex flex-col flex-grow">
              <div className="relative">
                <div className="absolute right-0 -top-14">
                  <button
                    onClick={handleBackClick}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
                    aria-label="Voltar para home"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                </div>
                <Tabs
                  value={tcoTab}
                  onValueChange={setTcoTab}
                  className="space-y-6 flex flex-col flex-grow"
                >
                  <TabsList className="bg-white shadow-md rounded-lg p-2 grid grid-cols-2 gap-4">
                    <TabsTrigger
                      value="list"
                      aria-label="Visualizar Meus TCOs"
                      className="py-2 px-4 rounded-md text-gray-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
                    >
                      Meus TCOs
                    </TabsTrigger>
                    <TabsTrigger
                      value="form"
                      aria-label="Criar ou editar TCO"
                      onClick={() => setSelectedTco(null)}
                      className="py-2 px-4 rounded-md text-gray-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
                    >
                      Novo TCO
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="flex-grow">
                    <Card className="shadow-md">
                      <CardContent className="p-6">
                        <TCOmeus
                          user={user}
                          toast={toast}
                          setSelectedTco={setSelectedTco}
                          selectedTco={selectedTco}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="form" className="flex-grow">
                    <Card className="shadow-md">
                      <CardContent className
