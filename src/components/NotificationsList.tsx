import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react"; // Importação do ícone de lixeira
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
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
