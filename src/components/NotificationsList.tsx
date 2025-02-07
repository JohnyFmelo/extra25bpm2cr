import { useState, useEffect } from "react";
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
  getDoc, // Importação do getDoc para buscar detalhes do usuário
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
  readBy: string[]; // Lista de IDs dos usuários que visualizaram
  type: 'all' | 'individual';
  recipientId: string | null;
}

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);
  const [viewers, setViewers] = useState<{ name: string, graduation: string }[]>([]); // Alterado para armazenar nome e graduação
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
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
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) {
      return `Hoje às ${timeStr}`;
    } else if (isYesterday) {
      return `Ontem às ${timeStr}`;
    } else {
      const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const weekDay = weekDays[date.getDay()];
      const formattedDate = date.toLocaleDateString('pt-BR');
      return `${weekDay} ${formattedDate} às ${timeStr}`;
    }
  };

  const handleContainerClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setExpandedId(expandedId === notification.id ? null : notification.id);
  };

  const handleViewers = async (readBy: string[]) => {
    try {
      // Buscar os detalhes dos usuários que visualizaram a notificação
      const usersSnapshot = await Promise.all(
        readBy.map(async (userId) => {
          const userDoc = await getDoc(doc(db, "users", userId)); // Supondo que você tenha uma coleção 'users' no Firebase
          return userDoc.exists() ? userDoc.data() : null;
        })
      );

      // Filtra usuários não encontrados (caso algum ID seja inválido ou o usuário não exista)
      const viewersList = usersSnapshot.filter((user) => user !== null) as { name: string, graduation: string }[];
      
      setViewers(viewersList);
      setViewersDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar os visualizadores:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de visualizadores.",
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
    <div className="space-y-4 p-4">
      {notifications.length === 0 ? (
        <div className="p-4 rounded-lg border border-gray-200 bg-white text-center">
          <p className="text-gray-600">Você ainda não possui recados.</p>
        </div>
      ) : (
        notifications.map((notification) => {
          const isUnread = !notification.readBy.includes(currentUser.id);
          const isExpanded = expandedId === notification.id;
          
          return (
            <div
              key={notification.id}
              className={cn(
                "p-4 rounded-lg border transition-colors cursor-pointer select-none",
                isUnread ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              )}
              onClick={() => handleContainerClick(notification)}
              onMouseDown={() => handleMouseDown(notification.id)}
              onMouseUp={handleMouseUp}
              onDoubleClick={() => handleDoubleClick(notification.id)}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">
                      {notification.graduation} {notification.senderName}
                      {notification.isAdmin ? " - Usuário" : " - Administrador"}
                    </p>
                    <p className={cn(
                      "text-sm text-gray-600 whitespace-pre-wrap",
                      isExpanded ? "text-justify" : "line-clamp-1"
                    )}>
                      {notification.text}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(notification.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewers(notification.readBy);
                        }}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir esta mensagem?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedNotification && handleDeleteNotification(selectedNotification)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewersDialogOpen} onOpenChange={setViewersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visualizações</DialogTitle>
            <DialogDescription>
              Lista de usuários que visualizaram este recado
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            {viewers.length === 0 ? (
              <p className="text-center text-gray-500">Nenhuma visualização ainda</p>
            ) : (
              <ul className="space-y-2">
                {viewers.map((viewer, index) => (
                  <li key={index} className="p-2 bg-gray-50 rounded">
                    {viewer.graduation} {viewer.name} {/* Exibe a graduação e o nome */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
