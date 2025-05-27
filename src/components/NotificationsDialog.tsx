
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotificationsList from "./notifications/NotificationsList";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
            📢 Central de Mensagens
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden mt-4">
          <NotificationsList showOnlyUnread={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsDialog;
