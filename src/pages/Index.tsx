
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications();
  const navigate = useNavigate();

  // States for TCO management
  const [selectedTco, setSelectedTco] = useState<any>(null);
  const [tcoTab, setTcoTab] = useState("list"); // Controls sub-tabs in TCO section

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
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="relative min-h-screen bg-[#E8F1F2] flex flex-col">
      <div className="pt-8 px-6 pb-24 max-w-7xl mx-auto flex flex-col flex-grow w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 flex flex-col flex-grow">
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

          <TabsContent value="main">
            {/* Display notifications directly on main page */}
            <div className="bg-white rounded-xl shadow-lg mb-6">
              <NotificationsList />
            </div>
          </TabsContent>

          <TabsContent value="extra">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              {user.userType === "admin" && (
                <div className="fixed bottom-6 right-6 z-10">
                  <Button
                    onClick={handleEditorClick}
                    className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center text-gray-50 bg-red-500 hover:bg-red-400"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              )}
              <TimeSlotsList />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-semibold mb-6">Configurações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowProfileDialog(true)}
                    className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="font-medium">Alterar Cadastro</h3>
                    <p className="text-sm text-gray-600">Atualize suas informações pessoais</p>
                  </button>
                  <button
                    onClick={() => setShowPasswordDialog(true)}
                    className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="font-medium">Alterar Senha</h3>
                    <p className="text-sm text-gray-600">Modifique sua senha de acesso</p>
                  </button>
                  <button
                    onClick={() => setShowInformationDialog(true)}
                    className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="font-medium">Informações</h3>
                    <p className="text-sm text-gray-600">Visualize a estrutura funcional do sistema</p>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      <h3 className="font-medium">Atualizar</h3>
                    </div>
                    <p className="text-sm text-gray-600">Recarregar dados do sistema</p>
                  </button>
                  {user.userType === "admin" && (
                    <button
                      onClick={() => setActiveTab("users")}
                      className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <h3 className="font-medium">Usuários</h3>
                      </div>
                      <p className="text-sm text-gray-600">Gerenciar usuários do sistema</p>
                    </button>
                  )}
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="p-4 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium text-red-500">Sair</h3>
                    </div>
                    <p className="text-sm text-red-600">Encerrar a sessão atual</p>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
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
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={() => setActiveTab("settings")}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
                  aria-label="Voltar para configurações"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg">
                <UsersList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="travel">
            <div className="relative">
              <div className="absolute right-0 -top-12 mb-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg">
                <TravelManagement />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tco" className="flex flex-col flex-grow">
            <div className="flex flex-col flex-grow">
              <div className="relative">
                <div className="absolute right-0 -top-12 mb-4">
                  <button
                    onClick={handleBackClick}
                    className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
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
                  <TabsList className="bg-white rounded-xl shadow-lg p-2 grid grid-cols-2 gap-2 my-0 py-0">
                    <TabsTrigger
                      value="list"
                      aria-label="Visualizar Meus TCOs"
                      className="py-2 rounded-lg text-gray-700 data-[state=active]:bg-primary data-[state=active]:text-white px-[8px] mx-0"
                    >
                      Meus TCO's
                    </TabsTrigger>
                    <TabsTrigger
                      value="form"
                      aria-label="Criar ou editar TCO"
                      onClick={() => setSelectedTco(null)}
                      className="px-4 rounded-lg text-gray-700 data-[state=active]:bg-primary data-[state=active]:text-white my-0 py-[6px]"
                    >
                      Novo TCO
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="list"
                    className="flex-grow"
                  >
                    <TCOmeus
                      user={user}
                      toast={toast}
                      setSelectedTco={setSelectedTco}
                      selectedTco={selectedTco}
                    />
                  </TabsContent>

                  <TabsContent
                    value="form"
                    className="bg-white rounded-xl shadow-lg p-4 flex-grow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      {/* Espaço reservado para título ou ações adicionais, se necessário */}
                    </div>
                    <TCOForm
                      selectedTco={selectedTco}
                      onClear={() => {
                        setSelectedTco(null);
                        setTcoTab("list");
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {showProfileDialog && (
          <ProfileUpdateDialog
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
            userData={user}
          />
        )}

        {showPasswordDialog && (
          <PasswordChangeDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            userId={user.id}
            currentPassword={user.password}
          />
        )}

        {showInformationDialog && (
          <InformationDialog
            open={showInformationDialog}
            onOpenChange={setShowInformationDialog}
            isAdmin={user.userType === "admin"}
          />
        )}
        
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
              <AlertDialogDescription>
                Sair do sistema?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <BottomMenuBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={user.userType === "admin"}
      />
    </div>
  );
};

export default Index;
