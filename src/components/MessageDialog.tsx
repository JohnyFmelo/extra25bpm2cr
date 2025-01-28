import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessageDialog = ({ open, onOpenChange }: MessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O recado não pode estar vazio.",
      });
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, "recados"), {
        text: message.trim(),
        senderId: currentUser.id,
        senderName: currentUser.warName,
        timestamp: serverTimestamp(),
        type: "all",
      });

      toast({
        title: "Sucesso",
        description: "Recado enviado com sucesso.",
      });
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o recado.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Recado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Digite seu recado aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending}
            className="w-full"
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            Enviar para Todos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;