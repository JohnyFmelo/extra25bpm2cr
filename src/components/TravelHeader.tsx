
import { MoreHorizontal, Edit, Trash2, Archive, Lock, LockOpen } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Travel } from "./TravelManagement";

interface TravelHeaderProps {
  travel: Travel;
  statusText: string;
  statusColor: string;
  isAdmin: boolean;
  onEditTravel: (travel: Travel) => void;
  onDeleteTravel: (travelId: string) => void;
  onArchiveTravel: (travelId: string, archived: boolean) => void;
  onToggleLock: (travelId: string) => void;
}

export const TravelHeader = ({
  travel,
  statusText,
  statusColor,
  isAdmin,
  onEditTravel,
  onDeleteTravel,
  onArchiveTravel,
  onToggleLock,
}: TravelHeaderProps) => {
  const rightPos = isAdmin ? "right-12" : "right-2";

  return (
    <>
      {statusText && (
        <div
          className={`absolute top-0 ${rightPos} ${statusColor} text-white px-3 py-1 text-xs rounded-full font-medium shadow-sm`}
        >
          {statusText}
        </div>
      )}

      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="absolute top-0 right-0 h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEditTravel(travel)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => onDeleteTravel(travel.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArchiveTravel(travel.id, !travel.archived)}
              className="cursor-pointer"
            >
              <Archive className="mr-2 h-4 w-4" />
              {travel.archived ? "Desarquivar" : "Arquivar"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleLock(travel.id)} className="cursor-pointer">
              {travel.isLocked ? (
                <>
                  <LockOpen className="mr-2 h-4 w-4" />
                  Reabrir vagas
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Processar diária
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};
