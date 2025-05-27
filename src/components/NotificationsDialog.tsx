
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotificationsList from "./notifications/NotificationsList";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            📬 Mensagens
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow px-2">
          <NotificationsList showOnlyUnread={false} showCloseButton={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsDialog;
