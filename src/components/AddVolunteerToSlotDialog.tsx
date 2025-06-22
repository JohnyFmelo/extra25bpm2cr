
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddVolunteerToSlotDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onAddVolunteer?: (volunteerName: string, volunteerDate: Date, volunteerTimeSlot: string) => void;
  onVolunteerAdded?: () => void;
  selectedDate?: Date | null;
  selectedTimeSlot?: string | null;
  timeSlot?: any;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onAddVolunteer,
  onVolunteerAdded,
  selectedDate,
  selectedTimeSlot,
  timeSlot,
}) => {
  const [volunteerName, setVolunteerName] = useState('');
  
  const dialogOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const handleAdd = () => {
    const date = selectedDate || (timeSlot?.date ? new Date(timeSlot.date) : null);
    const slot = selectedTimeSlot || timeSlot?.time;
    
    if (volunteerName && date && slot) {
      if (onAddVolunteer) {
        onAddVolunteer(volunteerName, date, slot);
      }
      if (onVolunteerAdded) {
        onVolunteerAdded();
      }
      handleClose();
    } else {
      alert('Please fill in all fields.');
    }
  };

  useEffect(() => {
    if (dialogOpen && (selectedDate || timeSlot?.date) && (selectedTimeSlot || timeSlot?.time)) {
      const dateField = document.getElementById('volunteer-date') as HTMLInputElement;
      if (dateField) {
        const date = selectedDate || (timeSlot?.date ? new Date(timeSlot.date) : new Date());
        dateField.value = format(date, 'yyyy-MM-dd');
      }
      setVolunteerName('');
    }
  }, [dialogOpen, selectedDate, selectedTimeSlot, timeSlot]);

  const displayDate = selectedDate || (timeSlot?.date ? new Date(timeSlot.date) : null);
  const displayTimeSlot = selectedTimeSlot || timeSlot?.time;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Volunteer</DialogTitle>
          <DialogDescription>
            Enter the volunteer's name for {displayTimeSlot} on {displayDate ? format(displayDate, 'MMMM dd, yyyy') : 'N/A'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteer-name" className="text-right">
              Name
            </Label>
            <Input
              type="text"
              id="volunteer-name"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteer-date" className="text-right">
              Date
            </Label>
            <Input
              type="date"
              id="volunteer-date"
              disabled
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volunteer-time" className="text-right">
              Time Slot
            </Label>
            <Input
              type="text"
              id="volunteer-time"
              disabled
              value={displayTimeSlot || ''}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleAdd}>Add Volunteer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
