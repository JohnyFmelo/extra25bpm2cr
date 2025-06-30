
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notification } from "./notifications/NotificationsList";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { User, Shield, Eye, Reply } from "lucide-react";

interface NewNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  notification: Notification | null;
  onReply: (notification: Notification) => void;
}

const NewNotificationDialog = ({ open, onClose, notification, onReply }: NewNotificationDialogProps) => {
    const { toast } = useToast();
    const { user: currentUser } = useUser();

    const handleClose = async () => {
        if (notification && currentUser) {
            try {
                if (!notification.readBy.includes(currentUser.id)) {
                    const notifRef = doc(db, "recados", notification.id);
                    await updateDoc(notifRef, {
                        readBy: arrayUnion(currentUser.id),
                    });
                }
            } catch (error) {
                console.error("Error marking notification as read:", error);
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível marcar a notificação como lida.",
                });
            }
        }
        onClose();
    };

    if (!notification) {
        return null;
    }

    const handleReplyClick = () => {
      if (notification) {
          onReply(notification);
      }
    };

    const getSenderIcon = () => {
        if (notification.isAdmin) {
          return <Shield className="h-6 w-6 text-red-600" />;
        }
        return <User className="h-6 w-6 text-blue-600" />;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-xl shadow-2xl border-0">
                <DialogHeader className="p-6 pb-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                    <div className="flex items-center space-x-4">
                        <div className={`
                          flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                          ${notification.isAdmin 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                          }
                        `}>
                            {getSenderIcon()}
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                Nova Mensagem
                            </DialogTitle>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                De: {notification.graduation} {notification.senderName}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 max-h-[50vh] overflow-y-auto">
                     <p className="text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {notification.text}
                    </p>
                </div>
                
                <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700 sm:justify-between w-full">
                    {notification.senderId !== currentUser?.id ? (
                      <Button onClick={handleReplyClick} variant="outline">
                        <Reply className="mr-2" />
                        Responder
                      </Button>
                    ) : <div />}
                    <Button onClick={handleClose}>
                        <Eye className="mr-2" />
                        Marcar como lida e fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewNotificationDialog;
