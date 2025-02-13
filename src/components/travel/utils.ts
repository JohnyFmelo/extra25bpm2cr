
import { differenceInDays } from "date-fns";

export const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: { [key: string]: number } = {
    "Cel": 12,
    "Cel PM": 12,
    "Ten Cel": 11,
    "Ten Cel PM": 11,
    "Maj": 10,
    "Maj PM": 10,
    "Cap": 9,
    "Cap PM": 9,
    "1° Ten": 8,
    "1° Ten PM": 8,
    "2° Ten": 7,
    "2° Ten PM": 7,
    "Sub Ten": 6,
    "Sub Ten PM": 6,
    "1° Sgt": 5,
    "1° Sgt PM": 5,
    "2° Sgt": 4,
    "2° Sgt PM": 4,
    "3° Sgt": 3,
    "3° Sgt PM": 3,
    "Cb": 2,
    "Cb PM": 2,
    "Sd": 1,
    "Sd PM": 1,
    "Estágio": 0,
  };
  return rankWeights[rank] || 0;
};

export const calculateDailyCount = (startDate: string, endDate: string, halfLastDay: boolean): number => {
  const travelStart = new Date(startDate + "T00:00:00");
  const travelEnd = new Date(endDate + "T00:00:00");

  // Verifica se as datas são válidas
  if (isNaN(travelStart.getTime()) || isNaN(travelEnd.getTime())) {
    return 0; // Retorna 0 se as datas forem inválidas
  }

  // Calcula a diferença de dias
  const numDays = differenceInDays(travelEnd, travelStart) + 1;
  return halfLastDay ? numDays - 0.5 : numDays;
};

export const formatDiaryCount = (count: number): string => {
  // Verifica se o valor de count é NaN
  if (isNaN(count)) {
    return "0 diárias"; // Retorna um valor padrão se o count for NaN
  }

  // Formatação de número para exibir no formato brasileiro
  const formattedCount = count.toLocaleString("pt-BR", {
    minimumFractionDigits: count % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 1,
  });

  return `${formattedCount} ${count === 1 ? 'diária' : 'diárias'}`;
};
