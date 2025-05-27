
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Clock, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onClose?: () => void;
  onLongPress?: () => void;
  showActions?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isUnread,
  isExpanded,
  onToggle,
  onMarkAsRead,
  onClose,
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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  const handleMouseDown = () => {
    if (onLongPress && showActions) {
      setTimeout(onLongPress, 1000);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-lg relative",
        isUnread 
          ? "bg-blue-50 border-blue-300 shadow-md border-2" 
          : "bg-white border-gray-200 border",
        isExpanded && "shadow-xl"
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 z-10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <CardContent className="p-6 pr-12">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  notification.isAdmin 
                    ? "bg-red-500 text-white" 
                    : "bg-blue-500 text-white"
                )}>
                  <User className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-900 text-base">
                    {notification.graduation} {notification.senderName}
                  </span>
                  <Badge 
                    variant={notification.isAdmin ? "destructive" : "secondary"}
                    className="text-xs font-semibold"
                  >
                    {notification.isAdmin ? "Admin" : "Usuário"}
                  </Badge>
                  {isUnread && (
                    <Badge className="text-xs bg-orange-500 hover:bg-orange-600 font-bold text-white">
                      NOVA
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formatTimestamp(notification.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 mt-1">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pl-13">
            <div className={cn(
              "text-base text-gray-800 leading-relaxed font-medium",
              isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
            )}>
              {notification.text}
            </div>
          </div>

          {/* Read count for admins */}
          {showActions && notification.readBy.length > 0 && isExpanded && (
            <div className="pl-13 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
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
