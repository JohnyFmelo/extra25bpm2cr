
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Calendar, Clock, Users as UsersIcon, Navigation } from "lucide-react";

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

interface ActiveTripsProps {
  trips: Trip[];
  onTravelClick: () => void;
}

const ActiveTrips = ({ trips, onTravelClick }: ActiveTripsProps) => {
  if (trips.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Nenhuma viagem ativa no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Viagens Ativas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => {
          const travelStart = new Date(trip.startDate + "T00:00:00");
          const travelEnd = new Date(trip.endDate + "T00:00:00");
          const today = new Date();
          const isInTransit = today >= travelStart && today <= travelEnd;
          const isOpen = today < travelStart;
          const numDays = Math.floor((travelEnd.getTime() - travelStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const dailyCount = trip.halfLastDay ? numDays - 0.5 : numDays;

          return (
            <Card 
              key={trip.id} 
              className={`relative overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
                isInTransit ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-white'
              }`}
            >
              <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-medium text-white ${
                isInTransit ? 'bg-green-600' : 'bg-blue-600'
              } rounded-bl-lg`}>
                {isInTransit ? 'Em Trânsito' : 'Em Aberto'}
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {trip.destination}
                </h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-3">
                    <Map className="h-5 w-5 text-green-500" />
                    <p>{trip.destination}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <p>{isInTransit ? 'Período: ' : 'Início: '} 
                      {travelStart.toLocaleDateString()}
                      {isInTransit && ` até ${travelEnd.toLocaleDateString()}`}
                    </p>
                  </div>
                  
                  {!isInTransit && (
                    <div className="flex items-center gap-3">
                      <UsersIcon className="h-5 w-5 text-green-500" />
                      <p>Vagas: {trip.slots}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-500" />
                    <p>{dailyCount.toLocaleString("pt-BR", {
                      minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
                      maximumFractionDigits: 1
                    })} diárias</p>
                  </div>

                  {isInTransit && trip.selectedVolunteers && trip.selectedVolunteers.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-sm text-gray-800">Viajantes:</p>
                      <div className="mt-2 space-y-2">
                        {trip.selectedVolunteers.map((volunteer: string, idx: number) => (
                          <div key={idx} className="text-sm bg-white/80 px-3 py-1 rounded-md">
                            {volunteer}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <Button 
                    onClick={onTravelClick}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Ver detalhes
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveTrips;
