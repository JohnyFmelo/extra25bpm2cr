```typescript
import { useState, useEffect } from "react";
import { Bell, BellDot, Trash2, Users } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-blue-100" 
          >
            {hasUnread ? (
              <BellDot className="h-5 w-5 text-blue-500" />
            ) : (
              <Bell className="h-5 w-5 text-gray-500" />
            )}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Notificações</h4>
            {hasUnread && (
              <p className="text-sm text-muted-foreground">
                Você tem recados não lidos
              </p>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const isUnread = !notification.readBy.includes(currentUser.id);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative w-full text-left px-4 py-3 hover:bg-blue-100 transition-colors",
                        isUnread && "bg-blue-50"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <button
                          className="flex-1 text-left"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <p className="text-sm font-medium leading-none">
                            {notification.senderName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp?.toDate().toLocaleString()}
                          </p>
                        </button>
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedNotification(notification.id)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteNotification(notification.id)}
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
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuários que leram este recado</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {selectedNotification && (
              <div className="space-y-2">
                {notifications
                  .find(n => n.id === selectedNotification)
                  ?.readBy.map((userId) => (
                    <div key={userId} className="text-sm">
                      {getUserName(userId)}
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationsList;
