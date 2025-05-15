
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plane, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
}

const UpcomingTrips = () => {
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const today = new Date();
    const travelsRef = collection(db, "travels");
    
    // Query for trips that haven't started yet and belong to the current user
    const q = query(
      travelsRef, 
      where("archived", "==", false),
      where("participants", "array-contains", user.id || "")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const trips = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Trip))
        .filter((trip: Trip) => {
          const startDate = new Date(trip.startDate + "T00:00:00");
          return startDate > today;
        })
        .sort((a: Trip, b: Trip) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
      
      setUpcomingTrips(trips);
    });
    
    return () => unsubscribe();
  }, [user.id]);

  // If no upcoming trips, don't render anything
  if (upcomingTrips.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">Próximas Viagens</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingTrips.map((trip) => (
            <div key={trip.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-blue-700">{trip.destination}</h4>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(trip.startDate)} até {formatDate(trip.endDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingTrips;
