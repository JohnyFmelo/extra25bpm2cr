import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddVolunteerToSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVolunteer: (volunteerName: string, volunteerDate: Date, volunteerTimeSlot: string) => void;
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
}

const AddVolunteerToSlotDialog: React.FC<AddVolunteerToSlotDialogProps> = ({
  isOpen,
  onClose,
  onAddVolunteer,
  selectedDate,
  selectedTimeSlot,
}) => {
  const [volunteerName, setVolunteerName] = useState('');

  const handleAdd = () => {
    if (volunteerName && selectedDate && selectedTimeSlot) {
      onAddVolunteer(volunteerName, selectedDate, selectedTimeSlot);
      onClose();
    } else {
      alert('Please fill in all fields.');
    }
  };

  useEffect(() => {
    if (isOpen && selectedDate && selectedTimeSlot) {
      const dateField = document.getElementById('volunteer-date') as HTMLInputElement;
      if (dateField) {
        dateField.value = format(selectedDate, 'yyyy-MM-dd');
      }
      setVolunteerName('');
    }
  }, [isOpen, selectedDate, selectedTimeSlot]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Volunteer</DialogTitle>
          <DialogDescription>
            Enter the volunteer's name for {selectedTimeSlot} on {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'N/A'}.
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
              value={selectedTimeSlot || ''}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleAdd}>Add Volunteer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVolunteerToSlotDialog;
