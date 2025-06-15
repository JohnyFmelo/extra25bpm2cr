
import { useState } from "react";
import { Clock, X, User, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const getSenderIcon = () => {
    if (notification.isAdmin) {
      return <Shield className="h-5 w-5 text-red-500" />;
    }
    return <User className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div
      className="relative p-6 cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onToggle}
    >
      {/* Indicator bar for unread */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}

      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 z-10 opacity-70 hover:opacity-100 transition-opacity"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="pr-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getSenderIcon()}
              <div>
                <h3 className="font-semibold text-slate-800 text-base">
                  {notification.graduation} {notification.senderName}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(notification.timestamp)}</span>
                  {notification.type === 'individual' && (
                    <>
                      <span>•</span>
                      <MessageSquare className="h-3 w-3" />
                      <span>Mensagem pessoal</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isUnread && (
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-slate-700 text-sm leading-relaxed mb-4">
          {isExpanded ? (
            <p className="whitespace-pre-wrap break-words">{notification.text}</p>
          ) : (
            <p className="line-clamp-3 whitespace-pre-wrap break-words">
              {notification.text}
            </p>
          )}
        </div>

        {/* Footer with actions */}
        {isExpanded && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-3">
              {isUnread && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  Marcar como lida
                </Button>
              )}
            </div>
            
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>
                {notification.type === 'individual' ? 'Pessoal' : 'Geral'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
