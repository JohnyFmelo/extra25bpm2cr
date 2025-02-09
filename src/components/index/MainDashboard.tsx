
import IconCard from "@/components/IconCard";
import { Clock, Calendar, Pencil, FileText, Settings, Users, Bell, MessageSquare, MapPinned } from "lucide-react";
import { useNotifications } from "@/components/NotificationsList";

interface MainDashboardProps {
  userType: string;
  onExtraClick: () => void;
  onNotificationsClick: () => void;
  onEditorClick: () => void;
  onUsersClick: () => void;
  onMessageClick: () => void;
  onScheduleClick: () => void;
  onSettingsClick: () => void;
  onTravelClick: () => void;
}

const MainDashboard = ({
  userType,
  onExtraClick,
  onNotificationsClick,
  onEditorClick,
  onUsersClick,
  onMessageClick,
  onScheduleClick,
  onSettingsClick,
  onTravelClick,
}: MainDashboardProps) => {
  const unreadCount = useNotifications();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <IconCard icon={Clock} label="Horas" />
      <IconCard icon={Calendar} label="Extra" onClick={onExtraClick} />
      <IconCard 
        icon={Bell} 
        label="Notificações" 
        onClick={onNotificationsClick}
        badge={unreadCount > 0 ? unreadCount : undefined}
      />
      {userType === "admin" && (
        <>
          <IconCard icon={Pencil} label="Editor" onClick={onEditorClick} />
          <IconCard icon={Users} label="Usuários" onClick={onUsersClick} />
          <IconCard icon={MessageSquare} label="Recados" onClick={onMessageClick} />
        </>
      )}
      <IconCard icon={FileText} label="Escala" onClick={onScheduleClick} />
      <IconCard icon={Settings} label="Configurações" onClick={onSettingsClick} />
      <IconCard icon={MapPinned} label="Viagens" onClick={onTravelClick} />
    </div>
  );
};

export default MainDashboard;
