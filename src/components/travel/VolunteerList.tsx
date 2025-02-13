
interface VolunteerListProps {
  sortedVolunteers: any[];
  volunteerCounts: { [key: string]: number };
  diaryCounts: { [key: string]: number };
  formattedTravelCount: (count: number) => string;
  formattedDiaryCount: (count: number) => string;
}

export const VolunteerList = ({
  sortedVolunteers,
  volunteerCounts,
  diaryCounts,
  formattedTravelCount,
  formattedDiaryCount,
}: VolunteerListProps) => {
  if (!sortedVolunteers.length) return null;

  return (
    <div className="pt-3 border-t border-gray-200">
      <h4 className="font-medium text-sm text-gray-700 mb-2">Voluntários:</h4>
      <div className="space-y-2">
        {sortedVolunteers.map((vol) => (
          <div
            key={vol.fullName}
            className={`text-sm p-2 rounded-lg flex justify-between items-center ${
              vol.isSelected
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {vol.isSelected && (
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              )}
              <span className={vol.isSelected ? "font-medium text-green-900" : "text-gray-700"}>
                {vol.fullName}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs block ${vol.isSelected ? "text-green-700" : "text-gray-500"}`}>
                {formattedTravelCount(volunteerCounts[vol.fullName] || 0)}
              </span>
              <span className={`text-xs block ${vol.isSelected ? "text-green-700" : "text-gray-500"}`}>
                {formattedDiaryCount(diaryCounts[vol.fullName] || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
