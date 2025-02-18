
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { HoursData } from "@/types/hours";
import { Clock, Calendar, X } from "lucide-react";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({ data, onClose }: UserHoursDisplayProps) => {
  return (
    <Card className="mt-6 border-2 border-primary/10 shadow-lg">
      <CardHeader className="relative pb-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute right-4 top-4 text-muted-foreground hover:text-destructive"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl text-center text-primary font-bold">
          {data.Nome}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            <h3 className="font-semibold">Dias trabalhados</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            {data["Horas 25° BPM"] && (
              <div className="bg-secondary/5 p-3 rounded-lg">
                <p className="text-secondary font-medium">25° BPM</p>
                <p className="text-lg font-semibold">{data["Horas 25° BPM"]}</p>
              </div>
            )}
            {data.Sonora && (
              <div className="bg-accent/5 p-3 rounded-lg">
                <p className="text-accent font-medium">Sonora</p>
                <p className="text-lg font-semibold">{data.Sonora}</p>
              </div>
            )}
            {data.Sinfra && (
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-primary font-medium">Sinfra</p>
                <p className="text-lg font-semibold">{data.Sinfra}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5" />
            <h3 className="font-semibold">Total de Horas</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            {data["Total 25° BPM"] && (
              <div className="bg-secondary/5 p-3 rounded-lg">
                <p className="text-secondary font-medium">25° BPM</p>
                <p className="text-lg font-semibold">{data["Total 25° BPM"]}</p>
              </div>
            )}
            {data["Total Geral"] && (
              <div className="bg-green-50 p-3 rounded-lg border-2 border-green-100">
                <p className="text-green-700 font-medium">Total Geral</p>
                <p className="text-2xl font-bold text-green-600">
                  {data["Total Geral"]}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={onClose}
        >
          Fechar
        </Button>
      </CardFooter>
    </Card>
  );
};
