
import { HoursData } from "@/types/hours";

interface AllUsersHoursProps {
  users: HoursData[];
}

export const AllUsersHours = ({ users }: AllUsersHoursProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {users.map((user, index) => (
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
  );
};
