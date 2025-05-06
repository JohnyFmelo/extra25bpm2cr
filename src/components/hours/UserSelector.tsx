
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserOption } from "@/types/hours";
import { useEffect } from "react";

interface UserSelectorProps {
  users: UserOption[];
  value: string;
  onChange: (value: string) => void;
}

// Function to get rank weight for sorting
const getRankWeight = (rank: string = '') => {
  const rankOrder: { [key: string]: number } = {
    'CEL': 1,
    'TC': 2,
    'MAJ': 3,
    'CAP': 4,
    '1º TEN': 5,
    '2º TEN': 6,
    'ASP': 7,
    'SUB TEN': 8,
    '1º SGT': 9,
    '2º SGT': 10,
    '3º SGT': 11,
    'CB': 12,
    'SD': 13
  };
  
  const rankMatch = rank.match(/(CEL|TC|MAJ|CAP|1º TEN|2º TEN|ASP|SUB TEN|1º SGT|2º SGT|3º SGT|CB|SD)/);
  return rankMatch ? rankOrder[rankMatch[0]] : 999;
};

export const UserSelector = ({ users, value, onChange }: UserSelectorProps) => {
  // Sort users by rank
  const sortedUsers = [...users].sort((a, b) => {
    const weightA = getRankWeight(a.label.split(' ')[0]);
    const weightB = getRankWeight(b.label.split(' ')[0]);
    return weightA - weightB;
  });

  // Set default value to 'all' if no value is selected
  useEffect(() => {
    if (!value) {
      onChange('all');
    }
  }, [value, onChange]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o usuário" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os usuários</SelectItem>
        {sortedUsers.map((user) => (
          <SelectItem key={user.registration} value={user.registration}>
            {user.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
