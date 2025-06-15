
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UserHoursDisplay } from "@/components/hours/UserHoursDisplay";
import { HoursData } from "@/types/hours";
import { useState, useMemo } from "react";

interface AllUsersHoursProps {
  users: HoursData[];
  monthYear: string;
}

export const AllUsersHours = ({ users, monthYear }: AllUsersHoursProps) => {
  const [search, setSearch] = useState("");

  const getNameWithoutGrad = (nome: string) => {
    if (!nome) return "";
    // Ignorar graduação inicial ("CB PM", "SD PM" etc)
    let splits = nome.split(" ");
    if (splits.length > 2) return splits.slice(2).join(" "); // Ex: "CB PM João Silva" => "João Silva"
    return splits.slice(1).join(" "); // fallback
  };

  // Ordena nomes por ordem alfabética APÓS graduação/PM
  const sortedFilteredUsers = useMemo(() => {
    return users
      .filter(user =>
        user.Nome.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const nameA = getNameWithoutGrad(a.Nome).toLowerCase();
        const nameB = getNameWithoutGrad(b.Nome).toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [users, search]);

  if (users.length === 0) {
    return <div className="text-gray-500 text-sm">Nenhum dado encontrado.</div>;
  }

  return (
    <div>
      <div className="flex items-center mb-3 gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>
      <div className="space-y-4">
        {sortedFilteredUsers.map((userData, idx) => (
          <div key={idx} className="mb-2 p-2 rounded-md shadow-sm bg-stone-50">
            <UserHoursDisplay
              data={userData}
              onClose={() => {}}
              isAdmin={true}
              monthYear={monthYear}
            />
          </div>
        ))}
      </div>
      {sortedFilteredUsers.length === 0 && (
        <div className="text-gray-400 text-sm mt-2">Nenhum usuário encontrado.</div>
      )}
    </div>
  );
};
