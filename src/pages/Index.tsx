import { Clock, Calendar, Pencil, FileText, ArrowLeft, Settings, Users, Bell, MessageSquare, MapPinned } from "lucide-react"; 
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState } from "react";
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications();

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
    setActiveTab("main");
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

  // Removemos a verificação do tipo de usuário para que qualquer um possa acessar a aba "travel"
  const handleTravelClick = () => {
    setActiveTab("travel");
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="main">Main</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="extra">Extra</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          {/* Main content */}
        </TabsContent>

        <TabsContent value="editor">
          {/* Editor content */}
        </TabsContent>

        <TabsContent value="extra">
          {/* Extra content */}
        </TabsContent>

        <TabsContent value="users">
          {/* Users content */}
        </TabsContent>

        <TabsContent value="settings">
          {/* Settings content */}
        </TabsContent>

        <TabsContent value="schedule">
          {/* Schedule content */}
        </TabsContent>

        <TabsContent value="messages">
          {/* Messages content */}
        </TabsContent>

        <TabsContent value="notifications">
          {/* Notifications content */}
        </TabsContent>

        <TabsContent value="travel">
          {/* Travel content */}
        </TabsContent>
      </Tabs>

      {unreadCount > 0 && (
        <div>{unreadCount}</div>
      )}

      {user.userType === "admin" && (
        <>
          {/* Admin-specific content */}
        </>
      )}

      <button onClick={() => setShowProfileDialog(true)}>
        Alterar Cadastro
      </button>
      <p>Atualize suas informações pessoais</p>

      <button onClick={() => setShowPasswordDialog(true)}>
        Alterar Senha
      </button>
      <p>Modifique sua senha de acesso</p>

      <button onClick={() => setShowInformationDialog(true)}>
        Informações
      </button>
      <p>Visualize a estrutura funcional do sistema</p>

      <button onClick={handleScheduleClick}>
        Escala
      </button>

      {showProfileDialog && (
        <ProfileUpdateDialog onClose={() => setShowProfileDialog(false)} />
      )}

      {showPasswordDialog && (
        <PasswordChangeDialog onClose={() => setShowPasswordDialog(false)} />
      )}

      {showInformationDialog && (
        <InformationDialog onClose={() => setShowInformationDialog(false)} />
      )}
    </>
  );
};

export default Index;
