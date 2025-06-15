
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { HoursData } from "@/types/hours";
import { UserHoursDisplay } from "./UserHoursDisplay";

interface AllUsersHoursProps {
  users: HoursData[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  monthYear: string;
  onClose: (index: number) => void;
}

export const AllUsersHours = ({ users, searchTerm, onSearchChange, monthYear, onClose }: AllUsersHoursProps) => {
  const filteredUsers = users.filter(user => 
    user.Nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const originalIndex = users.findIndex(u => u.Matricula === user.Matricula);
          return (
            <div key={user.Matricula.toString()} className="mb-4 p-4 rounded-md shadow-sm bg-stone-50">
                <UserHoursDisplay
                    data={user}
                    onClose={() => onClose(originalIndex)}
                    isAdmin={true}
                    monthYear={monthYear}
                />
            </div>
          )
        })}
        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500 pt-4">Nenhum usuário encontrado.</p>
        )}
      </div>
    </div>
  );
};
