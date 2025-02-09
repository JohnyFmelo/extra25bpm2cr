
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
    <div className="space-y-8">
      <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-primary bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
          Painel de Controle
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <IconCard 
            icon={Clock} 
            label="Horas" 
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
          />
          <IconCard 
            icon={Calendar} 
            label="Extra" 
            onClick={onExtraClick}
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
          />
          <IconCard 
            icon={Bell} 
            label="Notificações" 
            onClick={onNotificationsClick}
            badge={unreadCount > 0 ? unreadCount : undefined}
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
          />
          {userType === "admin" && (
            <>
              <IconCard 
                icon={Pencil} 
                label="Editor" 
                onClick={onEditorClick}
                className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
              />
              <IconCard 
                icon={Users} 
                label="Usuários" 
                onClick={onUsersClick}
                className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
              />
              <IconCard 
                icon={MessageSquare} 
                label="Recados" 
                onClick={onMessageClick}
                className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
              />
            </>
          )}
          <IconCard 
            icon={FileText} 
            label="Escala" 
            onClick={onScheduleClick}
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
          />
          <IconCard 
            icon={Settings} 
            label="Configurações" 
            onClick={onSettingsClick}
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
          />
          <IconCard 
            icon={MapPinned} 
            label="Viagens" 
            onClick={onTravelClick}
            className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
