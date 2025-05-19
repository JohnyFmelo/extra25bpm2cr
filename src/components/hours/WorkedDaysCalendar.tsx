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
  return;
};