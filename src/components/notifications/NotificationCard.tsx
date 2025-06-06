
import { useState } from "react";
import { Clock, X, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timestamp } from "firebase/firestore";

interface Notification {
  id: string;
  text: string;
  timestamp: Timestamp | null;
  senderName: string;
  graduation: string;
  isAdmin: boolean;
  readBy: string[];
  type: 'all' | 'individual';
  recipientId: string | null;
}

interface NotificationCardProps {
  notification: Notification;
  isUnread: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkAsRead: () => void;
  onLongPress: () => void;
  showActions: boolean;
  onClose?: () => void;
}

const NotificationCard = ({
  notification,
  isUnread,
  isExpanded,
  onToggle,
  onMarkAsRead,
  onLongPress,
  showActions,
  onClose
}: NotificationCardProps) => {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      onLongPress();
    }, 800);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Data indisponível";
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const minutes = Math.floor(diffInHours * 60);
        return minutes <= 1 ? "Agora" : `${minutes}min atrás`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h atrás`;
      } else {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (error) {
      return "Data indisponível";
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  return (
    <Card 
      className={`
        relative transition-all duration-200 cursor-pointer border-l-4 hover:shadow-md
        ${isUnread 
          ? 'border-l-blue-500 bg-blue-50 shadow-sm' 
          : 'border-l-gray-300 bg-white'
        }
        ${isExpanded ? 'shadow-lg' : ''}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onToggle}
    >
      {/* Botão de fechar */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 z-10"
          onClick={handleClose}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <CardContent className="p-4 pr-10">
        {/* Header da notificação */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {notification.isAdmin ? (
              <Shield className="h-4 w-4 text-red-500" />
            ) : (
              <User className="h-4 w-4 text-blue-500" />
            )}
            <span className="font-semibold text-gray-900 text-sm">
              {notification.graduation} {notification.senderName}
            </span>
            {isUnread && (
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {formatTimestamp(notification.timestamp)}
          </div>
        </div>

        {/* Conteúdo da mensagem */}
        <div className="text-gray-800 text-sm leading-relaxed">
          {isExpanded ? (
            <p className="whitespace-pre-wrap break-words">{notification.text}</p>
          ) : (
            <p className="line-clamp-2 whitespace-pre-wrap break-words">
              {notification.text}
            </p>
          )}
        </div>

        {/* Ações */}
        {isExpanded && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              {isUnread && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  className="text-xs"
                >
                  Marcar como lida
                </Button>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {notification.type === 'individual' ? 'Mensagem pessoal' : 'Mensagem geral'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
