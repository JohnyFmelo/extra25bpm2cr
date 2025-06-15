
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Notification } from "./notifications/NotificationsList";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send } from 'lucide-react';

interface ReplyNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  originalNotification: Notification | null;
}

const ReplyNotificationDialog = ({ open, onClose, originalNotification }: ReplyNotificationDialogProps) => {
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || !currentUser || !originalNotification) return;

        setIsSending(true);
        try {
            await addDoc(collection(db, "recados"), {
                senderId: currentUser.id,
                senderName: currentUser.name || "Usuário anônimo",
                graduation: currentUser.rank || "",
                isAdmin: currentUser.userType === 'admin',
                text: message,
                timestamp: serverTimestamp(),
                type: 'individual',
                recipientId: originalNotification.senderId,
                readBy: [],
            });
            toast({
                title: "Sucesso!",
                description: "Sua resposta foi enviada.",
            });
            setMessage('');
            onClose();
        } catch (error) {
            console.error("Error sending reply:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível enviar a resposta.",
            });
        } finally {
            setIsSending(false);
        }
    };

    if (!originalNotification) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Responder Mensagem</DialogTitle>
                    <DialogDescription>
                        Para: {originalNotification.graduation} {originalNotification.senderName}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="Digite sua resposta aqui..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="w-full"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={isSending || !message.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        {isSending ? 'Enviando...' : 'Enviar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReplyNotificationDialog;
