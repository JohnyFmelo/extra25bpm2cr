
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationCard from "./NotificationCard";
import { Timestamp } from "firebase/firestore";

interface Notification {
  id: string;
  text: string;
  timestamp: Timestamp | null;
  senderName: string;
  graduation: string;
  isAdmin: boolean;
  readBy: string[];
  type: 'all' | 'individual';
  recipientId: string | null;
}

interface NotificationsListProps {
  showOnlyUnread?: boolean;
}

const NotificationsList = ({ showOnlyUnread = false }: NotificationsListProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);
  const [viewers, setViewers] = useState<{name: string; graduation: string;}[]>([]);
  
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.userType === "admin";
  
  useEffect(() => {
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const allNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        readBy: doc.data().readBy || []
      }) as Notification).filter(notif => 
        notif.type === 'all' || notif.recipientId === currentUser.id
      );
      
      const filteredNotifs = showOnlyUnread 
        ? allNotifs.filter(n => !n.readBy.includes(currentUser.id))
        : allNotifs;
        
      setNotifications(filteredNotifs);
      
      // Dispatch event to notify about notifications count
      const unreadCount = allNotifs.filter(n => !n.readBy.includes(currentUser.id)).length;
      window.dispatchEvent(new CustomEvent('notificationsUpdate', { 
        detail: { count: unreadCount } 
      }));
    });
    
    return () => unsubscribe();
  }, [currentUser.id, showOnlyUnread]);
  
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
        description: "Não foi possível marcar como lido."
      });
    }
  };
  
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "recados", notificationId));
      setDeleteDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Recado excluído com sucesso."
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o recado."
      });
    }
  };

  const handleViewers = async (readBy: string[]) => {
    try {
      const viewersPromises = readBy.map(async userId => {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.name || !userData.graduation) {
            return null;
          }
          return {
            name: userData.name,
            graduation: userData.graduation
          };
        }
        return null;
      });
      
      const viewersData = await Promise.all(viewersPromises);
      const validViewers = viewersData.filter((viewer): viewer is {name: string; graduation: string;} => 
        viewer !== null && viewer.name && viewer.graduation
      );
      
      setViewers(validViewers);
      setViewersDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar os visualizadores:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de visualizadores."
      });
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📫</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {showOnlyUnread ? "Nenhuma notificação nova" : "Nenhuma notificação"}
        </h3>
        <p className="text-gray-500 text-sm">
          {showOnlyUnread 
            ? "Você está em dia com suas notificações!" 
            : "Ainda não há notificações para exibir."
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <ScrollArea className="h-full">
        <div className="space-y-3">
          {notifications.map(notification => {
            const isUnread = !notification.readBy.includes(currentUser.id);
            const isExpanded = expandedId === notification.id;
            
            return (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isUnread={isUnread}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : notification.id)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onLongPress={() => {
                  setSelectedNotification(notification.id);
                  setDeleteDialogOpen(true);
                }}
                showActions={isAdmin}
              />
            );
          })}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedNotification && handleDeleteNotification(selectedNotification)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewersDialogOpen} onOpenChange={setViewersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visualizações</DialogTitle>
            <DialogDescription>
              Lista de usuários que visualizaram esta notificação
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {viewers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma visualização ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {viewers.map((viewer, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">
                      {viewer.graduation} {viewer.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
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
    const unsubscribe = onSnapshot(q, snapshot => {
      const notifs = snapshot.docs.map(doc => ({
        readBy: doc.data().readBy || [],
        type: doc.data().type,
        recipientId: doc.data().recipientId
      })).filter(notif => notif.type === 'all' || notif.recipientId === currentUser.id);
      
      const count = notifs.filter(n => !n.readBy.includes(currentUser.id)).length;
      setUnreadCount(count);
    });
    
    return () => unsubscribe();
  }, [currentUser.id]);
  
  return unreadCount;
};

export default NotificationsList;
