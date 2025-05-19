import { useMemo, useState } from 'react';
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, parse, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateAnnotationDialog } from './DateAnnotationDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

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

const locationInfo = {
  bpm: { name: '25° BPM', color: 'bg-purple-600', lightColor: 'bg-purple-100', textColor: 'text-purple-800', hoverColor: 'hover:bg-purple-200' },
  saiop: { name: 'SAIOP', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-800', hoverColor: 'hover:bg-green-200' },
  sinfra: { name: 'SINFRA', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-800', hoverColor: 'hover:bg-blue-200' }
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
    // Parse the monthYear string to create a date object
    const [month, year] = monthYear.split('/');
    const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
    const endDate = endOfMonth(startDate);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const firstDayOfWeek = startDate.getDay();
    const daysBeforeStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const paddingBefore = Array.from({ length: daysBeforeStart }, (_, i) => {
      return addDays(startDate, -(daysBeforeStart - i));
    });
    
    const totalDays = paddingBefore.length + days.length;
    const remainingDays = Math.ceil(totalDays / 7) * 7 - totalDays;
    const paddingAfter = Array.from({ length: remainingDays }, (_, i) => {
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

  const getDateStyles = (date: Date, location: string | undefined, belongsToCurrentMonth: boolean) => {
    if (!belongsToCurrentMonth) {
      return 'bg-gray-50 text-gray-300 opacity-60';
    }
    
    if (!location) {
      return isWeekend(date) ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-700 border-gray-200';
    }
    
    const info = locationInfo[location as keyof typeof locationInfo];
    return `${info.lightColor} ${info.textColor} border-${location}-300`;
  };

  const handleDayClick = (date: Date) => {
    if (!isAdmin) return;
    
    const clickTimestamp = new Date().getTime();
    const lastClickTimestamp = (date as any).lastClickTimestamp || 0;
    
    if (clickTimestamp - lastClickTimestamp < 300) { // Double click detection
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

  // Calculate totals by location
  const totals = useMemo(() => {
    const result = {
      bpm: 0,
      saiop: 0,
      sinfra: 0,
      total: 0
    };

    workedDays.forEach(day => {
      const hours = parseFloat(day.hours) || 0;
      result[day.location] += hours;
      result.total += hours;
    });

    return result;
  }, [workedDays]);

  const [month, year] = monthYear.split('/');
  const monthYearDate = new Date(parseInt(year), parseInt(month) - 1);
  const monthYearFormatted = format(monthYearDate, 'MMMM yyyy', { locale: ptBR });

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === monthYearDate.getMonth() && date.getFullYear() === monthYearDate.getFullYear();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-slate-500" />
          <h3 className="text-lg font-medium capitalize text-slate-800">{monthYearFormatted}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 px-2 py-1">
            Total: {totals.total}h
          </Badge>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 max-w-3xl mx-auto">
          {/* Day headers */}
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayNum = date.getDate();
            const belongsToCurrentMonth = isCurrentMonth(date);
            const location = belongsToCurrentMonth ? getLocationForDay(dayNum) : undefined;
            const hours = belongsToCurrentMonth ? getHoursForDay(dayNum) : '';
            const dateKey = format(date, 'yyyy-MM-dd');
            const annotation = annotations[dateKey];
            const dayStyles = getDateStyles(date, location, belongsToCurrentMonth);
            const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square rounded-lg border flex flex-col relative
                  ${dayStyles}
                  ${location && isAdmin ? locationInfo[location as keyof typeof locationInfo].hoverColor : 'hover:bg-slate-50'}
                  ${isAdmin ? 'cursor-pointer' : ''}
                  transition-colors duration-150 ease-in-out
                `}
              >
                {/* Day number */}
                <div className={`absolute top-1 left-1.5 flex items-center justify-center font-medium text-xs
                  ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5' : ''}
                `}>
                  {dayNum}
                </div>
                
                {/* Hours */}
                {hours && (
                  <div className="absolute top-1 right-1.5 font-medium text-xs">
                    {hours}h
                  </div>
                )}
                
                {/* Location */}
                {location && belongsToCurrentMonth && (
                  <div className="flex-grow flex items-center justify-center">
                    <span className="text-xs font-medium">{locationInfo[location as keyof typeof locationInfo].name}</span>
                  </div>
                )}
                
                {/* Annotation */}
                {annotation && (
                  <div className="absolute bottom-1 left-0 right-0 px-1">
                    <span className="text-xs truncate block text-center">
                      {annotation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Location legend */}
      <div className="flex flex-wrap gap-4 p-4 border-t border-slate-200 bg-slate-50">
        {Object.entries(locationInfo).map(([key, info]) => {
          const locationTotal = totals[key as keyof typeof totals];
          if (locationTotal <= 0) return null;
          
          return (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${info.color}`}></div>
              <span className="text-sm text-slate-700">{info.name}: <span className="font-medium">{locationTotal}h</span></span>
            </div>
          );
        })}
      </div>

      <DateAnnotationDialog
        open={isAnnotationDialogOpen}
        onOpenChange={setIsAnnotationDialogOpen}
        date={selectedDate}
        onSave={handleSaveAnnotation}
        currentAnnotation={selectedDate ? annotations[format(selectedDate, 'yyyy-MM-dd')] : ''}
      />
    </div>
  );
};
