
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Globe, Clock, MessageSquare, Info } from "lucide-react";
import IconCard from "@/components/IconCard";
import InformationDialog from "@/components/InformationDialog";
import NotificationsList, { useNotifications } from "@/components/NotificationsList";

const Index = () => {
  const [showMessages, setShowMessages] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [availableTrips, setAvailableTrips] = useState(0);
  const unreadCount = useNotifications();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";

  useEffect(() => {
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date();
      const openTrips = snapshot.docs.filter(doc => {
        const travel = doc.data();
        const travelDate = new Date(travel.startDate);
        return travelDate >= today && !travel.isLocked && !travel.archived;
      }).length;

      setAvailableTrips(openTrips);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <IconCard
          icon={Globe}
          label="Viagens"
          badge={availableTrips > 0 ? availableTrips : undefined}
        />
        <IconCard
          icon={Clock}
          label="Horas"
        />
        <IconCard
          icon={MessageSquare}
          label="Recados"
          onClick={() => setShowMessages(!showMessages)}
          badge={unreadCount > 0 ? unreadCount : undefined}
        />
      </div>

      {showMessages && (
        <div className="mt-8">
          <NotificationsList />
        </div>
      )}

      <div className="fixed bottom-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowInfo(true)}
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Info className="h-6 w-6" />
        </Button>
      </div>

      <InformationDialog
        open={showInfo}
        onOpenChange={setShowInfo}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Index;
