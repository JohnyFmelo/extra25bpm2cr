
import { differenceInDays } from "date-fns";
import { Button } from "./ui/button";
import { VolunteerList } from "./VolunteerList";
import { Travel } from "./TravelManagement";

interface TravelDetailsProps {
  travel: Travel;
  user: any;
  today: Date;
  travelStart: Date;
  isLocked: boolean;
  volunteerCounts: { [key: string]: number };
  diaryCounts: { [key: string]: number };
  onVolunteerTravel: (travelId: string) => void;
}

export const TravelDetails = ({
  travel,
  user,
  today,
  travelStart,
  isLocked,
  volunteerCounts,
  diaryCounts,
  onVolunteerTravel,
}: TravelDetailsProps) => {
  const travelEnd = new Date(travel.endDate + "T00:00:00");
  const numDays = differenceInDays(travelEnd, travelStart) + 1;
  const count = travel.halfLastDay ? numDays - 0.5 : numDays;
  const formattedCount = count.toLocaleString("pt-BR", {
    minimumFractionDigits: count % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 1,
  });
  const totalCost = count * Number(travel.dailyRate);
  const diariasLine = travel.dailyRate
    ? `${formattedCount} (${totalCost.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })})`
    : formattedCount;

  return (
    <div className="mt-4 space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Data: {travelStart.toLocaleDateString()}</span>
        <span>Diárias: {diariasLine}</span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>Data Final:</span>
          <span className="font-medium">{travelEnd.toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Vagas:</span>
          <span className="font-medium">{travel.slots}</span>
        </div>
      </div>

      {travel.volunteers && travel.volunteers.length > 0 && (
        <VolunteerList
          volunteers={travel.volunteers}
          slots={travel.slots}
          isLocked={isLocked}
          volunteerCounts={volunteerCounts}
          diaryCounts={diaryCounts}
        />
      )}

      {today < travelStart && !travel.archived && !isLocked && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onVolunteerTravel(travel.id);
          }}
          className={`w-full shadow-sm ${
            travel.volunteers?.includes(`${user.rank} ${user.warName}`)
              ? "bg-red-500 hover:bg-red-600"
              : "bg-[#3B82F6] hover:bg-[#2563eb]"
          } text-white font-medium`}
        >
          {travel.volunteers?.includes(`${user.rank} ${user.warName}`) ? "Desistir" : "Quero ser Voluntário"}
        </Button>
      )}
    </div>
  );
};
