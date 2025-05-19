import { useMemo, useState } from 'react';
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateAnnotationDialog } from './DateAnnotationDialog';

interface WorkedDay {
  day: string;
  hours: string;
  location: 'bpm' | 'saiop' | 'sinfra';
}

interface WorkedDaysCalendarProps {
  className?: string;
  monthYear: string;
  workedDays: WorkedDay[];
  total: string;
  isAdmin?: boolean;
}

type Annotations = {
  [key: string]: string;
};

export const WorkedDaysCalendar = ({
  className,
  monthYear,
  workedDays,
  total,
  isAdmin = false
}: WorkedDaysCalendarProps) => {
  const [annotations, setAnnotations] = useState<Annotations>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);
  
  const calendarDays = useMemo(() => {
    // Parse the monthYear string to create an actual date object
    const [month, year] = monthYear.split('/');
    const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
    const endDate = endOfMonth(startDate);
    
    const days = eachDayOfInterval({
      start: startDate,
      end: endDate
    });
    
    const firstDayOfWeek = startDate.getDay();
    const daysBeforeStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const paddingBefore = Array.from({
      length: daysBeforeStart
    }, (_, i) => {
      return addDays(startDate, -(daysBeforeStart - i));
    });
    
    const totalDays = paddingBefore.length + days.length;
    const remainingDays = Math.ceil(totalDays / 7) * 7 - totalDays;
    
    const paddingAfter = Array.from({
      length: remainingDays
    }, (_, i) => {
      return addDays(endDate, i + 1);
    });
    
    return [...paddingBefore, ...days, ...paddingAfter];
  }, [monthYear]);
  
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
  
  const calculateTotalHoursByLocation = () => {
    const totals = {
      bpm: 0,
      saiop: 0,
      sinfra: 0
    };
    
    workedDays.forEach(day => {
      const hours = parseFloat(day.hours) || 0;
      totals[day.location] += hours;
    });
    
    return totals;
  };
  
  const handleDayClick = (date: Date) => {
    if (!isAdmin) return;
    
    const clickTimestamp = new Date().getTime();
    const lastClickTimestamp = (date as any).lastClickTimestamp || 0;
    
    if (clickTimestamp - lastClickTimestamp < 300) {
      // Double click detection
      setSelectedDate(date);
      setIsAnnotationDialogOpen(true);
    }
    
    (date as any).lastClickTimestamp = clickTimestamp;
  };
  
  const handleSaveAnnotation = (annotation: string) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setAnnotations(prev => ({
        ...prev,
        [dateKey]: annotation
      }));
    }
  };
  
  const totals = calculateTotalHoursByLocation();
  
  const [month, year] = monthYear.split('/');
  const monthYearFormatted = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', {
    locale: ptBR
  });
  
  const isCurrentMonth = (date: Date) => {
    const monthYearDate = parse(monthYear, 'M/yyyy', new Date());
    return date.getMonth() === monthYearDate.getMonth() && date.getFullYear() === monthYearDate.getFullYear();
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="px-4 py-3 border-b">
        <h3 className="text-lg font-medium text-gray-800 capitalize">{monthYearFormatted}</h3>
      </div>
      
      <div className="grid grid-cols-7 border-b">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {calendarDays.map((date, i) => {
          const dayNumber = date.getDate();
          const hours = isCurrentMonth(date) ? getHoursForDay(dayNumber) : '';
          const location = isCurrentMonth(date) ? getLocationForDay(dayNumber) : undefined;
          const locationColor = getLocationColor(location);
          
          const dateKey = format(date, 'yyyy-MM-dd');
          const hasAnnotation = annotations[dateKey];
          
          return (
            <div
              key={i}
              onClick={() => handleDayClick(date)}
              className={`border p-1 h-16 cursor-pointer relative ${
                isCurrentMonth(date) ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${hasAnnotation ? 'ring-1 ring-blue-300' : ''}`}
            >
              <div className="flex justify-between">
                <span className={`text-sm ${isCurrentMonth(date) ? 'text-gray-700' : 'text-gray-400'}`}>
                  {dayNumber}
                </span>
                
                {hasAnnotation && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" title={annotations[dateKey]}></div>
                )}
              </div>
              
              {hours && (
                <div className={`mt-1 text-xs rounded px-1 py-0.5 text-center ${locationColor}`}>
                  {hours}h
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-3 border-t">
        <div className="flex justify-between text-sm">
          <span>Total:</span>
          <span className="font-medium">{total}</span>
        </div>
        
        <div className="mt-2 space-y-1 text-xs">
          {Object.entries(totals).filter(([_, value]) => value > 0).map(([location, hours]) => (
            <div key={location} className="flex justify-between">
              <span className="uppercase">{location}:</span>
              <span>{hours}h</span>
            </div>
          ))}
        </div>
      </div>
      
      <DateAnnotationDialog
        open={isAnnotationDialogOpen}
        onOpenChange={setIsAnnotationDialogOpen}
        date={selectedDate}
        currentAnnotation={selectedDate ? annotations[format(selectedDate, 'yyyy-MM-dd')] || '' : ''}
        onSave={handleSaveAnnotation}
      />
    </div>
  );
};
