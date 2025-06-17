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
const ActiveTrips = ({
  trips,
  onTravelClick
}: ActiveTripsProps) => {
  if (trips.length === 0) {
    return <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Nenhuma viagem ativa no momento.</p>
        </CardContent>
      </Card>;
  }
  return <div className="mb-8">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-teal-600">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Viagens Ativas</h2>
              <p className="text-sm text-teal-100">Deslocamentos em andamento</p>
            </div>
          </div>
          
        </div>

        {/* Trips List */}
        <div className="p-4 space-y-4">
          {trips.map((trip, index) => {
          const travelStart = new Date(trip.startDate + "T00:00:00");
          const travelEnd = new Date(trip.endDate + "T00:00:00");
          const today = new Date();
          const isInTransit = today >= travelStart && today <= travelEnd;
          const isOpen = today < travelStart;
          const numDays = Math.floor((travelEnd.getTime() - travelStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const dailyCount = trip.halfLastDay ? numDays - 0.5 : numDays;
          return <div key={trip.id} className="bg-teal-500/90 rounded-lg p-4 text-white relative">
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isInTransit ? 'bg-green-500 text-white' : 'bg-yellow-400 text-teal-800'}`}>
                    {isInTransit ? 'Em Trânsito' : 'Em Aberto'}
                  </span>
                </div>

                {/* Trip Title */}
                <h3 className="text-xl font-semibold mb-4 pr-24">
                  {trip.destination}
                </h3>

                {/* Trip Details Grid */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-1.5 rounded">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-1.5 rounded">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span>
                      {isInTransit ? `${travelStart.toLocaleDateString('pt-BR')} até ${travelEnd.toLocaleDateString('pt-BR')}` : `Início: ${travelStart.toLocaleDateString('pt-BR')}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-1.5 rounded">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span>
                      {dailyCount.toLocaleString("pt-BR", {
                    minimumFractionDigits: dailyCount % 1 !== 0 ? 1 : 0,
                    maximumFractionDigits: 1
                  })} diárias
                    </span>
                  </div>
                </div>

                {/* Travelers Info for In-Transit */}
                {isInTransit && trip.selectedVolunteers && trip.selectedVolunteers.length > 0 && <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="font-medium text-sm">
                      <span className="text-teal-100">Viajante:</span> {trip.selectedVolunteers[0]}
                    </p>
                  </div>}
              </div>;
        })}
        </div>
      </div>
    </div>;
};
export default ActiveTrips;