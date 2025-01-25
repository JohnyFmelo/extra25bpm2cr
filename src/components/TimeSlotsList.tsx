import { useQuery } from "@tanstack/react-query";
import { getTimeSlots } from "@/lib/firebase";
import { TimeSlot } from "@/types/user";

const TimeSlotsList = () => {
  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: getTimeSlots
  });

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {timeSlots?.map((slot: TimeSlot) => (
        <div key={slot.id} className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium">{slot.title}</h3>
          <p className="text-sm text-gray-600">{slot.description}</p>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(slot.date).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TimeSlotsList;