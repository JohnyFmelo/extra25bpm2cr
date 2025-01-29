import { useState, useEffect } from "react";
import { Bell, BellDot, Trash2, Users } from "lucide-react";
import IconCard from "@/components/IconCard";
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
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface User {
  id: string;
  warName: string;
}

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.userType === "admin";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          warName: doc.data().warName || "Usuário sem nome"
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    
    fetchUsers();
  }, []);

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
      setHasUnread(notifs.some(n => !n.readBy.includes(currentUser.id)));
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

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.warName || "Usuário desconhecido";
  };

  const unreadCount = notifications.filter(n => !n.readBy.includes(currentUser.id)).length;

  return (
    <>
      <IconCard 
        icon={Bell} 
        label="Notificações" 
        onClick={() => setIsDialogOpen(true)}
        badge={unreadCount > 0 ? unreadCount : undefined}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recados</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] w-full">
            <div className="space-y-4 p-4">
              {notifications.map((notification) => {
                const isUnread = !notification.readBy.includes(currentUser.id);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors cursor-pointer",
                      isUnread ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                    )}
                    onClick={() => {
                      handleMarkAsRead(notification.id);
                      setSelectedNotification(notification.id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{notification.senderName}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.timestamp?.toDate().toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotification(notification.id);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Recado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNotification && (
              <>
                <div className="space-y-2">
                  {(() => {
                    const notification = notifications.find(n => n.id === selectedNotification);
                    if (!notification) return null;
                    return (
                      <>
                        <p className="font-medium">{notification.senderName}</p>
                        <p className="text-sm">{notification.text}</p>
                        <p className="text-xs text-gray-500">
                          {notification.timestamp?.toDate().toLocaleString()}
                        </p>
                      </>
                    );
                  })()}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Lido por:</h4>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="space-y-2">
                      {notifications
                        .find(n => n.id === selectedNotification)
                        ?.readBy.map((userId) => (
                          <div key={userId} className="text-sm">
                            {getUserName(userId)}
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationsList;