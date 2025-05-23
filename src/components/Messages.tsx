
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MessagesProps {
  onClose?: () => void;
}

const Messages = ({ onClose }: MessagesProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [users, setUsers] = useState<Array<{ id: string; warName: string }>>([]);
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          warName: doc.data().warName || "Usuário sem nome"
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    
    fetchUsers();
  }, []);

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
        graduation: currentUser.rank || "",
        timestamp: serverTimestamp(),
        type: selectedUser === "all" ? "all" : "individual",
        recipientId: selectedUser === "all" ? null : selectedUser,
        isAdmin: currentUser.userType === "admin"
      });

      toast({
        title: "Sucesso",
        description: "Recado enviado com sucesso.",
      });
      setMessage("");
      if (onClose) {
        onClose();
      }
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
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Destinatário</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o destinatário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.warName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            placeholder="Digite seu recado aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSendMessage}
            disabled={isSending}
            className="flex-1"
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            {selectedUser === "all" ? "Enviar para Todos" : "Enviar"}
          </Button>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-24"
            >
              Fechar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
