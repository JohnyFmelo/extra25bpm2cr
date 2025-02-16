
interface UserData {
  id: string;
  registration: string;
  name: string;
  rank: string;
  warName: string;
}

interface AllUsersHoursProps {
  users: UserData[];
}

export const AllUsersHours = ({ users }: AllUsersHoursProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {users.map((user) => (
        <div key={user.id} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg mb-2 text-primary">{user.name}</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Matrícula</span>
              <span className="font-medium">{user.registration}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Posto/Graduação</span>
              <span className="font-medium">{user.rank}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nome de Guerra</span>
              <span className="font-medium">{user.warName}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
