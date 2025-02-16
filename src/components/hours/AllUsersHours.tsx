
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg mb-2 text-primary">{user.Nome}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">25° BPM</span>
                <span className="font-medium">{user["Horas 25° BPM"]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sonora</span>
                <span className="font-medium">{user.Sonora}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sinfra</span>
                <span className="font-medium">{user.Sinfra}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="font-bold text-green-600">{user["Total Geral"]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
