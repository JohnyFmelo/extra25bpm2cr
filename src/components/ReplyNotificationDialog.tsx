
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
                senderName: currentUser.warName || "Usuário anônimo",
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
                <div className="py-4 space-y-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                           Em resposta a:
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">
                            {originalNotification.text}
                        </p>
                    </div>
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
