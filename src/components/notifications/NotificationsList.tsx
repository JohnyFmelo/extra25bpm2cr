import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc, getDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationCard from "./NotificationCard";
import { Timestamp } from "firebase/firestore";
import { Bell, Sparkles } from "lucide-react";
import { useUser } from "@/context/UserContext";
import ChatDialog from '../ChatDialog';

export interface Notification {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null;
  senderName: string;
  graduation: string;
  isAdmin: boolean;
  readBy: string[];
  type: 'all' | 'individual';
  recipientId: string | null;
  hiddenFor?: string[];
}

interface NotificationsListProps {
  showOnlyUnread?: boolean;
}

const NotificationsList = ({
  showOnlyUnread = false
}: NotificationsListProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [viewersDialogOpen, setViewersDialogOpen] = useState(false);
  const [viewers, setViewers] = useState<{
    name: string;
    graduation: string;
  }[]>([]);
  const { toast } = useToast();
  
  const { user: currentUser } = useUser();
  const isAdmin = currentUser?.userType === "admin";
  const [chatUser, setChatUser] = useState<{ id: string; name: string; rank: string; } | null>(null);

  const expandedCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }

    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const allNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        readBy: doc.data().readBy || [],
        hiddenFor: doc.data().hiddenFor || []
      }) as Notification);
      
      const userVisibleNotifs = allNotifs.filter(notif => {
        if (notif.hiddenFor?.includes(currentUser.id!)) {
            return false;
        }

        if (isAdmin) {
          return true;
        }

        if (notif.type === 'all') {
            return true;
        }

        if (notif.type === 'individual') {
            return notif.senderId === currentUser.id || notif.recipientId === currentUser.id;
        }
        
        return false;
      });

      const generalNotifications = userVisibleNotifs.filter(n => n.type === 'all');
      const individualMessages = userVisibleNotifs.filter(n => n.type === 'individual');

      const conversations = new Map<string, Notification[]>();
      individualMessages.forEach(msg => {
          if (!msg.recipientId || !msg.senderId) return;
          const otherUserId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
          const conversationId = [currentUser.id!, otherUserId].sort().join('__');
          
          if (!conversations.has(conversationId)) {
              conversations.set(conversationId, []);
          }
          conversations.get(conversationId)!.push(msg);
      });

      const conversationSummaries = Array.from(conversations.entries()).map(([conversationId, msgs]) => {
          const latestMessage = msgs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))[0];
          const isUnread = msgs.some(m => !m.readBy.includes(currentUser.id!));
          return {
              ...latestMessage,
              id: conversationId,
              readBy: isUnread ? [] : [currentUser.id!],
          };
      });

      const displayItems = [...generalNotifications, ...conversationSummaries]
          .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      
      const filteredNotifs = showOnlyUnread 
        ? displayItems.filter(n => currentUser.id && !n.readBy.includes(currentUser.id)) 
        : displayItems;
      
      setNotifications(filteredNotifs as Notification[]);
    });

    return () => unsubscribe();
  }, [currentUser?.id, showOnlyUnread, isAdmin]);

  useEffect(() => {
    if (expandedCardRef.current) {
      expandedCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [expandedId]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Por favor, faça login novamente."
      });
      return;
    }
    try {
      const notifRef = doc(db, "recados", notificationId);
      await updateDoc(notifRef, {
        readBy: arrayUnion(currentUser.id)
      });
      toast({
        title: "Sucesso",
        description: "Notificação marcada como lida."
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

  const handleOpenChat = async (notification: Notification) => {
    if (!currentUser) return;
    const isMyMessage = notification.senderId === currentUser.id;
    const otherUserId = isMyMessage ? notification.recipientId : notification.senderId;

    if (!otherUserId) {
        toast({ variant: "destructive", title: "Erro", description: "Não é possível abrir o chat para esta mensagem." });
        return;
    }

    if (!isMyMessage) {
        setChatUser({
            id: notification.senderId,
            name: notification.senderName,
            rank: notification.graduation
        });
    } else {
        try {
            const userDocRef = doc(db, "users", otherUserId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setChatUser({
                    id: otherUserId,
                    name: userData.warName || "Usuário",
                    rank: userData.rank || ""
                });
            } else {
                toast({ variant: "destructive", title: "Erro", description: "Destinatário não encontrado." });
            }
        } catch (e) {
            console.error("Error fetching recipient info for chat:", e);
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar dados do destinatário." });
        }
    }
  };

  const handleCloseNotification = async (notificationId: string) => {
    if (!currentUser?.id) return;

    if (notificationId.includes('__')) { // It's a conversation
        const [user1, user2] = notificationId.split('__');
        const recadosRef = collection(db, "recados");

        const q1 = query(recadosRef,
            where('type', '==', 'individual'),
            where('senderId', '==', user1),
            where('recipientId', '==', user2)
        );
        const q2 = query(recadosRef,
            where('type', '==', 'individual'),
            where('senderId', '==', user2),
            where('recipientId', '==', user1)
        );

        try {
            const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            const batch = writeBatch(db);
            snapshot1.docs.forEach(doc => batch.update(doc.ref, { hiddenFor: arrayUnion(currentUser.id) }));
            snapshot2.docs.forEach(doc => batch.update(doc.ref, { hiddenFor: arrayUnion(currentUser.id) }));
            await batch.commit();
        } catch (error) {
            console.error("Error hiding conversation:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível ocultar a conversa.",
            });
        }
    } else { // It's a single notification
        try {
            const notifRef = doc(db, "recados", notificationId);
            await updateDoc(notifRef, {
                hiddenFor: arrayUnion(currentUser.id)
            });
        } catch (error) {
            console.error("Error hiding notification:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível ocultar a notificação.",
            });
        }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (notificationId.includes('__')) { // It's a conversation
        const [user1, user2] = notificationId.split('__');
        const recadosRef = collection(db, "recados");

        const q1 = query(recadosRef,
            where('type', '==', 'individual'),
            where('senderId', '==', user1),
            where('recipientId', '==', user2)
        );
        const q2 = query(recadosRef,
            where('type', '==', 'individual'),
            where('senderId', '==', user2),
            where('recipientId', '==', user1)
        );

        try {
            const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            const batch = writeBatch(db);
            snapshot1.docs.forEach(doc => batch.delete(doc.ref));
            snapshot2.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            setDeleteDialogOpen(false);
            toast({
                title: "Sucesso",
                description: "Conversa excluída com sucesso."
            });
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível excluir a conversa."
            });
        }
    } else {
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
    }
  };

  const handleViewers = async (readBy: string[]) => {
    try {
      const viewersPromises = readBy.map(async (userId) => {
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
      const validViewers = viewersData.filter((viewer): viewer is { name: string; graduation: string } => 
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
            <Bell className="h-10 w-10 text-blue-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
        
        <div className="max-w-md">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            {showOnlyUnread ? "Tudo em dia!" : "Nenhuma notificação"}
          </h3>
          <p className="text-slate-500 leading-relaxed">
            {showOnlyUnread 
              ? "Você está em dia com suas notificações. Continue assim!" 
              : "Quando houver novas mensagens, elas aparecerão aqui para você."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0">
      {/* Header stats */}
      {!showOnlyUnread && currentUser?.id && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-4 border border-blue-200/50 dark:border-slate-700/50 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Central de Notificações</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {notifications.filter(n => !n.readBy.includes(currentUser.id)).length} não lidas de {notifications.length} total
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm rounded-lg p-3">
              <Bell className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Notifications grid COM SCROLL */}
      <ScrollArea className="flex-1 max-h-[60vh] min-h-[256px] pr-1">
        <div className="space-y-4">
          {notifications.map((notification, index) => {
            if (!currentUser?.id) return null;

            const isUnread = !notification.readBy.includes(currentUser.id);
            const isExpanded = expandedId === notification.id;
            // O ref só no expandido 
            const cardRef = isExpanded ? expandedCardRef : null;

            return (
              <div
                key={notification.id}
                className="animate-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
                ref={cardRef}
              >
                <NotificationCard
                  notification={notification}
                  isUnread={isUnread}
                  isExpanded={isExpanded}
                  onToggle={() => {
                    if (notification.type === 'individual') {
                        handleOpenChat(notification);
                    } else {
                        setExpandedId(isExpanded ? null : notification.id);
                    }
                  }}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onLongPress={() => {
                    if (isAdmin) {
                      setSelectedNotification(notification.id);
                      setDeleteDialogOpen(true);
                    }
                  }}
                  onClose={() => handleCloseNotification(notification.id)}
                  showActions={isAdmin}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {chatUser && (
        <ChatDialog
            open={!!chatUser}
            onClose={() => setChatUser(null)}
            otherUser={chatUser}
        />
      )}

      {/* AlertDialog e viewers Dialog: sem mudanças */}
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
  const { user: currentUser } = useUser();
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadCount(0);
      return;
    }
    
    const q = query(collection(db, "recados"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      if (!isInitialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newNotif = { id: change.doc.id, ...change.doc.data() } as Notification;
            
            const isForCurrentUser = newNotif.type === 'all' || newNotif.recipientId === currentUser.id;

            if (isForCurrentUser) {
              window.dispatchEvent(new CustomEvent('newNotification', { 
                detail: newNotif 
              }));
            }
          }
        });
      }

      const notifs = snapshot.docs.map(doc => ({
        readBy: doc.data().readBy || [],
        type: doc.data().type,
        recipientId: doc.data().recipientId
      })).filter(notif => 
        notif.type === 'all' || notif.recipientId === currentUser.id
      );
      
      const count = notifs.filter(n => currentUser.id && !n.readBy.includes(currentUser.id)).length;
      setUnreadCount(count);
      // Dispatch event to notify about notifications count globally
      window.dispatchEvent(new CustomEvent('notificationsUpdate', { 
        detail: { count: count } 
      }));

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  return unreadCount;
};

export default NotificationsList;
