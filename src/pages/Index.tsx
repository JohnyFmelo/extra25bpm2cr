
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TimeSlotsList from "@/components/TimeSlotsList";
import UsersList from "@/components/UsersList";
import ProfileUpdateDialog from "@/components/ProfileUpdateDialog";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import InformationDialog from "@/components/InformationDialog";
import ScheduleList from "@/components/ScheduleList";
import Messages from "@/components/Messages";
import NotificationsList from "@/components/NotificationsList";
import { TravelManagement } from "@/components/TravelManagement";
import MainDashboard from "@/components/index/MainDashboard";
import ContentWrapper from "@/components/index/ContentWrapper";
import SettingsContent from "@/components/index/SettingsContent";

const Index = () => {
  const [activeTab, setActiveTab] = useState("main");
  const [isLocked, setIsLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleBackClick = () => {
    setActiveTab("main");
  };

  return (
    <div className="relative min-h-screen bg-[#E8F1F2]">
      <div className="pt-8 px-6 pb-16 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="hidden">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="travel">Travel</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <MainDashboard 
              userType={user.userType}
              onExtraClick={() => setActiveTab("extra")}
              onNotificationsClick={() => setActiveTab("notifications")}
              onEditorClick={() => setActiveTab("editor")}
              onUsersClick={() => setActiveTab("users")}
              onMessageClick={() => setActiveTab("messages")}
              onScheduleClick={() => setActiveTab("schedule")}
              onSettingsClick={() => setActiveTab("settings")}
              onTravelClick={() => setActiveTab("travel")}
            />
          </TabsContent>

          <TabsContent value="extra">
            <ContentWrapper onBackClick={handleBackClick}>
              <TimeSlotsList />
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="settings">
            <ContentWrapper onBackClick={handleBackClick}>
              <SettingsContent 
                onProfileClick={() => setShowProfileDialog(true)}
                onPasswordClick={() => setShowPasswordDialog(true)}
                onInformationClick={() => setShowInformationDialog(true)}
              />
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="editor">
            <ContentWrapper onBackClick={handleBackClick}>
              <WeeklyCalendar 
                isLocked={isLocked}
                onLockChange={setIsLocked}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                showControls={true}
              />
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="users">
            <ContentWrapper onBackClick={handleBackClick}>
              <div className="bg-white rounded-xl shadow-lg">
                <UsersList />
              </div>
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="schedule">
            <ContentWrapper onBackClick={handleBackClick}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Escala</h2>
                <ScheduleList />
              </div>
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="messages">
            <ContentWrapper onBackClick={handleBackClick}>
              <div className="bg-white rounded-xl shadow-lg">
                <Messages />
              </div>
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="notifications">
            <ContentWrapper onBackClick={handleBackClick}>
              <div className="bg-white rounded-xl shadow-lg">
                <NotificationsList />
              </div>
            </ContentWrapper>
          </TabsContent>

          <TabsContent value="travel">
            <ContentWrapper onBackClick={handleBackClick}>
              <div className="bg-white rounded-xl shadow-lg">
                <TravelManagement />
              </div>
            </ContentWrapper>
          </TabsContent>
        </Tabs>

        {showProfileDialog && (
          <ProfileUpdateDialog
            open={showProfileDialog}
            onOpenChange={setShowProfileDialog}
            userData={user}
          />
        )}
        
        {showPasswordDialog && (
          <PasswordChangeDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
            userId={user.id}
            currentPassword={user.password}
          />
        )}

        {showInformationDialog && (
          <InformationDialog
            open={showInformationDialog}
            onOpenChange={setShowInformationDialog}
            isAdmin={user.userType === "admin"}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
