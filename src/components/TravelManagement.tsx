import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [travels, setTravels] = useState<any[]>([]);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleCreateTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, "travels"), {
        startDate,
        endDate,
        slots: Number(slots),
        destination,
        dailyAllowance: Number(dailyAllowance),
        createdAt: new Date(),
        volunteers: [],
      });

      toast({
        title: "Sucesso",
        description: "Viagem criada com sucesso!",
      });

      setStartDate("");
      setEndDate("");
      setSlots("");
      setDestination("");
      setDailyAllowance("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar viagem.",
        variant: "destructive",
      });
    }
  };

  const handleVolunteer = async (travelId: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelDoc = await getDocs(query(collection(db, "travels"), where("id", "==", travelId)));
      const travelData = travelDoc.docs[0].data();

      if (travelData.volunteers.includes(user.id)) {
        toast({
          title: "Aviso",
          description: "Você já é voluntário desta viagem.",
        });
        return;
      }

      if (travelData.volunteers.length >= travelData.slots) {
        toast({
          title: "Aviso",
          description: "Não há mais vagas disponíveis.",
        });
        return;
      }

      await updateDoc(travelRef, {
        volunteers: [...travelData.volunteers, user.id],
      });

      toast({
        title: "Sucesso",
        description: "Você se candidatou com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao se candidatar.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      {user.userType === "admin" && (
        <form onSubmit={handleCreateTravel} className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Criar Nova Viagem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slots">Número de Vagas</Label>
              <Input
                id="slots"
                type="number"
                value={slots}
                onChange={(e) => setSlots(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyAllowance">Diárias</Label>
              <Input
                id="dailyAllowance"
                type="number"
                value={dailyAllowance}
                onChange={(e) => setDailyAllowance(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit">Criar Viagem</Button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {travels.map((travel) => {
          const travelDate = new Date(travel.startDate);
          const today = new Date();
          const showVolunteerButton = travelDate > today;

          return (
            <Card key={travel.id} className="p-4">
              <h3 className="font-semibold mb-2">{travel.destination}</h3>
              <p>Data Inicial: {new Date(travel.startDate).toLocaleDateString()}</p>
              <p>Data Final: {new Date(travel.endDate).toLocaleDateString()}</p>
              <p>Vagas: {travel.slots - (travel.volunteers?.length || 0)} / {travel.slots}</p>
              <p>Diárias: {travel.dailyAllowance}</p>
              {showVolunteerButton && (
                <Button 
                  onClick={() => handleVolunteer(travel.id)}
                  className="mt-4"
                  disabled={travel.volunteers?.includes(user.id)}
                >
                  {travel.volunteers?.includes(user.id) ? "Já Inscrito" : "Voluntário"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};