import { Users, MessageSquare, Plus, ArrowLeft, RefreshCw, LogOut, Activity, Briefcase, Map } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";

// Componentes
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import InformationDialog from "@/components/InformationDialog";
import NotificationsList, { useNotifications } from "@/components/NotificationsList";
import { TravelManagement } from "@/components/TravelManagement";
import TCOForm from "@/components/TCOForm";
import TCOmeus from "@/components/tco/TCOmeus";
import BottomMenuBar from "@/components/BottomMenuBar";
import UpcomingShifts from "@/components/UpcomingShifts";
import MonthlyHoursSummary from "@/components/MonthlyHoursSummary";
import ActiveTrips from "@/components/ActiveTrips";
import MonthlyExtraCalendar from "@/components/MonthlyExtraCalendar";

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
  const [tcoTab, setTcoTab] = useState("list");
  const [selectedTco, setSelectedTco] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications();
  const navigate = useNavigate();

  // Animação para o efeito de refresh
  const rotationAnimation = {
    initial: { rotate: 0 },
    animate: { rotate: 360, transition: { duration: 1, ease: "linear" } }
  };

  useEffect(() => {
    const handleNotificationsChange = (count: number) => {
      setHasNotifications(count > 0);
    };
    
    if (unreadCount > 0) {
      setHasNotifications(true);
    }
    
    const notificationsChangeEvent = new CustomEvent('notificationsUpdate', {
      detail: { count: unreadCount }
    });
    
    window.addEventListener('notificationsUpdate', (e: any) => handleNotificationsChange(e.detail.count));
    
    return () => {
      window.removeEventListener('notificationsUpdate', (e: any) => handleNotificationsChange(e.detail.count));
    };
  }, [unreadCount]);

  useEffect(() => {
    const today = new Date();
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef, where("archived", "==", false));
    
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const trips = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((trip: any) => {
          const startDate = new Date(trip.startDate + "T00:00:00");
          const endDate = new Date(trip.endDate + "T00:00:00");
          return today <= endDate && (today < startDate && !trip.isLocked || today >= startDate && today <= endDate);
        })
        .sort((a: any, b: any) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
      
      setActiveTrips(trips);
    });
    
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      window.location.reload();
      toast({
        title: "Atualizado",
        description: "Dados do sistema recarregados com sucesso."
      });
      setIsRefreshing(false);
    }, 1000);
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

  // Gradientes para os cards
  const cardGradients = {
    hours: "from-blue-50 to-indigo-100 border-l-4 border-blue-500",
    shifts: "from-green-50 to-emerald-100 border-l-4 border-green-500",
    trips: "from-amber-50 to-orange-100 border-l-4 border-amber-500",
    notifications: "from-purple-50 to-fuchsia-100 border-l-4 border-purple-500"
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header com informações do usuário */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="font-bold text-lg">{user.name || "Usuário"}</h1>
              <p className="text-xs opacity-80">{user.userType === "admin" ? "Administrador" : "Usuário padrão"}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <motion.button
              initial="initial"
              animate={isRefreshing ? "animate" : "initial"}
              variants={rotationAnimation}
              onClick={handleRefresh}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Atualizar dados"
            >
              <RefreshCw size={20} />
            </motion.button>
            <button 
              onClick={() => setActiveTab("notifications")}
              className="p-2 relative rounded-full bg-white/10 hover:bg-white/20" 
              aria-label="Notificações"
            >
              <MessageSquare size={20} />
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs">{unreadCount}</span>
              )}
            </button>
            <button 
              onClick={handleSettingsClick}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20" 
              aria-label="Configurações"
            >
              <Users size={20} />
            </button>
            <button 
              onClick={handleTCOClick}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20" 
              aria-label="Gestão de TCO"
            >
              <Briefcase size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-6 pb-24 sm:px-6 lg:px-8">
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

          {/* Dashboard principal */}
          <TabsContent value="main" className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Snapshot de Horas Trabalhadas */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className={`shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${cardGradients.hours}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-blue-600" />
                        Horas Trabalhadas
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab("extra")}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 h-8"
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MonthlyHoursSummary compact={true} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Próximos serviços */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className={`shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${cardGradients.shifts}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                        Próximos Serviços
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab("extra")}
                        className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 h-8"
                      >
                        Ver todos
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <UpcomingShifts limit={3} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Calendário mensal */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-2"
              >
                <Card className="shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800">Calendário de Extras</h2>
                      {user.userType === "admin" && (
                        <Button 
                          onClick={handleEditorClick}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus size={16} className="mr-1" /> Adicionar Extra
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MonthlyExtraCalendar />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Viagens ativas */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="md:col-span-2"
              >
                <Card className={`shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${cardGradients.trips}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Map className="h-5 w-5 mr-2 text-amber-600" />
                        Viagens Ativas
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleTravelClick}
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 p-1 h-8"
                      >
                        Gerenciar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ActiveTrips trips={activeTrips} onTravelClick={handleTravelClick} />
                  </CardContent>
                  {activeTrips.length === 0 && (
                    <CardFooter className="text-center text-gray-500 italic pt-0">
                      Nenhuma viagem ativa no momento
                    </CardFooter>
                  )}
                </Card>
              </motion.div>

              {/* Bloco de notificações */}
              {hasNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="md:col-span-2"
                >
                  <Card className={`shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${cardGradients.notifications}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                          <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                          Notificações
                        </h2>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab("notifications")}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 p-1 h-8"
                        >
                          Ver todas
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <NotificationsList showOnlyUnread={true} limit={3} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Conteúdo para a aba de extras */}
          <TabsContent value="extra">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Extras</h2>
                <button 
                  onClick={handleBackClick} 
                  aria-label="Voltar para home" 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-blue-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              {user.userType === "admin" && (
                <div className="fixed bottom-20 right-6 z-10">
                  <Button 
                    onClick={handleEditorClick} 
                    className="rounded-full p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-green-500 hover:bg-green-400"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              )}
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <TimeSlotsList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
                <button 
                  onClick={handleBackClick} 
                  aria-label="Voltar para home" 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-blue-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              <Card className="shadow-md bg-white">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowProfileDialog(true)} 
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-800">Alterar Cadastro</h3>
                      <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPasswordDialog(true)} 
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-800">Alterar Senha</h3>
                      <p className="text-sm text-gray-600">Modifique sua senha de acesso</p>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowInformationDialog(true)} 
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-800">Informações</h3>
                      <p className="text-sm text-gray-600">Visualize a estrutura funcional do sistema</p>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRefresh} 
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Atualizar</h3>
                      </div>
                      <p className="text-sm text-gray-600">Recarregar dados do sistema</p>
                    </motion.button>
                    
                    {user.userType === "admin" && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab("users")} 
                        className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-800">Usuários</h3>
                        </div>
                        <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                      </motion.button>
                    )}
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowLogoutDialog(true)} 
                      className="p-4 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-red-500">Sair</h3>
                      </div>
                      <p className="text-sm text-red-600">Encerrar a sessão atual</p>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Editor de calendário */}
          <TabsContent value="editor">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Editor de Calendário</h2>
                <button 
                  onClick={handleBackClick} 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700" 
                  aria-label="Voltar para aba extra"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <WeeklyCalendar 
                    isLocked={isLocked} 
                    onLockChange={setIsLocked} 
                    currentDate={currentDate} 
                    onDateChange={setCurrentDate} 
                    showControls={true} 
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notifications">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Notificações</h2>
                <button 
                  onClick={handleBackClick} 
                  aria-label="Voltar para home" 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-blue-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <NotificationsList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestão de usuários */}
          <TabsContent value="users">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Usuários</h2>
                <button 
                  onClick={() => setActiveTab("settings")} 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700" 
                  aria-label="Voltar para configurações"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <UsersList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestão de viagens */}
          <TabsContent value="travel">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Viagens</h2>
                <button 
                  onClick={handleBackClick} 
                  aria-label="Voltar para home" 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-blue-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <TravelManagement />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestão de TCO */}
          <TabsContent value="tco" className="flex flex-col flex-grow">
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gestão de TCO</h2>
                <button 
                  onClick={handleBackClick} 
                  aria-label="Voltar para home" 
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-blue-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              
              <Tabs value={tcoTab} onValueChange={setTcoTab} className="space-y-6">
                <TabsList className="shadow-md rounded-lg p-4 flex justify-center gap-4 py-4 px-2 bg-gray-100">
                  <TabsTrigger 
                    value="list" 
                    aria-label="Visualizar Meus TCOs" 
                    className="flex-1 py-3 px-4 rounded-md text-gray-800 font-medium bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-center"
                  >
                    Meus TCOs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="form" 
                    aria-label="Criar ou editar TCO" 
                    onClick={() => setSelectedTco(null)} 
                    className="flex-1 py-3 px-4 rounded-md text-gray-800 font-medium bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-center"
                  >
                    Novo TCO
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <Card className="shadow-md">
                    <CardContent className="p-6">
                      <TCOmeus user={user} toast={toast} setSelectedTco={setSelectedTco} selectedTco={selectedTco} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="form">
                  <Card className="shadow-md">
                    <CardContent className="p-6">
                      <TCOForm selectedTco={selectedTco} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs e alertas */}
      <ProfileUpdateDialog 
        open={showProfileDialog} 
        onOpenChange={setShowProfileDialog} 
        userData={user} 
      />
      
      <PasswordChangeDialog 
        open={showPasswordDialog} 
        onOpenChange={setShowPasswordDialog} 
        userId={user.id || ''} 
        currentPassword="" 
      />
      
      <InformationDialog 
        open={showInformationDialog} 
        onOpenChange={setShowInformationDialog} 
        isAdmin={user.userType === 'admin'} 
      />
      
      <AlertDialog 
        open={showLogoutDialog} 
        onOpenChange={setShowLogoutDialog}
      >
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

      <BottomMenuBar 
        activeTab={activeTab} 
        onTabChange={tab => setActiveTab(tab)} 
        isAdmin={user.userType === 'admin'} 
      />
    </div>
  );
};

export default Index;
