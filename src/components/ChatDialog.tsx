
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from 'lucide-react';
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MessageBubble from './MessageBubble';
import { Skeleton } from './ui/skeleton';

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  otherUser: { id: string; name: string; rank: string; };
}

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Timestamp | null;
}

const ChatDialog = ({ open, onClose, otherUser }: ChatDialogProps) => {
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            setMessages([]);
            return;
        }

        if (!currentUser || !otherUser.id) {
            setMessages([]);
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        const recadosRef = collection(db, "recados");

        const q1 = query(recadosRef, 
            where('type', '==', 'individual'),
            where('senderId', '==', currentUser.id),
            where('recipientId', '==', otherUser.id)
        );
        const q2 = query(recadosRef, 
            where('type', '==', 'individual'),
            where('senderId', '==', otherUser.id),
            where('recipientId', '==', currentUser.id)
        );
        
        let allMessages: Message[] = [];

        const processSnapshots = () => {
             setMessages(allMessages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0)));
             if(isLoading) setIsLoading(false);
        };

        const unsub1 = onSnapshot(q1, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            allMessages = [...allMessages.filter(m => m.senderId !== currentUser.id), ...fetchedMessages];
            processSnapshots();
        });

        const unsub2 = onSnapshot(q2, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            allMessages = [...allMessages.filter(m => m.senderId !== otherUser.id), ...fetchedMessages];
            processSnapshots();
        });

        return () => {
            unsub1();
            unsub2();
        };

    }, [currentUser, otherUser.id, open]);

    useEffect(() => {
        if(scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if(viewport) {
                setTimeout(() => viewport.scrollTop = viewport.scrollHeight, 100);
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim() || !currentUser) return;

        setIsSending(true);
        try {
            await addDoc(collection(db, "recados"), {
                senderId: currentUser.id,
                senderName: currentUser.warName || "Usuário anônimo",
                graduation: currentUser.rank || "",
                isAdmin: currentUser.userType === 'admin',
                text: message,
                timestamp: serverTimestamp(),
                type: 'individual',
                recipientId: otherUser.id,
                readBy: [currentUser.id],
                hiddenFor: []
            });
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar a mensagem." });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b dark:border-slate-700">
                    <DialogTitle className="truncate">{otherUser.rank} {otherUser.name}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-800/50" ref={scrollAreaRef}>
                    <div className="p-4 flex flex-col space-y-2">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-3/4 self-start rounded-xl" />
                            <Skeleton className="h-16 w-3/4 self-end rounded-xl" />
                            <Skeleton className="h-8 w-1/2 self-start rounded-xl" />
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.senderId === currentUser?.id} />
                        ))
                    ) : (
                       <div className="flex items-center justify-center h-full text-slate-500">
                           <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                       </div>
                    )}
                    </div>
                </ScrollArea>
                <DialogFooter className="p-2 border-t dark:border-slate-700 bg-white dark:bg-slate-900">
                    <Textarea 
                        placeholder="Digite sua mensagem..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={1}
                        className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button onClick={handleSend} disabled={isSending || !message.trim()} size="icon" className="rounded-full">
                        <Send className="h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChatDialog;

