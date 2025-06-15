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
      return <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
    return <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-lg border-l-4
        transition-shadow duration-300 cursor-pointer
        ${isUnread 
          ? 'border-blue-500 bg-blue-50 dark:bg-slate-800/60' 
          : 'border-transparent bg-white dark:bg-slate-800/30'
        }
        shadow-sm hover:shadow-lg border border-slate-200/80 dark:border-slate-700/50
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onToggle}
    >
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${notification.isAdmin 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }
                `}>
                    {getSenderIcon()}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                          {notification.graduation} {notification.senderName}
                        </h3>
                        {recipientInfo && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium truncate">{recipientInfo}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(notification.timestamp)}</span>
                        </div>
                        {notification.isAdmin && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <Badge variant="destructive" className="text-xs px-1.5 py-0 leading-tight">
                                    Admin
                                </Badge>
                            </>
                        )}
                        {notification.type === 'individual' && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>Pessoal</span>
                          </>
                        )}
                    </div>
                </div>
            </div>
            
            {isUnread && (
                <div className="flex-shrink-0 pt-1">
                    <div className="h-2.5 w-2.5 bg-blue-500 rounded-full" title="Não lida"></div>
                </div>
            )}
        </div>

        {/* Content preview */}
        <div className={`pl-14 transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
          <p className={`
            text-slate-600 dark:text-slate-300 text-sm leading-relaxed
            ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'}
          `}>
            {notification.text}
          </p>
          
          {!isExpanded && notification.text.length > 100 && (
            <button className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline font-medium">
              Ver mais...
            </button>
          )}
        </div>

        {/* Expanded actions */}
        {isExpanded && (
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-700/50 ml-14">
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
                    className="text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Marcar como lida
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <div className={`
                  px-2 py-1 rounded-md text-xs font-medium
                  ${notification.type === 'individual' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
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
