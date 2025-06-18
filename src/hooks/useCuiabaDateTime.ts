
import { useState, useEffect } from 'react';

interface CuiabaDateTime {
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  isLoading: boolean;
  error: string | null;
}

export const useCuiabaDateTime = (): CuiabaDateTime => {
  const [dateTime, setDateTime] = useState<CuiabaDateTime>({
    date: '',
    time: '',
    isLoading: true,
    error: null
  });

  const fetchCuiabaTime = async () => {
    try {
      setDateTime(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Usando a API WorldTimeAPI para o timezone de Cuiabá
      const response = await fetch('https://worldtimeapi.org/api/timezone/America/Cuiaba');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar horário de Cuiabá');
      }
      
      const data = await response.json();
      const cuiabaTime = new Date(data.datetime);
      
      // Formatando para os formatos necessários
      const year = cuiabaTime.getFullYear();
      const month = String(cuiabaTime.getMonth() + 1).padStart(2, '0');
      const day = String(cuiabaTime.getDate()).padStart(2, '0');
      const hours = String(cuiabaTime.getHours()).padStart(2, '0');
      const minutes = String(cuiabaTime.getMinutes()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}`;
      const formattedTime = `${hours}:${minutes}`;
      
      setDateTime({
        date: formattedDate,
        time: formattedTime,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Erro ao buscar horário de Cuiabá:', error);
      
      // Fallback para horário local em caso de erro
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setDateTime({
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        isLoading: false,
        error: 'Não foi possível buscar horário de Cuiabá. Usando horário local.'
      });
    }
  };

  useEffect(() => {
    fetchCuiabaTime();
  }, []);

  return dateTime;
};
