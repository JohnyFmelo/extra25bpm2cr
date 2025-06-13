
import { useMemo, useState } from 'react';
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateAnnotationDialog } from './DateAnnotationDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const getLocationColor = (location: string | undefined) => {
    switch (location) {
      case 'bpm':
        return 'bg-blue-600 text-white';
      case 'saiop':
        return 'bg-green-500 text-white';
      case 'sinfra':
        return 'bg-slate-600 text-white';
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

  const totals = calculateTotalHoursByLocation();
  const [month, year] = monthYear.split('/');
  const monthYearFormatted = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: ptBR });

  const isCurrentMonth = (date: Date) => {
    const monthYearDate = parse(monthYear, 'M/yyyy', new Date());
    return date.getMonth() === monthYearDate.getMonth() && date.getFullYear() === monthYearDate.getFullYear();
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium capitalize">{monthYearFormatted}</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2 max-w-3xl mx-auto">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {calendarDays.map((date, index) => {
          const dayNum = date.getDate();
          const belongsToCurrentMonth = isCurrentMonth(date);
          const location = belongsToCurrentMonth ? getLocationForDay(dayNum) : undefined;
          const hours = belongsToCurrentMonth ? getHoursForDay(dayNum) : '';
          const locationClasses = getLocationColor(location);
          const dateKey = format(date, 'yyyy-MM-dd');
          const annotation = annotations[dateKey];
          
          return (
            <div
              key={index}
              onClick={() => handleDayClick(date)}
              className={`
                aspect-square rounded-lg p-1 flex flex-col items-center justify-start
                ${belongsToCurrentMonth ? '' : 'bg-gray-50 text-gray-400'}
                ${locationClasses}
                ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}
                text-base md:text-sm
              `}
            >
              <span className={`font-medium ${belongsToCurrentMonth && !location ? '' : ''}`}>
                {dayNum}
              </span>
              {hours && (
                <span className="font-medium">{hours}h</span>
              )}
              {annotation && (
                <span className={`text-xs ${location ? 'text-white' : 'text-gray-600'} truncate max-w-full px-1`}>
                  {annotation}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-200">
        {totals.bpm > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span className="text-sm text-gray-600">25° BPM: {totals.bpm}h</span>
          </div>
        )}
        {totals.saiop > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">SAIOP: {totals.saiop}h</span>
          </div>
        )}
        {totals.sinfra > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-600"></div>
            <span className="text-sm text-gray-600">SINFRA: {totals.sinfra}h</span>
          </div>
        )}
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
