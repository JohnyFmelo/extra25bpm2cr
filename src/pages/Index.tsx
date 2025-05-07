import { Clock, Calendar, Pencil, FileText, ArrowLeft, Settings, Users, Bell, MessageSquare, MapPinned, Scale, Plus, Trash2 } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import InformationDialog from "@/components/InformationDialog";
import ScheduleList from "@/components/ScheduleList";
import Messages from "@/components/Messages";
import NotificationsList, { useNotifications } from "@/components/NotificationsList";
import { TravelManagement } from "@/components/TravelManagement";
import { useToast } from "@/hooks/use-toast";
import TCOForm from "@/components/TCOForm";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  const {
    toast
  } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications();

  // States for TCO management
  const [tcoList, setTcoList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTco, setSelectedTco] = useState(null);
  const [tcoTab, setTcoTab] = useState("list"); // Controls sub-tabs in TCO section

  // Function to fetch user's TCOs
  const fetchUserTcos = async () => {
    if (!user.id) return;
    setIsLoading(true);
    try {
      const tcoRef = collection(db, "tcos");
      const q = query(tcoRef, where("createdBy", "==", user.id));
      const querySnapshot = await getDocs(q);
      const tcos = [];
      querySnapshot.forEach(doc => {
        tcos.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setTcoList(tcos);
    } catch (error) {
      console.error("Error fetching TCOs:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar os TCOs."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a TCO
  const handleDeleteTco = async tcoId => {
    try {
      await deleteDoc(doc(db, "tcos", tcoId));
      setTcoList(tcoList.filter(tco => tco.id !== tcoId));
      if (selectedTco?.id === tcoId) setSelectedTco(null);
      toast({
        title: "TCO Excluído",
        description: "O TCO foi removido com sucesso."
      });
    } catch (error) {
      console.error("Error deleting TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir o TCO."
      });
    }
  };

  // Fetch TCOs when tab changes to tco
  useEffect(() => {
    if (activeTab === "tco") {
      fetchUserTcos();
    }
  }, [activeTab, user.id]);
  const handleEditorClick = () => {
    setActiveTab("editor");
  };
  const handleExtraClick = () => {
    setActiveTab("extra");
  };
  const handleUsersClick = () => {
    setActiveTab("users");
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
  const handleScheduleClick = () => {
    setActiveTab("schedule");
  };
  const handleMessageClick = () => {
    setActiveTab("messages");
  };
  const handleNotificationsClick = () => {
    setActiveTab("notifications");
  };
  const handleTravelClick = () => {
    setActiveTab("travel");
  };
  const handleTCOClick = () => {
    setActiveTab("tco");
  };
  return <div className="relative min-h-screen bg-[#E8F1F2] flex flex-col">
      <div className="pt-8 px-6 pb-16 max-w-7xl mx-auto flex flex-col flex-grow w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 flex flex-col flex-grow">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
            <TabsTrigger value="tco">TCO</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <IconCard icon={Clock} label="Horas" />
              <IconCard icon={Calendar} label="Extra" onClick={handleExtraClick} />
              <IconCard icon={Bell} label="Notificações" onClick={handleNotificationsClick} badge={unreadCount > 0 ? unreadCount : undefined} />
              {user.userType === "admin" && <>
                  <IconCard icon={Users} label="Usuários" onClick={handleUsersClick} />
                  <IconCard icon={MessageSquare} label="Recados" onClick={handleMessageClick} />
                  <IconCard icon={Scale} label="TCO" onClick={handleTCOClick} />
                </>}
              <IconCard icon={FileText} label="Escala" onClick={handleScheduleClick} />
              <IconCard icon={Settings} label="Configurações" onClick={handleSettingsClick} />
              <IconCard icon={MapPinned} label="Viagens" onClick={handleTravelClick} />
            </div>
          </TabsContent>

          <TabsContent value="extra">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              {user.userType === "admin" && <div className="fixed bottom-6 right-6 z-10">
                  <Button onClick={handleEditorClick} className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center text-gray-50 bg-red-500 hover:bg-red-400">
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>}
              <TimeSlotsList />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-semibold mb-6">Configurações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setShowProfileDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <h3 className="font-medium">Alterar Cadastro</h3>
                    <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
                  </button>
                  <button onClick={() => setShowPasswordDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <h3 className="font-medium">Alterar Senha</h3>
                    <p className="text-sm text-gray-600">Modifique sua senha de acesso</p>
                  </button>
                  <button onClick={() => setShowInformationDialog(true)} className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <h3 className="font-medium">Informações</h3>
                    <p className="text-sm text-gray-600">Visualize a estrutura funcional do sistema</p>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para aba extra">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <WeeklyCalendar isLocked={isLocked} onLockChange={setIsLocked} currentDate={currentDate} onDateChange={setCurrentDate} showControls={true} />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg">
                <UsersList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Planejamento Semanal</h2>
                <ScheduleList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg">
                <Messages />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg">
                <NotificationsList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="travel">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary" aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg">
                <TravelManagement />
              </div>
            </div>
          </TabsContent>

          {/* Modified TCO tab with navigation bar */}
          <TabsContent value="tco" className="flex flex-col flex-grow">
            <div className="flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Gestão de TCOs</h1>
                <Button variant="ghost" onClick={handleBackClick} aria-label="Voltar para home">
                  <ArrowLeft className="h-6 w-6 mr-2" /> Voltar
                </Button>
              </div>
              <Tabs value={tcoTab} onValueChange={setTcoTab} className="space-y-6 flex flex-col flex-grow">
                <TabsList className="bg-white rounded-xl shadow-lg p-2 grid grid-cols-2 gap-2 my-0 py-0">
                  <TabsTrigger value="list" aria-label="Visualizar Meus TCOs" className="py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-[8px] mx-0">
                    Meus TCOs
                  </TabsTrigger>
                  <TabsTrigger value="form" aria-label="Criar ou editar TCO" onClick={() => setSelectedTco(null)} className="px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white my-0 py-[6px]">
                    Novo TCO
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="bg-white rounded-xl shadow-lg p-4 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    
                    
                  </div>
                  {isLoading ? <p className="text-center py-8">Carregando TCOs...</p> : tcoList.length === 0 ? <p className="text-center py-8 text-gray-500">Nenhum TCO encontrado</p> : <Table role="grid">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-slate-400">Número</TableHead>
                          <TableHead className="bg-slate-400">Data</TableHead>
                          <TableHead className="bg-slate-400">Natureza</TableHead>
                          <TableHead className="bg-slate-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tcoList.map(tco => <TableRow key={tco.id} aria-selected={selectedTco?.id === tco.id} className={`cursor-pointer ${selectedTco?.id === tco.id ? 'bg-primary/10' : ''}`}>
                            <TableCell className="font-medium">{tco.tcoNumber}</TableCell>
                            <TableCell>
                              {tco.createdAt ? format(new Date(tco.createdAt.seconds * 1000), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell>{tco.natureza}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedTco(tco);
                          setTcoTab("form");
                        }} aria-label={`Editar TCO ${tco.tcoNumber}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTco(tco.id)} aria-label={`Excluir TCO ${tco.tcoNumber}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>}
                </TabsContent>

                <TabsContent value="form" className="bg-white rounded-xl shadow-lg p-4 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    
                    
                  </div>
                  <TCOForm selectedTco={selectedTco} onClear={() => {
                  setSelectedTco(null);
                  setTcoTab("list");
                }} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        {showProfileDialog && <ProfileUpdateDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} userData={user} />}
        
        {showPasswordDialog && <PasswordChangeDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} userId={user.id} currentPassword={user.password} />}

        {showInformationDialog && <InformationDialog open={showInformationDialog} onOpenChange={setShowInformationDialog} isAdmin={user.userType === "admin"} />}
      </div>
    </div>;
};
export default Index;