
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Clock, CalendarDays, Users, X, Edit, Trash2, Archive, Lock, LockOpen, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Travel } from "./types";
import { VolunteerList } from "./VolunteerList";

interface TravelCardProps {
  travel: Travel;
  isAdmin: boolean;
  user: any;
  formattedCount: string;
  totalCost: number;
  cardBg: string;
  statusBadge: React.ReactNode;
  volunteerCounts: { [key: string]: number };
  diaryCounts: { [key: string]: number };
  sortedVolunteers: any[];
  onEdit: (travel: Travel) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onToggleLock: (id: string) => void;
  onVolunteer: (id: string) => void;
  formattedTravelCount: (count: number) => string;
  formattedDiaryCount: (count: number) => string;
}

export const TravelCard = ({
  travel,
  isAdmin,
  user,
  formattedCount,
  totalCost,
  cardBg,
  statusBadge,
  volunteerCounts,
  diaryCounts,
  sortedVolunteers,
  onEdit,
  onDelete,
  onArchive,
  onToggleLock,
  onVolunteer,
  formattedTravelCount,
  formattedDiaryCount,
}: TravelCardProps) => {
  const travelStart = new Date(travel.startDate + "T00:00:00");
  const travelEnd = new Date(travel.endDate + "T00:00:00");
  const today = new Date();
  const isLocked = travel.isLocked;

  return (
    <Card
      className={`relative overflow-hidden ${cardBg} border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 ${
        travel.archived ? "opacity-75" : ""
      }`}
    >
      {statusBadge}

      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-black/5">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(travel)} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 gap-2"
              onClick={() => onDelete(travel.id)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(travel.id, true)} className="gap-2">
              <Archive className="h-4 w-4" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleLock(travel.id)} className="gap-2">
              {isLocked ? (
                <>
                  <LockOpen className="h-4 w-4" />
                  Reabrir vagas
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Processar diária
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-blue-900">
              {travel.destination}
            </h3>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <p>Início: {travelStart.toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <p>Fim: {travelEnd.toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <p>Vagas: {travel.slots}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <p>{formattedCount} diárias
                  {travel.dailyRate && totalCost > 0 && (
                    <span className="text-blue-600 font-medium ml-1">
                      ({totalCost.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <VolunteerList
            sortedVolunteers={sortedVolunteers}
            volunteerCounts={volunteerCounts}
            diaryCounts={diaryCounts}
            formattedTravelCount={formattedTravelCount}
            formattedDiaryCount={formattedDiaryCount}
          />

          {today < travelStart && !travel.archived && !isLocked && (
            <div className="mt-3">
              <Button
                onClick={() => onVolunteer(travel.id)}
                className={`w-full shadow-sm ${
                  travel.volunteers?.includes(`${user.rank} ${user.warName}`)
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white font-medium`}
              >
                {travel.volunteers?.includes(`${user.rank} ${user.warName}`)
                  ? "Desistir"
                  : "Quero ser Voluntário"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
