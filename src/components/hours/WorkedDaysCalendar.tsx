
import { useMemo, useState } from 'react';
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateAnnotationDialog } from './DateAnnotationDialog';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarFooter } from './CalendarFooter';

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
  
  // Parse the monthYear string to create a date object
  const [month, year] = monthYear.split('/');
  const monthYearDate = new Date(parseInt(year), parseInt(month) - 1);
  
  const calendarDays = useMemo(() => {
    const startDate = startOfMonth(monthYearDate);
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
  
  const locationHours = calculateTotalHoursByLocation();
  
  return (
    <div className={`overflow-hidden rounded-lg shadow-sm border ${className}`}>
      {/* Calendar Header */}
      <CalendarHeader monthYear={monthYear} />
      
      {/* Calendar Grid */}
      <CalendarGrid 
        calendarDays={calendarDays}
        workedDays={workedDays}
        selectedDate={selectedDate}
        handleDayClick={handleDayClick}
        annotations={annotations}
        monthYearDate={monthYearDate}
        isAdmin={isAdmin}
      />
      
      {/* Calendar Footer */}
      <CalendarFooter 
        total={total} 
        locationHours={locationHours}
      />
      
      {/* Date Annotation Dialog */}
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
