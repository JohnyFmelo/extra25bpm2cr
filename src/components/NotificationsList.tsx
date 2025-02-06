import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, ChevronDown, ChevronUp, Eye } from "lucide-react";
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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "./ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);
  const [viewers, setViewers] = useState<string[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.userType === "admin";
  const currentUserIdRef = useRef(currentUser.id);

  useEffect(() => {
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.type === 'all' || data.recipientId === currentUser.id) {
          return {
            id: doc.id,
            ...data,
            readBy: data.readBy || [],
          } as Notification;
        }
        return null;
      }).filter(notif => notif !== null) as Notification[];

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
      setDeleteDialogOpen(false);
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
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return `Hoje às ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)}`;
    } else if (isYesterday) {
      return `Ontem às ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)}`;
    } else {
      return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    }
  };

  const handleContainerClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setExpandedId(expandedId === notification.id ? null : notification.id);
  };

  const handleViewers = async (readBy: string[]) => {
    try {
      const viewerNames: string[] = [];

      for (const userId of readBy) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          viewerNames.push(userDoc.data().name); // Substitua "name" pelo campo correto
        } else {
          viewerNames.push("Usuário desconhecido");
        }
      }

      setViewers(viewerNames);
      setViewersDialogOpen(true);
    } catch (error) {
      console.error("Erro ao buscar nomes dos visualizadores:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os nomes dos visualizadores.",
      });
    }
  };

  const handleMouseDown = (notificationId: string) => {
    if (!isAdmin) return;

    const timer = setTimeout(() => {
      setSelectedNotification(notificationId);
      setDeleteDialogOpen(true);
    }, 1000);

    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDoubleClick = (notificationId: string) => {
    if (isAdmin) {
      setSelectedNotification(notificationId);
      setDeleteDialogOpen(true);
    }
  };

  return (
    
      {notifications.length === 0 ? (
         Você ainda não possui recados.
      ) : (
        notifications.map((notification) => {
          const isUnread = !notification.readBy.includes(currentUser.id);
          const isExpanded = expandedId === notification.id;

          return (
            
              
                
                  
                    {notification.graduation} {notification.senderName}
                    {notification.isAdmin ? " - Usuário" : " - Administrador"}
                  
                  
                    {notification.text}
                  
                  {formatDate(notification.timestamp)}
                
                
                  {isAdmin && (
                     
                      
                    
                  )}
                  
                     
                      {isExpanded ? (
                         
                      ) : (
                         
                      )}
                    
                  
                
              
            
          );
        })
      )}

      
        
          Excluir Recado
          
            Tem certeza de que deseja excluir este recado? Esta ação não pode ser desfeita.
          
          
            
              Cancelar
              Excluir
            
          
        
      

      
        
          
            Visualizadores
          
          
            
              {viewers.length > 0 ? (
                viewers.map((viewer, index) => (
                  
                    {viewer}
                  
                ))
              ) : (
                Ninguém visualizou este recado ainda.
              )}
            
          
        
      
    
  );
};

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserIdRef = useRef(currentUser.id);

  useEffect(() => {
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        readBy: doc.data().readBy || [],
        type: doc.data().type,
        recipientId: doc.data().recipientId,
      })).filter(
        (notif) =>
          notif.type === "all" || notif.recipientId === currentUser.id
      );

      const count = notifs.filter(
        (n) => !n.readBy.includes(currentUser.id)
      ).length;
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  return unreadCount;
};

export default NotificationsList;
