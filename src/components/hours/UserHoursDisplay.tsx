
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { HoursData } from "@/types/hours";
import { Clock, Building2, Warehouse, Radio, X } from "lucide-react";

interface UserHoursDisplayProps {
  data: HoursData;
  onClose: () => void;
}

export const UserHoursDisplay = ({ data, onClose }: UserHoursDisplayProps) => {
  return (
    <Card className="mt-6 border border-primary/10 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="relative pb-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute right-4 top-4 text-muted-foreground hover:text-destructive transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl text-center text-primary font-bold">
          {data.Nome}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data["Horas 25° BPM"] && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-700">25° BPM</h3>
              </div>
              <p className="text-2xl font-bold text-blue-800">{data["Horas 25° BPM"]}</p>
              {data["Total 25° BPM"] && (
                <p className="text-sm text-blue-600 mt-1">
                  Total: {data["Total 25° BPM"]}
                </p>
              )}
            </div>
          )}
          
          {data.Sonora && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium text-purple-700">Sonora</h3>
              </div>
              <p className="text-2xl font-bold text-purple-800">{data.Sonora}</p>
            </div>
          )}
          
          {data.Sinfra && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="h-5 w-5 text-orange-600" />
                <h3 className="font-medium text-orange-700">Sinfra</h3>
              </div>
              <p className="text-2xl font-bold text-orange-800">{data.Sinfra}</p>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-700">Total Geral de Horas</h3>
          </div>
          {data["Total Geral"] && (
            <p className="text-3xl font-bold text-green-700">
              {data["Total Geral"]}
            </p>
          )}
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
