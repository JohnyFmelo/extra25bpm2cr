
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserOption } from "@/types/hours";

interface UserSelectorProps {
  users: UserOption[];
  onSelectUser: (value: string) => void;
  disabled?: boolean;
}

export const UserSelector = ({ users, onSelectUser, disabled }: UserSelectorProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">
        Selecione o usuário
      </label>
      <Select onValueChange={onSelectUser} disabled={disabled}>
        <SelectTrigger id="user-select">
          <SelectValue placeholder="Selecione o usuário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os usuários</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.registration} value={user.value}>
              {user.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
