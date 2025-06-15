
import { useState, useEffect } from "react";
import { Clock, X, User, Shield, MessageSquare, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";

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
  const { user: currentUser } = useUser();
  const [recipientInfo, setRecipientInfo] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipientInfo = async () => {
        if (notification.type === 'individual' && notification.recipientId) {
            if (notification.recipientId === currentUser?.id) {
                setRecipientInfo("Você");
                return;
            }
            try {
                const userDocRef = doc(db, "users", notification.recipientId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setRecipientInfo(`${userData.graduation || ''} ${userData.name || ''}`.trim());
                } else {
                    setRecipientInfo("Destinatário desconhecido");
                }
            } catch (error) {
                console.error("Error fetching recipient info:", error);
                setRecipientInfo(null);
            }
        } else {
            setRecipientInfo(null);
        }
    };
    fetchRecipientInfo();
  }, [notification.type, notification.recipientId, currentUser?.id]);


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
      return <Shield className="h-4 w-4 text-red-500" />;
    }
    return <User className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
        ${isUnread 
          ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/60 shadow-lg hover:shadow-xl' 
          : 'bg-white/70 backdrop-blur-sm border-slate-200/50 hover:border-slate-300/70 hover:shadow-md'
        }
        hover:scale-[1.02] active:scale-[0.98]
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onToggle}
    >
      {/* Gradient overlay for unread */}
      {isUnread && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5 pointer-events-none" />
      )}

      {/* Status indicator */}
      <div className={`absolute top-0 left-0 w-full h-1 ${isUnread ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-200'}`} />

      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 hover:text-red-600 z-10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`
              p-2 rounded-xl transition-colors duration-200
              ${notification.isAdmin 
                ? 'bg-red-100 text-red-600' 
                : 'bg-blue-100 text-blue-600'
              }
            `}>
              {getSenderIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-x-2 gap-y-1 mb-1 flex-wrap">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">
                      {notification.graduation} {notification.senderName}
                    </h3>
                    {notification.isAdmin && (
                      <Badge variant="destructive" className="text-xs px-2 py-0">
                        Admin
                      </Badge>
                    )}
                </div>
                {recipientInfo && (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{recipientInfo}</span>
                    </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(notification.timestamp)}</span>
                {notification.type === 'individual' && (
                  <>
                    <span>•</span>
                    <MessageSquare className="h-3 w-3" />
                    <span>Pessoal</span>
                  </>
                )}
              </div>
            </div>
            
            {isUnread && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Nova
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Content preview */}
        <div className="mb-4">
          <p className={`
            text-slate-700 text-sm leading-relaxed
            ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}
          `}>
            {notification.text}
          </p>
          
          {!isExpanded && notification.text.length > 100 && (
            <button className="text-blue-600 text-xs mt-1 hover:text-blue-700 transition-colors">
              Ver mais...
            </button>
          )}
        </div>

        {/* Expanded actions */}
        {isExpanded && (
          <div className="pt-4 border-t border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isUnread && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead();
                    }}
                    className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Marcar como lida
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${notification.type === 'individual' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-green-100 text-green-700'
                  }
                `}>
                  {notification.type === 'individual' ? 'Mensagem Pessoal' : 'Mensagem Geral'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
