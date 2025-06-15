
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notification } from "./notifications/NotificationsList";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface NewNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  notification: Notification | null;
}

const NewNotificationDialog = ({ open, onClose, notification }: NewNotificationDialogProps) => {
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
    }, []);

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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Nova Mensagem de {notification.graduation} {notification.senderName}
                    </DialogTitle>
                    <DialogDescription className="text-gray-700 dark:text-gray-300 pt-4 whitespace-pre-wrap">
                        {notification.text}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleClose}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewNotificationDialog;
