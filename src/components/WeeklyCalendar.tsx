
import React from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/hooks/use-calendar";
import TimeSlotDialog from "./TimeSlotDialog";
import CalendarHeader from "./calendar/CalendarHeader";
import WeekNavigation from "./calendar/WeekNavigation";
import WeekDaySlots from "./calendar/WeekDaySlots";
import WeekSlotsView from "./calendar/WeekSlotsView";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface WeeklyCalendarProps {
  className?: string;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  showControls?: boolean;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
}

const WeeklyCalendar = ({
  className,
  currentDate: externalCurrentDate,
  onDateChange,
  showControls = true,
  isLocked = false,
  onLockChange
}: WeeklyCalendarProps) => {
  const {
    selectedDate,
    timeSlots,
    editingTimeSlot,
    isDialogOpen,
    showAllWeekSlots,
    showDeleteAlert,
    currentMonth,
    currentDateValue,
    setShowDeleteAlert,
    setIsDialogOpen,
    setEditingTimeSlot,
    handleTimeSlotAdd,
    handleTimeSlotEdit,
    handleDeleteTimeSlot,
    handleClearAllTimeSlots,
    handlePreviousWeek,
    handleNextWeek,
    handleDayClick,
    handlePlusClick,
    handleEyeClick,
    handleEditClick,
    getTimeSlotsForDate,
    getCurrentWeekTimeSlots,
    getDaysOfWeek
  } = useCalendar(externalCurrentDate, onDateChange);

  return (
    <div className={cn("bg-white rounded-xl shadow-sm p-4 md:p-6", className)}>
      <CalendarHeader
        currentMonth={currentMonth}
        showControls={showControls}
        selectedDate={selectedDate}
        onPlusClick={handlePlusClick}
        onEyeClick={handleEyeClick}
        onTrashClick={() => setShowDeleteAlert(true)}
        showAllWeekSlots={showAllWeekSlots}
        isLocked={isLocked}
      />

      <WeekNavigation
        days={getDaysOfWeek()}
        onPrevWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onDayClick={handleDayClick}
        selectedDate={selectedDate}
        isLocked={isLocked}
      />
      
      {showAllWeekSlots ? (
        <WeekSlotsView
          weekSlots={getCurrentWeekTimeSlots()}
          onEdit={handleEditClick}
          onDelete={handleDeleteTimeSlot}
        />
      ) : (
        <WeekDaySlots
          selectedDate={selectedDate}
          timeSlots={timeSlots}
          onEdit={handleEditClick}
          onDelete={handleDeleteTimeSlot}
        />
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todos os horários</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todos os horários? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllTimeSlots}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDate && (
        <TimeSlotDialog 
          open={isDialogOpen} 
          onOpenChange={open => {
            setIsDialogOpen(open);
            if (!open) setEditingTimeSlot(null);
          }} 
          selectedDate={selectedDate} 
          onAddTimeSlot={handleTimeSlotAdd} 
          onEditTimeSlot={handleTimeSlotEdit} 
          editingTimeSlot={editingTimeSlot} 
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;
