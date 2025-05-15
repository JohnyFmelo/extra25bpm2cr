
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Navigation, Calendar } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  slots: number;
  isLocked?: boolean;
}

interface UpcomingTripsProps {
  onTravelClick?: () => void;
}

const UpcomingTrips: React.FC<UpcomingTripsProps> = ({ onTravelClick }) => {
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const today = new Date();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id;
    
    if (!userId) {
      setLoading(false);
      return;
    }

    const travelsRef = collection(db, "travels");
    const threeMonthsLater = addDays(today, 90); // Look ahead 3 months
    
    // Get trips where the user is assigned or the trip is open for registration
    const userTripsQuery = query(
      travelsRef,
      where("archived", "==", false),
      where("startDate", ">=", format(today, "yyyy-MM-dd")),
      where("startDate", "<=", format(threeMonthsLater, "yyyy-MM-dd")),
      orderBy("startDate")
    );
    
    const unsubscribe = onSnapshot(userTripsQuery, (querySnapshot) => {
      const trips = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          // Check if user is part of this trip or if slots are available
          const isUserTrip = data.assignedUsers && 
                             Array.isArray(data.assignedUsers) && 
                             data.assignedUsers.some((u: any) => u.id === userId);
          
          // Only include trips where the user is assigned or has requested a spot
          if (isUserTrip || (data.requestedUsers && 
              Array.isArray(data.requestedUsers) && 
              data.requestedUsers.some((u: any) => u.id === userId))) {
            return {
              id: doc.id,
              destination: data.destination || "Não especificado",
              startDate: data.startDate,
              endDate: data.endDate,
              slots: data.slots || 0,
              isLocked: data.isLocked
            };
          }
          return null;
        })
        .filter(trip => trip !== null) as Trip[];
      
      setUpcomingTrips(trips);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleCardClick = () => {
    if (onTravelClick) {
      onTravelClick();
    }
  };
  
  if (upcomingTrips.length === 0 && !loading) {
    return null;
  }
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">Próximas Viagens</h3>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{trip.destination}</h4>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {format(new Date(trip.startDate), "dd/MM/yyyy")} - {format(new Date(trip.endDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                  <Badge variant={trip.isLocked ? "outline" : "default"} className="ml-2">
                    {trip.isLocked ? "Confirmada" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingTrips;
