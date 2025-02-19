
import { useState, useEffect } from 'react';
import type { User } from '@/types/user';

export const useUserData = () => {
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    // Aqui você pode implementar a lógica para buscar os dados do usuário
    // Por enquanto, vamos retornar um usuário mockado
    setUserData({
      id: '1',
      email: 'user@example.com',
      name: 'User Test',
      userType: 'user',
    });
  }, []);

  return userData;
};
