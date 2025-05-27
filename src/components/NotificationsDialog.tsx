
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NotificationsList from "./notifications/NotificationsList";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Mensagens
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow p-2">
          <NotificationsList showOnlyUnread={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsDialog;
