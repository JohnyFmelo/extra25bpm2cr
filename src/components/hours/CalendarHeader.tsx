
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarHeaderProps {
  monthYear: string;
}

export const CalendarHeader = ({ monthYear }: CalendarHeaderProps) => {
  // Parse the monthYear string to create a date object
  const [month, year] = monthYear.split('/');
  const monthYearDate = new Date(parseInt(year), parseInt(month) - 1);
  const formattedMonth = format(monthYearDate, 'MMMM yyyy', { locale: ptBR });
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/20 rounded-t-lg">
      <h3 className="text-lg font-medium text-gray-800 capitalize">{formattedMonth}</h3>
    </div>
  );
};
