
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useState, useEffect } from "react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useVersioning } from "@/hooks/useVersioning";
import { useUser } from "@/context/UserContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TopBar = () => {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userData, setUserData] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const {
    user,
    setUser
  } = useUser();
  const {
    currentSystemVersion
  } = useVersioning();

  // Listen for real-time updates from Firebase
  useEffect(() => {
    if (!userData?.id) return;
    const userDocRef = doc(db, "users", userData.id);
    const unsubscribe = onSnapshot(userDocRef, doc => {
      if (doc.exists()) {
        const firebaseData = doc.data();
        const updatedUserData = {
          ...userData,
          warName: firebaseData.warName || userData.warName,
          rank: firebaseData.rank || userData.rank,
          service: firebaseData.service || userData.service,
          rgpm: firebaseData.rgpm || userData.rgpm,
          email: firebaseData.email || userData.email,
          registration: firebaseData.registration || userData.registration
        };

        // Update both local state and localStorage
        setUserData(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));

        // Update context as well
        setUser(updatedUserData);
        console.log("TopBar - Real-time update from Firebase:", updatedUserData);
      }
    });
    return () => unsubscribe();
  }, [userData?.id, setUser]);

  // Listen for user data updates from localStorage events
  useEffect(() => {
    const handleUserDataUpdate = (event: CustomEvent) => {
      setUserData(event.detail);
    };
    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, []);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get service display text
  const getServiceDisplay = (service: string, userType: string) => {
    if (service) {
      return service;
    }
    // Fallback to userType if service is not available
    return userType === "admin" ? "Administrador" : "Usuário";
  };

  return (
    <header className="bg-gradient-to-r from-primary-dark via-primary to-primary-light sticky top-0 z-50 shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <div className="flex-1 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-white text-primary font-semibold">
              {getInitials(userData.warName || "U")}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-white">
              {userData.rank} {userData.warName}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/80">{getServiceDisplay(userData.service, userData.userType)}</p>
              {userData.rgpm && <span className="text-xs text-white/60">• RGPM: {userData.rgpm}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentSystemVersion && (
            <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
              v{currentSystemVersion}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfileDialog(true)}
            className="text-white hover:bg-white/10"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
        
        {showProfileDialog && (
          <ProfileUpdateDialog 
            open={showProfileDialog} 
            onOpenChange={setShowProfileDialog} 
            userData={userData} 
          />
        )}
        
        {showPasswordDialog && (
          <PasswordChangeDialog 
            open={showPasswordDialog} 
            onOpenChange={setShowPasswordDialog} 
            userId={userData.id} 
            currentPassword={userData.password} 
          />
        )}
      </div>
    </header>
  );
};

export default TopBar;
