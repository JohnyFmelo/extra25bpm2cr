
import { useState, useEffect } from 'react';

export const useUserService = () => {
  const [userService, setUserService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserService = () => {
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserService(userData.service || null);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setUserService(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserService();
  }, []);

  return { userService, isLoading };
};

export const canUserViewTimeSlot = (
  timeSlotAllowedTypes: string[] | undefined,
  userService: string | null
): boolean => {
  // Se não há restrições, todos podem ver
  if (!timeSlotAllowedTypes || timeSlotAllowedTypes.length === 0) {
    return true;
  }

  // Se o usuário não tem service definido, não pode ver horários restritos
  if (!userService) {
    return false;
  }

  // Verificar se o service do usuário está nas categorias permitidas
  return timeSlotAllowedTypes.includes(userService);
};
