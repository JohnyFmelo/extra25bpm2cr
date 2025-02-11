
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "./ui/card";
import { TravelHeader } from "./TravelHeader";
import { TravelDetails } from "./TravelDetails";
import { Travel } from "./TravelManagement";

interface TravelCardProps {
  travel: Travel;
  isAdmin: boolean;
  user: any;
  isExpanded: boolean;
  onToggleExpansion: (travelId: string) => void;
  onEditTravel: (travel: Travel) => void;
  onDeleteTravel: (travelId: string) => void;
  onArchiveTravel: (travelId: string, archived: boolean) => void;
  onVolunteerTravel: (travelId: string) => void;
  onToggleLock: (travelId: string) => void;
  volunteerCounts: { [key: string]: number };
  diaryCounts: { [key: string]: number };
}

export const TravelCard = ({
  travel,
  isAdmin,
  user,
  isExpanded,
  onToggleExpansion,
  onEditTravel,
  onDeleteTravel,
  onArchiveTravel,
  onVolunteerTravel,
  onToggleLock,
  volunteerCounts,
  diaryCounts,
}: TravelCardProps) => {
  const travelStart = new Date(travel.startDate + "T00:00:00");
  const travelEnd = new Date(travel.endDate + "T00:00:00");
  const today = new Date();
  const isLocked = travel.isLocked;
  const isPastTravel = today > travelEnd;

  let cardStyle = "from-white to-gray-50";
  let statusColor = "";
  let statusText = "";

  if (today < travelStart) {
    if (isLocked) {
      cardStyle = "from-orange-50 to-orange-100";
      statusColor = "bg-orange-500";
      statusText = "Processando diária";
    } else {
      cardStyle = "from-blue-50 to-blue-100";
      statusColor = "bg-[#3B82F6]";
      statusText = "Em aberto";
    }
  } else if (today >= travelStart && today <= travelEnd) {
    cardStyle = "from-green-50 to-green-100";
    statusColor = "bg-green-500";
    statusText = "Em transito";
  } else {
    cardStyle = "from-gray-50 to-gray-100";
    statusColor = "bg-gray-400";
    statusText = "Encerrada";
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${travel.archived ? "opacity-75" : ""}`}>
      <div className={`bg-gradient-to-br ${cardStyle} p-6`}>
        <div className="relative">
          <TravelHeader
            travel={travel}
            statusText={statusText}
            statusColor={statusColor}
            isAdmin={isAdmin}
            onEditTravel={onEditTravel}
            onDeleteTravel={onDeleteTravel}
            onArchiveTravel={onArchiveTravel}
            onToggleLock={onToggleLock}
          />

          <div className="cursor-pointer space-y-4" onClick={() => onToggleExpansion(travel.id)}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-800">{travel.destination}</h3>
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>

            {isExpanded && (
              <TravelDetails
                travel={travel}
                user={user}
                today={today}
                travelStart={travelStart}
                isLocked={isLocked}
                volunteerCounts={volunteerCounts}
                diaryCounts={diaryCounts}
                onVolunteerTravel={onVolunteerTravel}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
