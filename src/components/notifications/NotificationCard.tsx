
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Clock, User } from "lucide-react";

interface NotificationCardProps {
  notification: {
    id: string;
    text: string;
    timestamp: Timestamp | null;
    senderName: string;
    graduation: string;
    isAdmin: boolean;
    readBy: string[];
    type: 'all' | 'individual';
    recipientId: string | null;
  };
  isUnread: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkAsRead: () => void;
  onLongPress?: () => void;
  showActions?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isUnread,
  isExpanded,
  onToggle,
  onMarkAsRead,
  onLongPress,
  showActions = false
}) => {
  const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Data desconhecida";
    
    try {
      return formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return "Data inválida";
    }
  };

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead();
    }
    onToggle();
  };

  const handleMouseDown = () => {
    if (onLongPress && showActions) {
      setTimeout(onLongPress, 1000);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-md",
        isUnread 
          ? "bg-blue-50 border-blue-200 shadow-sm" 
          : "bg-white border-gray-200",
        isExpanded && "shadow-lg"
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                  notification.isAdmin 
                    ? "bg-red-100 text-red-700" 
                    : "bg-blue-100 text-blue-700"
                )}>
                  <User className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">
                    {notification.graduation} {notification.senderName}
                  </span>
                  <Badge 
                    variant={notification.isAdmin ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {notification.isAdmin ? "Admin" : "Usuário"}
                  </Badge>
                  {isUnread && (
                    <Badge variant="default" className="text-xs bg-blue-500">
                      Nova
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(notification.timestamp)}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pl-10">
            <p className={cn(
              "text-sm text-gray-700 leading-relaxed",
              isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
            )}>
              {notification.text}
            </p>
          </div>

          {/* Read count for admins */}
          {showActions && notification.readBy.length > 0 && isExpanded && (
            <div className="pl-10 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Visualizado por {notification.readBy.length} pessoa{notification.readBy.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
