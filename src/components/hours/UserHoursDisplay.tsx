
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoursData } from "@/types/hours";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({ data, onClose }: UserHoursDisplayProps) => {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-center font-bold text-xl">{data.Nome}</h2>
      
      <div>
        <h3 className="font-bold mb-2">Dias trabalhados:</h3>
        {data["Horas 25° BPM"] && (
          <p>25° BPM: {data["Horas 25° BPM"]}</p>
        )}
        {data.Sonora && <p>Sonora: {data.Sonora}</p>}
        {data.Sinfra && <p>Sinfra: {data.Sinfra}</p>}
      </div>

      <Separator />

      <div>
        <h3 className="font-bold mb-2">Horas:</h3>
        {data["Total 25° BPM"] && (
          <p>25° BPM: {data["Total 25° BPM"]}</p>
        )}
        {data["Total Geral"] && (
          <p className="font-bold text-green-600">
            Total: {data["Total Geral"]}
          </p>
        )}
      </div>

      <Button 
        variant="destructive" 
        className="w-full mt-4"
        onClick={onClose}
      >
        Fechar
      </Button>
    </div>
  );
};
