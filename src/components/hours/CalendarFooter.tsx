
interface LocationHours {
  bpm: number;
  saiop: number;
  sinfra: number;
}

interface CalendarFooterProps {
  total: string;
  locationHours: LocationHours;
}

export const CalendarFooter = ({ total, locationHours }: CalendarFooterProps) => {
  return (
    <div className="p-4 bg-white border-t">
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="font-medium text-gray-700">Total:</span>
        <span className="font-bold text-primary">{total}h</span>
      </div>
      
      <div className="space-y-1.5 text-xs">
        {Object.entries(locationHours).filter(([_, value]) => value > 0).map(([location, hours]) => (
          <div key={location} className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${
                location === 'bpm' ? 'bg-purple-600' : 
                location === 'saiop' ? 'bg-green-500' : 'bg-blue-500'
              }`}></span>
              <span className="uppercase text-gray-600">{location}:</span>
            </div>
            <span className="font-medium">{hours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
};
