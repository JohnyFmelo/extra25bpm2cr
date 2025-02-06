import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [dailyAllowance, setDailyAllowance] = useState("");
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [travels, setTravels] = useState<any[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{[key: string]: number}>({});
  const [editingTravel, setEditingTravel] = useState<any>(null);
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
      if (editingTravel) {
        const travelRef = doc(db, "travels", editingTravel.id);
        await updateDoc(travelRef, {
          startDate,
          endDate,
          slots: Number(slots),
          destination,
          dailyAllowance: Number(dailyAllowance),
          updatedAt: new Date(),
        });

        toast({
          title: "Sucesso",
          description: "Viagem atualizada com sucesso!",
        });
        setEditingTravel(null);
      } else {
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
      }

      setStartDate("");
      setEndDate("");
      setSlots("");
      setDestination("");
      setDailyAllowance("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar viagem.",
        variant: "destructive",
      });
    }
  };

  const handleEditTravel = (travel: any) => {
    setEditingTravel(travel);
    setStartDate(travel.startDate);
    setEndDate(travel.endDate);
    setSlots(String(travel.slots));
    setDestination(travel.destination);
    setDailyAllowance(String(travel.dailyAllowance));
  };

  const handleDeleteTravel = async (travelId: string) => {
    try {
      await deleteDoc(doc(db, "travels", travelId));
      toast({
        title: "Sucesso",
        description: "Viagem excluída com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir viagem.",
        variant: "destructive",
      });
    }
  };

  const handleVolunteer = async (travelId: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelDoc = await getDocs(query(collection(db, "travels"), where("id", "==", travelId)));
      
      if (travelDoc.empty) {
        throw new Error("Viagem não encontrada");
      }

      const travelData = travelDoc.docs[0].data();
      const currentVolunteers = travelData.volunteers || [];

      if (currentVolunteers.includes(user.name)) {
        toast({
          title: "Aviso",
          description: "Você já é voluntário desta viagem.",
        });
        return;
      }

      if (currentVolunteers.length >= travelData.slots) {
        toast({
          title: "Aviso",
          description: "Não há mais vagas disponíveis.",
        });
        return;
      }

      const updatedVolunteers = [...currentVolunteers, user.name];
      await updateDoc(travelRef, {
        volunteers: updatedVolunteers,
      });

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

  const handleUpdateDailyAllowance = async (travelId: string, newAllowance: string) => {
    try {
      const travelRef = doc(db, "travels", travelId);
      await updateDoc(travelRef, {
        dailyAllowance: Number(newAllowance)
      });
      setIsEditingAllowance(false);
      toast({
        title: "Sucesso",
        description: "Diárias atualizadas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar diárias.",
        variant: "destructive",
      });
    }
  };

  const sortVolunteers = (volunteers: string[]) => {
    return [...volunteers].sort((a, b) => {
      const countA = volunteerCounts[a] || 0;
      const countB = volunteerCounts[b] || 0;
      return countA - countB;
    });
  };

  return (
    <div className="p-6 space-y-8">
      {user.userType === "admin" && (
        <Card className="p-6 bg-white shadow-lg">
          <form onSubmit={handleCreateTravel} className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary">
              {editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}
            </h2>
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
                <Label htmlFor="dailyAllowance">Diárias</Label>
                <Input
                  id="dailyAllowance"
                  type="number"
                  value={dailyAllowance}
                  onChange={(e) => setDailyAllowance(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="w-full md:w-auto">
                {editingTravel ? "Salvar Alterações" : "Criar Viagem"}
              </Button>
              {editingTravel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTravel(null);
                    setStartDate("");
                    setEndDate("");
                    setSlots("");
                    setDestination("");
                    setDailyAllowance("");
                  }}
                  className="w-full md:w-auto"
                >
                  Cancelar
                </Button>
              )}
            </div>
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
            <Card key={travel.id} className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow relative">
              {user.userType === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditTravel(travel)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteTravel(travel.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">{travel.destination}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>Data Inicial: {new Date(travel.startDate).toLocaleDateString()}</p>
                    <p>Data Final: {new Date(travel.endDate).toLocaleDateString()}</p>
                    <p>Voluntários: {travel.volunteers?.length || 0} vagas</p>
                    <div className="flex items-center gap-2">
                      <p>Diárias: {travel.dailyAllowance}</p>
                      {user.userType === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setIsEditingAllowance(true)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {isEditingAllowance && user.userType === "admin" && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          value={dailyAllowance}
                          onChange={(e) => setDailyAllowance(e.target.value)}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateDailyAllowance(travel.id, dailyAllowance)}
                        >
                          Salvar
                        </Button>
                      </div>
                    )}
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