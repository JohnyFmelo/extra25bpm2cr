
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkedDay {
  day: string;
  hours: string;
  location: 'bpm' | 'saiop' | 'sinfra';
}

interface Annotations {
  [key: string]: string;
}

interface CalendarGridProps {
  calendarDays: Date[];
  workedDays: WorkedDay[];
  selectedDate: Date | null;
  handleDayClick: (date: Date) => void;
  annotations: Annotations;
  monthYearDate: Date;
  isAdmin: boolean;
}

export const CalendarGrid = ({
  calendarDays,
  workedDays,
  selectedDate,
  handleDayClick,
  annotations,
  monthYearDate,
  isAdmin,
}: CalendarGridProps) => {
  const getHoursForDay = (day: number) => {
    const workedDay = workedDays.find(wd => parseInt(wd.day) === day);
    return workedDay?.hours || '';
  };
  
  const getLocationForDay = (day: number) => {
    return workedDays.find(wd => parseInt(wd.day) === day)?.location;
  };
  
  const getLocationColor = (location: string | undefined) => {
    switch (location) {
      case 'bpm':
        return 'bg-purple-600 text-white';
      case 'saiop':
        return 'bg-green-500 text-white';
      case 'sinfra':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-white';
    }
  };
  
  const isCurrentMonthDay = (date: Date) => {
    return date.getMonth() === monthYearDate.getMonth() && 
           date.getFullYear() === monthYearDate.getFullYear();
  };

  return (
    <div className="grid grid-cols-7 bg-white rounded-lg overflow-hidden shadow-inner">
      {/* Header row with day names */}
      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
        <div key={day} className="py-2 text-center text-xs font-medium text-gray-600 bg-gray-50 border-b">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {calendarDays.map((date, i) => {
        const dayNumber = date.getDate();
        const hours = isCurrentMonthDay(date) ? getHoursForDay(dayNumber) : '';
        const location = isCurrentMonthDay(date) ? getLocationForDay(dayNumber) : undefined;
        const locationColor = getLocationColor(location);
        
        const dateKey = format(date, 'yyyy-MM-dd');
        const hasAnnotation = annotations[dateKey];
        
        return (
          <div
            key={i}
            onClick={() => handleDayClick(date)}
            className={`relative border p-1 h-16 cursor-pointer transition-colors ${
              isCurrentMonthDay(date) ? 'hover:bg-gray-50' : 'bg-gray-50/50 text-gray-400'
            } ${
              selectedDate?.toDateString() === date.toDateString() ? 'ring-2 ring-primary/30' : ''
            } ${
              hasAnnotation ? 'after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:rounded-full after:bg-blue-500' : ''
            } ${
              new Date().toDateString() === date.toDateString() ? 'bg-primary/5' : ''
            }`}
          >
            <span className={`text-sm ${isCurrentMonthDay(date) ? 'text-gray-700' : 'text-gray-400'}`}>
              {dayNumber}
            </span>
            
            {hours && (
              <div className={`mt-1 text-xs rounded-md px-1 py-0.5 text-center ${locationColor}`}>
                {hours}h
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
