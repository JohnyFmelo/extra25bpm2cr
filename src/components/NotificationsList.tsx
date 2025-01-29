import { Clock, Calendar, Pencil, FileText, ArrowLeft, Settings, Users, Bell, MessageSquare } from "lucide-react";
import IconCard from "@/components/IconCard";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import ScheduleList from "@/components/ScheduleList";
import Messages from "@/components/Messages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
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

interface Notification {
  id: string;
  text: string;
  timestamp: Timestamp;
  senderName: string;
  readBy: string[];
  type: 'all' | 'individual';
  recipientId: string | null;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  useEffect(() => {
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        readBy: doc.data().readBy || [],
      } as Notification)).filter(notif => 
        notif.type === 'all' || notif.recipientId === user.id
      );
      
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "recados", notificationId);
      await updateDoc(notifRef, {
        readBy: arrayUnion(user.id)
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

  const unreadCount = notifications.filter(n => !n.readBy.includes(user.id)).length;

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
              <div onClick={() => setActiveTab("notifications")}>
                <IconCard 
                  icon={Bell} 
                  label="Notificações" 
                  badge={unreadCount > 0 ? unreadCount : undefined}
                />
              </div>
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

          {/* ... outros TabsContent ... */}

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
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Recados</h2>
                <ScrollArea className="h-[500px] w-full">
                  <div className="space-y-4">
                    {notifications.map((notification) => {
                      const isUnread = !notification.readBy.includes(user.id);
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
