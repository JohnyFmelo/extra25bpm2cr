import { useState, useEffect } from "react";
import { Bell, BellDot } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  type: 'all' | 'individual';
  recipientId: string | null;
  readBy: string[];
}

const NotificationsList = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const messagesQuery = query(
      collection(db, "recados"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        readBy: doc.data().readBy || [],
      })) as Message[];

      setMessages(newMessages);
      
      // Check for unread messages
      const unreadExists = newMessages.some(
        (msg) => 
          !msg.readBy.includes(currentUser.id) && 
          (msg.type === 'all' || msg.recipientId === currentUser.id)
      );
      setHasUnread(unreadExists);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const markAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, "recados", messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(currentUser.id)
      });
      
      toast({
        title: "Sucesso",
        description: "Recado marcado como lido",
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível marcar o recado como lido",
      });
    }
  };

  const isMessageForUser = (message: Message) => {
    return message.type === 'all' || message.recipientId === currentUser.id;
  };

  const isMessageUnread = (message: Message) => {
    return !message.readBy.includes(currentUser.id);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {hasUnread ? (
            <BellDot className="h-5 w-5 text-primary" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-4">
            {messages
              .filter(isMessageForUser)
              .map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg transition-colors ${
                    isMessageUnread(message)
                      ? "bg-primary/10 hover:bg-primary/20"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => isMessageUnread(message) && markAsRead(message.id)}
                  role="button"
                  tabIndex={0}
                >
                  <p className="font-medium">{message.senderName}</p>
                  <p className="text-sm text-gray-600">{message.text}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {message.timestamp?.toDate().toLocaleString()}
                  </p>
                </div>
              ))}
            {messages.filter(isMessageForUser).length === 0 && (
              <p className="text-center text-gray-500">
                Nenhuma notificação disponível
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsList;