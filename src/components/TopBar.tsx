
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import ProfileUpdateDialog from "./ProfileUpdateDialog";
import PasswordChangeDialog from "./PasswordChangeDialog";

const TopBar = () => {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="bg-primary shadow-md">
      <div className="flex h-16 items-center px-6 gap-4 max-w-7xl mx-auto">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {userData.rank} {userData.warName}
          </h2>
        </div>
        
        {userData.userType === "admin" && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMessagesDialog(prev => !prev)}
            className="text-primary-foreground hover:bg-primary-light"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Enviar Recado</span>
          </Button>
        )}
        
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
        
        {showMessagesDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-4 bg-primary rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Enviar Recado</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMessagesDialog(false)}
                    className="text-white hover:bg-primary-dark"
                  >
                    X
                  </Button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-auto">
                <Messages onClose={() => setShowMessagesDialog(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;

// Import Messages at the top of the file, after importing other dependencies:
import Messages from "./Messages";
