import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [travels, setTravels] = useState<any[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchVolunteerCounts = async () => {
      const travelsRef = collection(db, "travels");
      const travelsSnapshot = await getDocs(travelsRef);
      const counts: {[key: string]: number} = {};
      
      travelsSnapshot.docs.forEach(doc => {
        const travel = doc.data();
        if (travel.volunteers) {
          travel.volunteers.forEach((volunteer: string) => {
            counts[volunteer] = (counts[volunteer] || 0) + 1;
          });
        }
      });
      
      setVolunteerCounts(counts);
    };

    fetchVolunteerCounts();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "travels"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const travelsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTravels(travelsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = differenceInDays(end, start) + 1;
      setDailyAllowance(String(days));
    }
  }, [startDate, endDate]);

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
      const travelSnapshot = await getDocs(query(collection(db, "travels"), where("id", "==", travelId)));
      const travelData = travelSnapshot.docs[0].data();

      if (travelData.volunteers?.includes(user.name)) {
        toast({
          title: "Aviso",
          description: "Você já é voluntário desta viagem.",
        });
        return;
      }

      if (travelData.volunteers?.length >= travelData.slots) {
        toast({
          title: "Aviso",
          description: "Não há mais vagas disponíveis.",
        });
        return;
      }

      const updatedVolunteers = [...(travelData.volunteers || []), user.name];
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers,
      });

      // Update volunteer counts
      setVolunteerCounts(prev => ({
        ...prev,
        [user.name]: (prev[user.name] || 0) + 1
      }));

      toast({
        title: "Sucesso",
        description: "Você se candidatou com sucesso!",
      });
    } catch (error) {
      console.error("Error volunteering:", error);
      toast({
        title: "Erro",
        description: "Erro ao se candidatar.",
        variant: "destructive",
      });
    }
  };

  const sortVolunteers = (volunteers: string[]) => {
    return [...volunteers].sort((a, b) => {
      const countA = volunteerCounts[a] || 0;
      const countB = volunteerCounts[b] || 0;
      return countA - countB; // Menor número de viagens primeiro
    });
  };

  return (
    <div className="p-6 space-y-8">
      {user.userType === "admin" && (
        <Card className="p-6 bg-white shadow-lg">
          <form onSubmit={handleCreateTravel} className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">Criar Nova Viagem</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Digite o destino"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyAllowance">Diárias (calculado automaticamente)</Label>
                <Input
                  id="dailyAllowance"
                  type="number"
                  value={dailyAllowance}
                  readOnly
                  className="w-full bg-gray-50"
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">Criar Viagem</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {travels.map((travel) => {
          const travelDate = new Date(travel.startDate);
          const today = new Date();
          const showVolunteerButton = travelDate > today;
          const sortedVolunteers = travel.volunteers ? sortVolunteers(travel.volunteers) : [];

          return (
            <Card key={travel.id} className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">{travel.destination}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Data Inicial: {new Date(travel.startDate).toLocaleDateString()}</p>
                    <p>Data Final: {new Date(travel.endDate).toLocaleDateString()}</p>
                    <p>Vagas Disponíveis: {travel.slots - (travel.volunteers?.length || 0)} de {travel.slots}</p>
                    <p>Diárias: {travel.dailyAllowance}</p>
                  </div>
                </div>
                
                {showVolunteerButton && (
                  <Button 
                    onClick={() => handleVolunteer(travel.id)}
                    className="w-full"
                    variant={travel.volunteers?.includes(user.name) ? "secondary" : "default"}
                    disabled={travel.volunteers?.includes(user.name)}
                  >
                    {travel.volunteers?.includes(user.name) ? "Já Inscrito" : "Quero ser Voluntário"}
                  </Button>
                )}

                {sortedVolunteers.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Voluntários (ordenados por menor número de viagens):</h4>
                    <ul className="space-y-1">
                      {sortedVolunteers.map((volunteerName: string) => (
                        <li key={volunteerName} className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex justify-between items-center">
                          <span>{volunteerName}</span>
                          <span className="text-xs text-gray-500">
                            {volunteerCounts[volunteerName] || 0} viagem(ns)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};