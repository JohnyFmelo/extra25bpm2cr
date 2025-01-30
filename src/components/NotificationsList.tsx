import { useState, useEffect } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  graduation: string;
  isAdmin: boolean;
  readBy: string[];
  type: 'all' | 'individual';
  recipientId: string | null;
}

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
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

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekDay = weekDays[date.getDay()];
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${weekDay} ${formattedDate} às ${formattedTime}`;
  };

  const toggleExpand = (notificationId: string) => {
    setExpandedNotification(prev =>
      prev === notificationId ? null : notificationId
    );
  };

  return (
    <div className="space-y-4 p-4">
      {notifications.length === 0 ? (
        <div className="p-4 rounded-lg border border-gray-200 bg-white text-center">
          <p className="text-gray-600">Você ainda não possui recados.</p>
        </div>
      ) : (
        notifications.map((notification) => {
          const isUnread = !notification.readBy.includes(currentUser.id);
          const isExpanded = expandedNotification === notification.id;
          const firstLineEndIndex = notification.text.indexOf('\n') !== -1
            ? notification.text.indexOf('\n')
            : notification.text.length;
          const firstLine = notification.text.slice(0, firstLineEndIndex);
          const remainingText = notification.text.slice(firstLineEndIndex).trim();
          
          return (
            <div
              key={notification.id}
              className={cn(
                "p-4 rounded-lg border transition-colors cursor-pointer",
                isUnread ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              )}
              onClick={() => {
                handleMarkAsRead(notification.id);
                toggleExpand(notification.id);
              }}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-medium">
                        {notification.graduation} {notification.senderName}
                        {notification.isAdmin && " - Administrador"}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 text-justify whitespace-pre-wrap">
                      {isExpanded ? notification.text : (
                        <>
                          {firstLine}
                          {remainingText && "..."}
                        </>
                      )}
                    </p>
                    <p className="text-sm">
                      {formatDate(notification.timestamp)}
                    </p>
                  </div>
                  {isAdmin && !isExpanded && (
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
                <div className="flex justify-end mt-2">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// Hook para obter a contagem de notificações não lidas
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
