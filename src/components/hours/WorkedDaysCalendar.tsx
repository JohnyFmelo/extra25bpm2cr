
import { useMemo, useState } from 'react';
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateAnnotationDialog } from './DateAnnotationDialog';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import UserSelectionDialog from "@/components/UserSelectionDialog";
import { doc, getDoc, updateDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  const [isUserSelectionDialogOpen, setIsUserSelectionDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { toast } = useToast();

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

  // New function to handle adding volunteers to a specific day
  const handleAddVolunteersToDay = (day: string) => {
    setSelectedDay(day);
    setIsUserSelectionDialogOpen(true);
  };

  // New function to handle the selected users from the dialog
  const handleVolunteersSelected = async (selectedUsers: string[]) => {
    if (!selectedDay) return;
    
    try {
      // Here you would typically update the database with the selected volunteers for the extra shift on the selected day
      // For now, we'll just show a toast indicating the action was successful
      toast({
        title: "Voluntários adicionados",
        description: `${selectedUsers.length} voluntários adicionados para o dia ${selectedDay}.`
      });
      
      // Additional logic could be implemented here to update the Firebase database
      // with the selected volunteers for the specific day's extra shift
      
    } catch (error) {
      console.error("Erro ao adicionar voluntários:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar voluntários para o turno extra.",
        variant: "destructive"
      });
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
    <>
      <div className={className}>
        <div className="mb-4">
          <h2 className="text-xl font-bold capitalize">{monthYearFormatted}</h2>
          <p className="text-gray-600">Total de horas: {total}</p>
          <div className="flex space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span className="text-xs">BPM: {totals.bpm}h</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs">SAIOP: {totals.saiop}h</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">SINFRA: {totals.sinfra}h</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          <div className="text-center font-semibold text-sm text-gray-600">Seg</div>
          <div className="text-center font-semibold text-sm text-gray-600">Ter</div>
          <div className="text-center font-semibold text-sm text-gray-600">Qua</div>
          <div className="text-center font-semibold text-sm text-gray-600">Qui</div>
          <div className="text-center font-semibold text-sm text-gray-600">Sex</div>
          <div className="text-center font-semibold text-sm text-gray-600">Sáb</div>
          <div className="text-center font-semibold text-sm text-gray-600">Dom</div>
          
          {calendarDays.map((day, i) => {
            const dayNum = day.getDate();
            const isOtherMonth = !isCurrentMonth(day);
            const hours = isCurrentMonth(day) ? getHoursForDay(dayNum) : '';
            const location = isCurrentMonth(day) ? getLocationForDay(dayNum) : undefined;
            const hasHours = hours !== '';
            const locationColor = getLocationColor(location);
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasAnnotation = annotations[dateKey];
            const dayClasses = `
              relative p-1 min-h-[60px] flex flex-col items-center justify-center
              ${isOtherMonth ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-800'}
              ${hasHours ? locationColor : ''}
              ${hasAnnotation ? 'border-2 border-blue-400' : ''}
              hover:shadow-md transition-shadow
            `;
            
            return (
              <div
                key={i}
                className={dayClasses}
                onClick={() => handleDayClick(day)}
              >
                <div className="w-full flex justify-between items-center mb-1">
                  <span className={`text-sm ${hasHours ? '' : 'text-gray-600'}`}>{dayNum}</span>
                  
                  {/* Add "+" button for admin to add volunteers for extra shifts */}
                  {isAdmin && isCurrentMonth(day) && location && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 text-white hover:bg-white/20 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddVolunteersToDay(dayNum.toString());
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {hasHours && (
                  <span className="text-xs font-bold">{hours}h</span>
                )}
                
                {hasAnnotation && (
                  <div className="absolute bottom-0 right-0 left-0 text-xs text-center bg-blue-100 text-blue-800 p-0.5 truncate">
                    {annotations[dateKey]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <DateAnnotationDialog
        open={isAnnotationDialogOpen}
        onOpenChange={setIsAnnotationDialogOpen}
        date={selectedDate || new Date()}
        currentAnnotation={selectedDate ? annotations[format(selectedDate, 'yyyy-MM-dd')] || '' : ''}
        onSave={handleSaveAnnotation}
      />
      
      <UserSelectionDialog
        open={isUserSelectionDialogOpen}
        onOpenChange={setIsUserSelectionDialogOpen}
        onSelect={handleVolunteersSelected}
        title={`Adicionar Voluntários - Dia ${selectedDay}`}
      />
    </>
  );
};
