import { Clock, Calendar, Pencil, FileText, ArrowLeft, Settings, Users, Bell, MessageSquare } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import ScheduleList from "@/components/ScheduleList";
import Messages from "@/components/Messages";
import NotificationsList from "@/components/NotificationsList";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

  return (
    <div className="relative min-h-screen bg-[#E8F1F2]">
      <div className="pt-8 px-6 pb-16 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <IconCard icon={Clock} label="Horas" />
              <IconCard icon={Calendar} label="Extra" onClick={handleExtraClick} />
              <IconCard icon={Bell} label="Notificações" onClick={handleNotificationsClick} />
              {user.userType === "admin" && (
                <>
                  <IconCard icon={Pencil} label="Editor" onClick={handleEditorClick} />
                  <IconCard icon={Users} label="Usuários" onClick={handleUsersClick} />
                  <IconCard icon={MessageSquare} label="Recados" onClick={handleMessageClick} />
                </>
              )}
              <IconCard icon={FileText} label="Escala" onClick={handleScheduleClick} />
              <IconCard icon={Settings} label="Configurações" onClick={handleSettingsClick} />
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
                  aria-label="Voltar para home"
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
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
                  aria-label="Voltar para home"
                >
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
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-white/80 transition-colors text-primary"
                  aria-label="Voltar para home"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Escala</h2>
                <ScheduleList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages">
      Primeiro o NotificationsList.tsx:

```jsx
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/use-toast";

interface Notification {
  id: string;
  text: string;
  timestamp: Timestamp;
  senderName: string;
  readBy: string[];
  type: 'all' | 'individual';
  recipientId: string | null;
}

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.userType === "admin";

  useEffect(() => {
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        readBy: doc.data().readBy || [],
      } as Notification)).filter(notif => 
        notif.type === 'all' || notif.recipientId === currentUser.id
      );
      
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "recados", notificationId);
      await updateDoc(notifRef, {
        readBy: arrayUnion(currentUser.id)
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível marcar como lido.",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "recados", notificationId));
      toast({
        title: "Sucesso",
        description: "Recado excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o recado.",
      });
    }
  };

  return (
    <ScrollArea className="h-[500px] w-full">
      <div className="space-y-4 p-4">
        {notifications.map((notification) => {
          const isUnread = !notification.readBy.includes(currentUser.id);
          return (
            <div
              key={notification.id}
              className={cn(
                "p-4 rounded-lg border transition-colors cursor-pointer",
                isUnread ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              )}
              onClick={() => {
                handleMarkAsRead(notification.id);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <p className="font-medium">{notification.senderName}</p>
                  <p className="text-sm text-gray-600">
                    {notification.text}
                  </p>
                  <p className="text-xs text-gray-500">
                    {notification.timestamp?.toDate().toLocaleString()}
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                  >
                    <span className="sr-only">Delete notification</span>
                    🗑️
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// Hook para expor o contador de notificações não lidas
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        readBy: doc.data().readBy || [],
        type: doc.data().type,
        recipientId: doc.data().recipientId,
      })).filter(notif => 
        notif.type === 'all' || notif.recipientId === currentUser.id
      );
      
      const count = notifs.filter(n => !n.readBy.includes(currentUser.id)).length;
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  return unreadCount;
};

export default NotificationsList;
```

E agora o Index.tsx:

```jsx
import { Clock, Calendar, Pencil, FileText, ArrowLeft, Settings, Users, Bell, MessageSquare } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import ScheduleList from "@/components/ScheduleList";
import Messages from "@/components/Messages";
import NotificationsList, { useNotifications } from "@/components/NotificationsList";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const unreadCount = useNotifications(); // Usar o hook para obter o contador

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

  return (
    <div className="relative min-h-screen bg-[#E8F1F2]">
      <div className="pt-8 px-6 pb-16 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <IconCard icon={Clock} label="Horas" />
              <IconCard icon={Calendar} label="Extra" onClick={handleExtraClick} />
              <IconCard 
                icon={Bell} 
                label="Notificações" 
                onClick={handleNotificationsClick}
                badge={unreadCount > 0 ? unreadCount : undefined}
              />
              {user.userType === "admin" && (
                <>
                  <IconCard icon={Pencil} label="Editor" onClick={handleEditorClick} />
                  <IconCard icon={Users} label="Usuários" onClick={handleUsersClick} />
                  <IconCard icon={MessageSquare} label="Recados" onClick={handleMessageClick} />
                </>
              )}
              <IconCard icon={FileText} label="Escala" onClick={handleScheduleClick} />
              <IconCard icon={Settings} label="Configurações" onClick={handleSettingsClick} />
            </div>
          </TabsContent>

          {/* ... outros TabsContent permanecem iguais ... */}

          <TabsContent value="notifications">
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
                <NotificationsList />
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
      </div>
    </div>
  );
};

export default Index;
