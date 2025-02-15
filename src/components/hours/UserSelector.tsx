
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserOption } from "@/types/hours";

interface UserSelectorProps {
  users: UserOption[];
  value: string;
  onChange: (value: string) => void;
}

export const UserSelector = ({ users, value, onChange }: UserSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o usuário" />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.registration} value={user.registration}>
            {user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
