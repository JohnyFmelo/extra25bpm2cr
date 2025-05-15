
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users as UsersIcon, Navigation } from "lucide-react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  slots: number;
  isLocked?: boolean;
  selectedVolunteers?: string[];
  halfLastDay?: boolean;
}

const UpcomingTrips = ({ onTravelClick }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userName = userData ? `${userData.rank} ${userData.warName}` : '';
  
  useEffect(() => {
    const today = new Date();
    const travelsRef = collection(db, "travels");
    const q = query(travelsRef, where("archived", "==", false));
    
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const userTrips = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((trip: any) => {
          // Only show trips where the user is a selected volunteer
          const isUserVolunteer = trip.selectedVolunteers?.includes(userName);
          if (!isUserVolunteer) return false;
          
          const startDate = new Date(trip.startDate + "T00:00:00");
          const endDate = new Date(trip.endDate + "T00:00:00");
          
          // Only show future trips
          return startDate >= today;
        })
        .sort((a: any, b: any) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        })
        .slice(0, 3); // Limit to 3 upcoming trips
      
      setTrips(userTrips);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [userName]);
  
  if (isLoading) {
    return <div className="text-center p-4">Carregando viagens...</div>;
  }
  
  if (trips.length === 0) {
    return null;
  }
  
  return (
    <Card className="shadow-md mb-8">
      <CardContent className="p-5">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
          <Navigation className="h-5 w-5 mr-2 text-primary" />
          Minhas Próximas Viagens
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => {
            const travelStart = new Date(trip.startDate + "T00:00:00");
            const travelEnd = new Date(trip.endDate + "T00:00:00");
            const numDays = Math.floor((travelEnd.getTime() - travelStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const dailyCount = trip.halfLastDay ? numDays - 0.5 : numDays;

            return (
              <Card 
                key={trip.id} 
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow hover:shadow-md transition-all"
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    {trip.destination}
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <p className="text-sm">
                        {travelStart.toLocaleDateString()} até {travelEnd.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="text-sm">
                        {dailyCount.toLocaleString("pt-BR", {
                          minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
                          maximumFractionDigits: 1
                        })} diárias
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={onTravelClick}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm py-1 h-auto"
                  >
                    Ver detalhes
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingTrips;
