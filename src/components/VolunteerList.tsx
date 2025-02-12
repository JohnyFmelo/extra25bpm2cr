
import { Clock, User, BarChart3 } from "lucide-react";

interface VolunteerListProps {
  volunteers: string[];
  slots: number;
  isLocked: boolean;
  volunteerCounts: { [key: string]: number };
  diaryCounts: { [key: string]: number };
  status: "processando" | "transito" | "aberto" | "encerrada";
}

const getMilitaryRankWeight = (rank: string): number => {
  const rankWeights: { [key: string]: number } = {
    "Cel": 12,
    "Cel PM": 12,
    "Ten Cel": 11,
    "Ten Cel PM": 11,
    "Maj": 10,
    "Maj PM": 10,
    "Cap": 9,
    "Cap PM": 9,
    "1° Ten": 8,
    "1° Ten PM": 8,
    "2° Ten": 7,
    "2° Ten PM": 7,
    "Sub Ten": 6,
    "Sub Ten PM": 6,
    "1° Sgt": 5,
    "1° Sgt PM": 5,
    "2° Sgt": 4,
    "2° Sgt PM": 4,
    "3° Sgt": 3,
    "3° Sgt PM": 3,
    "Cb": 2,
    "Cb PM": 2,
    "Sd": 1,
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
  status
}: VolunteerListProps) => {
  const sortVolunteers = (volunteers: string[], slots: number) => {
    if (!volunteers?.length) return [];

    const processedVolunteers = volunteers.map((volunteer) => {
      const [rank] = volunteer.split(" ");
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
      if (a.rankWeight !== b.rankWeight) {
        return b.rankWeight - a.rankWeight;
      }
      return 0;
    });

    return sortedVolunteers.map((volunteer, index) => ({
      ...volunteer,
      selected: index < slots,
    }));
  };

  const sortedVolunteers = sortVolunteers(volunteers, slots);
  const shouldShowGreenContainer = status === "processando" || status === "transito";

  return (
    <div className="pt-4 border-t border-gray-200">
      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
        <User className="h-4 w-4" />
        Voluntários:
      </h4>
      <div className="space-y-2">
        {sortedVolunteers
          .filter((volunteer) => !isLocked || volunteer.selected)
          .map((volunteer) => (
            <div
              key={volunteer.fullName}
              className={`p-3 rounded-lg transition-all ${
                shouldShowGreenContainer && volunteer.selected
                  ? "bg-green-50 border border-green-200 shadow-sm"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`flex items-center gap-2 ${volunteer.selected ? "font-medium text-gray-800" : "text-gray-600"}`}>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
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
