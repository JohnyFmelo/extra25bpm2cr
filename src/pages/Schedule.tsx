import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ScheduleList from '@/components/ScheduleList';

const Schedule = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual data from your backend
  const mockTimeSlots = [
    {
      date: new Date(),
      startTime: "13:00",
      endTime: "19:00",
      slots: 2,
      slotsUsed: 2,
      volunteers: ["João Silva", "Maria Santos"]
    },
    // Add more mock data as needed
  ];

  return (
    <div className="relative min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Escala</h2>
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-accent/10 transition-colors"
            aria-label="Voltar para home"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
        <ScheduleList timeSlots={mockTimeSlots} />
      </div>
    </div>
  );
};

export default Schedule;