
interface VolunteerListProps {
  volunteers: string[];
  slots: number;
  isLocked: boolean;
  volunteerCounts: { [key: string]: number };
  diaryCounts: { [key: string]: number };
}

const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: { [key: string]: number } = {
    "Cel PM": 12,
    "Ten Cel PM": 11,
    "Maj PM": 10,
    "Cap PM": 9,
    "1° Ten PM": 8,
    "2° Ten PM": 7,
    "Sub Ten PM": 6,
    "1° Sgt PM": 5,
    "2° Sgt PM": 4,
    "3° Sgt PM": 3,
    "Cb PM": 2,
    "Sd PM": 1,
    "Estágio": 0,
  };

  return rankWeights[rank] || 0;
};

export const VolunteerList = ({
  volunteers,
  slots,
  isLocked,
  volunteerCounts,
  diaryCounts,
}: VolunteerListProps) => {
  const sortVolunteers = (volunteers: string[], slots: number) => {
    if (!volunteers?.length) return [];

    const processedVolunteers = volunteers.map((volunteer) => {
      const [rank, ...nameParts] = volunteer.split(" ");
      return {
        fullName: volunteer,
        rank,
        count: volunteerCounts[volunteer] || 0,
        diaryCount: diaryCounts[volunteer] || 0,
        rankWeight: getMilitaryRankWeight(rank),
      };
    });

    const sortedVolunteers = processedVolunteers.sort((a, b) => {
      if (a.diaryCount !== b.diaryCount) {
        return a.diaryCount - b.diaryCount;
      }
      return b.rankWeight - a.rankWeight;
    });

    return sortedVolunteers.map((volunteer, index) => ({
      ...volunteer,
      selected: index < slots,
    }));
  };

  const sortedVolunteers = sortVolunteers(volunteers, slots);

  return (
    <div className="pt-4 border-t border-gray-200">
      <h4 className="font-medium text-gray-700 mb-3">Voluntários:</h4>
      <div className="space-y-2">
        {sortedVolunteers
          .filter((volunteer) => !isLocked || volunteer.selected)
          .map((volunteer) => (
            <div
              key={volunteer.fullName}
              className={`p-3 rounded-lg transition-all ${
                volunteer.selected
                  ? "bg-green-50 border border-green-200 shadow-sm"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={volunteer.selected ? "font-medium text-gray-800" : "text-gray-600"}>
                  {volunteer.fullName}
                </span>
                <div className="flex gap-3 text-xs">
                  <span className={`${volunteer.selected ? "text-green-700" : "text-gray-500"}`}>
                    {volunteer.count === 1 ? "1 viagem" : `${volunteer.count} viagens`}
                  </span>
                  <span className={`${volunteer.selected ? "text-green-700" : "text-gray-500"}`}>
                    {volunteer.diaryCount === 1 ? "1 diária" : `${volunteer.diaryCount} diárias`}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
