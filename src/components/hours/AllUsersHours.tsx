
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { HoursData } from "@/types/hours";

interface AllUsersHoursProps {
  users: HoursData[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const AllUsersHours = ({ users, searchTerm, onSearchChange }: AllUsersHoursProps) => {
  const filteredUsers = users.filter(user => 
    user.Nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">{user.Nome}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-600">25° BPM</p>
                <p className="font-medium">{user["Horas 25° BPM"]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saiop</p>
                <p className="font-medium">{user.Saiop}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sinfra</p>
                <p className="font-medium">{user.Sinfra}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-bold text-green-600">{user["Total Geral"]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
