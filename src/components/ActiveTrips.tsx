
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Shield } from "lucide-react";

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
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">Viagens Ativas</h2>
              <p className="text-sm text-teal-100">Deslocamentos em andamento</p>
            </div>
          </div>
          <Shield className="h-6 w-6 text-teal-200" />
        </div>

        {/* Trips List */}
        <div className="space-y-0">
          {trips.map((trip, index) => {
            const travelStart = new Date(trip.startDate + "T00:00:00");
            const travelEnd = new Date(trip.endDate + "T00:00:00");
            const today = new Date();
            const isInTransit = today >= travelStart && today <= travelEnd;
            const isOpen = today < travelStart;
            const numDays = Math.floor((travelEnd.getTime() - travelStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const dailyCount = trip.halfLastDay ? numDays - 0.5 : numDays;

            return (
              <div 
                key={trip.id}
                className={`bg-teal-400 mx-4 rounded-lg p-4 text-white relative ${
                  index === trips.length - 1 ? 'mb-4' : 'mb-3'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isInTransit ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {isInTransit ? 'Em Trânsito' : 'Em Aberto'}
                  </span>
                </div>

                {/* Trip Title */}
                <h3 className="text-lg font-semibold mb-3 pr-20">
                  {trip.destination}
                </h3>

                {/* Trip Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{trip.destination}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {isInTransit ? 'Período: ' : 'Início: '}
                      {travelStart.toLocaleDateString('pt-BR')}
                      {isInTransit && ` até ${travelEnd.toLocaleDateString('pt-BR')}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {dailyCount.toLocaleString("pt-BR", {
                        minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
                        maximumFractionDigits: 1
                      })} diárias
                    </span>
                  </div>
                </div>

                {/* Travelers Info for In-Transit */}
                {isInTransit && trip.selectedVolunteers && trip.selectedVolunteers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-teal-300/30">
                    <p className="font-medium text-sm mb-2">Viajante: {trip.selectedVolunteers[0]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActiveTrips;
