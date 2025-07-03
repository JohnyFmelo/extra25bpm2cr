import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, onSnapshot, query, getDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";
import { uploadPDF, deletePDF } from "@/lib/supabaseStorage";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { v4 as uuidv4 } from 'uuid';
import { MoreHorizontal, Edit, Trash2, Archive, Plus, Lock, LockOpen, Info, X, MapPin, UserPlus, Handshake, Calculator, Car, CheckCircle2, Route, Loader2, UploadCloud, FileText, FileImage, Download, DollarSign, FileUp, AlertTriangle } from "lucide-react";
import { Switch } from "./ui/switch";
import AddVolunteerDialog from "./AddVolunteerDialog";

// Interface for uploaded documents
interface TravelDocument {
  id: string;
  name: string;
  category?: string;
  originalFileName?: string;
  url: string;
  path: string;
  size: number;
  type: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
}

// Updated Travel interface
interface Travel {
  id: string;
  startDate: string;
  endDate: string;
  slots: number;
  destination: string;
  agency?: string;
  dailyAllowance?: number | null;
  dailyRate?: number | null;
  halfLastDay: boolean;
  volunteers: string[];
  selectedVolunteers?: string[];
  archived: boolean;
  isLocked?: boolean;
  documents?: TravelDocument[];
}

// Constants
const REQUIRED_DOCS = ["KM Inicial", "Abastecimento", "KM Final", "Termo de Cautela"];
const AGENCIES = ["Sinfra", "Gefron", "Sema", "Rural"];
const DOCUMENT_CATEGORIES = ["KM Inicial", "Abastecimento", "KM Final", "Termo de Cautela", "Outros Gastos", "Outros"];

// Helper Functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Add Document Dialog Component
const AddDocumentDialog = ({
  open,
  onOpenChange,
  travel,
  onUploadSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travel: Travel | null;
  onUploadSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserInfo = `${user.rank} ${user.warName}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!open) {
      setFile(null);
      setCategory("");
      setName("");
      setIsUploading(false);
      setProgress(0);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O tamanho máximo do arquivo é 10MB.", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !category || !name.trim() || !travel) {
      toast({ title: "Campos obrigatórios", description: "Por favor, preencha todos os campos e selecione um arquivo.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setProgress(0);
    
    try {
      const uniqueFileName = `${uuidv4()}-${file.name}`;
      const storagePath = `travels/${travel.id}/${user.id}/${uniqueFileName}`;
      
      const progressInterval = setInterval(() => setProgress(prev => Math.min(prev + 10, 90)), 200);
      const { url, error } = await uploadPDF(storagePath, file);
      clearInterval(progressInterval);
      setProgress(100);
      
      if (error || !url) throw new Error(error?.message || "Erro no upload");
      
      const newDocument: TravelDocument = {
        id: uuidv4(),
        name: name.trim(),
        category: category,
        originalFileName: file.name,
        url,
        path: storagePath,
        size: file.size,
        type: file.type,
        uploaderId: user.id,
        uploaderName: currentUserInfo,
        createdAt: new Date().toISOString()
      };
      
      const travelRef = doc(db, "travels", travel.id);
      await updateDoc(travelRef, { documents: arrayUnion(newDocument) });
      
      toast({ title: "Sucesso", description: "Documento enviado!" });
      setIsUploading(false);
      onUploadSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Erro de Upload", description: "Não foi possível enviar o arquivo.", variant: "destructive" });
      setIsUploading(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                  <DialogTitle>Adicionar Documento de Viagem</DialogTitle>
                  <DialogDescription className="text-gray-600">
                      Envie um arquivo para a prestação de contas da viagem para {travel?.destination}.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div>
                      <Label htmlFor="category">Categoria do Documento</Label>
                      <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger id="category" className="w-full mt-1"><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
                          <SelectContent>{DOCUMENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                   <div>
                      <Label htmlFor="doc-name">Nome / Descrição do Documento</Label>
                      <Input id="doc-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nota fiscal do abastecimento" className="mt-1" />
                  </div>
                  <div>
                      <Label>Arquivo</Label>
                      <div className="mt-1">
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" />
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                              <FileUp className="mr-2 h-4 w-4" />
                              {file ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
                          </Button>
                      </div>
                      {file && <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-md border">{file.name} ({formatFileSize(file.size)})</div>}
                  </div>
                  {isUploading && <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>}
              </form>
              <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancelar</Button>
                  <Button type="submit" onClick={handleSubmit} disabled={isUploading || !file || !category || !name.trim()}>
                      {isUploading ? `Enviando... ${Math.round(progress)}%` : "Enviar Documento"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
};

export const TravelManagement = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [slots, setSlots] = useState("");
  const [destination, setDestination] = useState("");
  const [agency, setAgency] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [halfLastDay, setHalfLastDay] = useState(false);
  const [travels, setTravels] = useState<Travel[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<{ [key: string]: number }>({});
  const [diaryCounts, setDiaryCounts] = useState<{ [key: string]: number }>({});
  const [editingTravel, setEditingTravel] = useState<Travel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addVolunteerDialogOpen, setAddVolunteerDialogOpen] = useState(false);
  const [selectedTravelId, setSelectedTravelId] = useState<string>("");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedTravelForDocument, setSelectedTravelForDocument] = useState<Travel | null>(null);
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.userType === "admin";
  const currentUserInfo = `${user.rank} ${user.warName}`;

  useEffect(() => {
    const q = query(collection(db, "travels"));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const travelsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Travel[];
      setTravels(travelsData);
      
      const counts: { [key: string]: number } = {};
      const diaryCount: { [key: string]: number } = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      travelsData.forEach(travel => {
        const travelStart = new Date(travel.startDate + "T00:00:00");
        const travelEnd = new Date(travel.endDate + "T00:00:00");
        if (today < travelStart && travel.isLocked || today >= travelStart && today <= travelEnd || today > travelEnd) {
          const finalList = travel.isLocked && travel.selectedVolunteers?.length > 0 ? travel.selectedVolunteers : travel.volunteers || [];
          finalList.forEach((volunteer: string) => {
            counts[volunteer] = (counts[volunteer] || 0) + 1;
            if (travelEnd >= travelStart) {
              const days = differenceInDays(travelEnd, travelStart) + 1;
              const diaryDays = travel.halfLastDay ? days - 0.5 : days;
              diaryCount[volunteer] = (diaryCount[volunteer] || 0) + diaryDays;
            } else {
              diaryCount[volunteer] = diaryCount[volunteer] || 0;
            }
          });
        }
      });
      setVolunteerCounts(counts);
      setDiaryCounts(diaryCount);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) {
      toast({ title: "Datas inválidas", description: "A data final não pode ser anterior à data inicial.", variant: "destructive" });
      return;
    }
    const travelData = {
      startDate,
      endDate,
      slots: Number(slots),
      destination,
      agency,
      dailyRate: dailyRate ? Number(dailyRate) : null,
      halfLastDay,
    };
    try {
      if (editingTravel) {
        await updateDoc(doc(db, "travels", editingTravel.id), { ...travelData, updatedAt: new Date() });
        toast({ title: "Sucesso", description: "Viagem atualizada com sucesso!" });
      } else {
        await addDoc(collection(db, "travels"), {
          ...travelData,
          createdAt: new Date(),
          volunteers: [],
          selectedVolunteers: [],
          archived: false,
          isLocked: false,
          documents: []
        });
        toast({ title: "Sucesso", description: "Viagem criada com sucesso!" });
      }
      setIsModalOpen(false);
      resetFormState();
    } catch (error) {
      console.error("Error creating/updating travel:", error);
      toast({ title: "Erro", description: "Erro ao salvar viagem.", variant: "destructive" });
    }
  };

  const resetFormState = () => {
    setStartDate(""); setEndDate(""); setSlots(""); setDestination(""); setAgency("");
    setDailyRate(""); setHalfLastDay(false); setEditingTravel(null);
  };

  const handleEditTravel = (travel: Travel) => {
    setEditingTravel(travel);
    setStartDate(travel.startDate); setEndDate(travel.endDate); setSlots(String(travel.slots));
    setDestination(travel.destination); setAgency(travel.agency || "");
    setDailyRate(String(travel.dailyRate || "")); setHalfLastDay(travel.halfLastDay || false);
    setIsModalOpen(true);
  };

  const handleDeleteTravel = async (travelId: string) => {
    const travel = travels.find(t => t.id === travelId);
    if (!travel) return;
    if (window.confirm(`Tem certeza que deseja excluir a viagem para "${travel.destination}" e TODOS os seus documentos permanentemente?`)) {
      try {
        if (travel.documents && travel.documents.length > 0) {
          await Promise.all(travel.documents.map(doc => deletePDF(doc.path)));
        }
        await deleteDoc(doc(db, "travels", travelId));
        toast({ title: "Sucesso", description: "Viagem e documentos excluídos." });
      } catch (error) {
        console.error("Error deleting travel:", error);
        toast({ title: "Erro", description: "Erro ao excluir viagem.", variant: "destructive" });
      }
    }
  };

  const handleArchive = async (travelId: string, newArchivedState: boolean) => {
    try {
      await updateDoc(doc(db, "travels", travelId), { archived: newArchivedState });
      toast({ title: "Sucesso", description: newArchivedState ? "Prestação de contas encerrada!" : "Status da viagem redefinido." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao alterar o status da viagem.", variant: "destructive" });
    }
  };
  
  const handleVolunteer = async (travelId: string) => {
    if (!currentUserInfo || !user.rank) {
      toast({ title: "Erro", description: "Usuário não encontrado. Faça login.", variant: "destructive" });
      return;
    }
    const travelRef = doc(db, "travels", travelId);
    try {
      const travelSnap = await getDoc(travelRef);
      const travelData = travelSnap.data() as Travel;
      if (travelData.isLocked) {
        toast({ title: "Ação não permitida", description: "Inscrições encerradas.", variant: "destructive" });
        return;
      }
      const currentVolunteers = travelData.volunteers || [];
      if (currentVolunteers.includes(currentUserInfo)) {
        await updateDoc(travelRef, { volunteers: arrayRemove(currentUserInfo) });
        toast({ title: "Sucesso", description: "Você desistiu da viagem." });
      } else {
        await updateDoc(travelRef, { volunteers: arrayUnion(currentUserInfo) });
        toast({ title: "Sucesso", description: "Você se candidatou com sucesso!" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao se candidatar.", variant: "destructive" });
    }
  };

  const handleToggleSelectedVolunteer = async (travelId: string, volunteerName: string) => {
    if (!isAdmin) return;
    try {
      const travelRef = doc(db, "travels", travelId);
      const travelSnap = await getDoc(travelRef);
      if (!travelSnap.exists()) return;
      const travelData = travelSnap.data() as Travel;
      const currentSelected = travelData.selectedVolunteers || [];
      if (currentSelected.includes(volunteerName)) {
        await updateDoc(travelRef, { selectedVolunteers: arrayRemove(volunteerName) });
        toast({ title: "Voluntário desmarcado" });
      } else {
        await updateDoc(travelRef, { selectedVolunteers: arrayUnion(volunteerName) });
        toast({ title: "Voluntário selecionado manualmente" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao alterar seleção do voluntário.", variant: "destructive" });
    }
  };

  const handleRemoveVolunteer = async (travelId: string, volunteerName: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`Tem certeza que deseja remover ${volunteerName} desta viagem?`)) return;
    try {
      const travelRef = doc(db, "travels", travelId);
      await updateDoc(travelRef, {
        volunteers: arrayRemove(volunteerName),
        selectedVolunteers: arrayRemove(volunteerName)
      });
      toast({ title: "Voluntário removido", description: `${volunteerName} foi removido da viagem.` });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao remover voluntário.", variant: "destructive" });
    }
  };

  const handleToggleLock = async (travelId: string) => {
    const travelRef = doc(db, "travels", travelId);
    const travelSnap = await getDoc(travelRef);
    if (!travelSnap.exists()) return;
    const travelData = travelSnap.data() as Travel;
    try {
      if (!travelData.isLocked) {
        const manualSelections = travelData.selectedVolunteers || [];
        const availableSlots = Math.max(0, (travelData.slots || 0) - manualSelections.length);
        const autoSelectCandidates = (travelData.volunteers || []).filter(v => !manualSelections.includes(v));
        const processed = autoSelectCandidates.map(v => ({
            fullName: v,
            diaryCount: diaryCounts[v] || 0,
            rankWeight: getMilitaryRankWeight(getVolunteerRank(v)),
            originalIndex: (travelData.volunteers || []).indexOf(v)
        })).sort((a, b) => a.diaryCount - b.diaryCount || b.rankWeight - a.rankWeight || a.originalIndex - b.originalIndex);
        const autoSelectedVolunteers = processed.slice(0, availableSlots).map(v => v.fullName);
        const finalSelectedVolunteers = [...manualSelections, ...autoSelectedVolunteers];
        
        await updateDoc(travelRef, { isLocked: true, selectedVolunteers: finalSelectedVolunteers });
        toast({ title: "Sucesso", description: "Viagem processada e voluntários selecionados!" });
      } else {
        await updateDoc(travelRef, { isLocked: false, selectedVolunteers: [] });
        toast({ title: "Sucesso", description: "Viagem reaberta para inscrições!" });
      }
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast({ title: "Erro", description: "Erro ao alterar o status da viagem.", variant: "destructive" });
    }
  };
  
  const handleFileDelete = async (travel: Travel, documentToDelete: TravelDocument) => {
    if (!window.confirm(`Tem certeza que deseja excluir o arquivo "${documentToDelete.name}"?`)) return;
    try {
      const { success, error } = await deletePDF(documentToDelete.path);
      if (!success) throw new Error(error?.message || "Erro ao excluir arquivo");
      await updateDoc(doc(db, "travels", travel.id), { documents: arrayRemove(documentToDelete) });
      toast({ title: "Sucesso", description: "Arquivo excluído." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o arquivo.", variant: "destructive" });
    }
  };

  const cbSdRanks = ["Sd", "Sd PM", "Cb", "Cb PM"];
  const stSgtRanks = ["3° Sgt", "3° Sgt PM", "2° Sgt", "2° Sgt PM", "1° Sgt", "1° Sgt PM", "Sub Ten", "Sub Ten PM"];
  const oficiaisRanks = ["2° Ten", "2° Ten PM", "1° Ten", "1° Ten PM", "Cap", "Cap PM", "Maj", "Maj PM", "Ten Cel", "Ten Cel PM", "Cel", "Cel PM"];
  const getVolunteerRank = (volunteerFullName: string): string => {
    if (!volunteerFullName || typeof volunteerFullName !== 'string') return "N/A";
    const parts = volunteerFullName.split(" ");
    if (parts.length >= 3 && (parts[1] === "Sgt" || parts[1] === "Ten") && parts[2] === "PM") return `${parts[0]} ${parts[1]} ${parts[2]}`;
    if (parts.length >= 2 && (parts[1] === "Sgt" || parts[1] === "Ten" || parts[0] === "Sub" || parts[0] === "Ten")) {
      const twoPartRank = `${parts[0]} ${parts[1]}`;
      if ([...stSgtRanks, ...oficiaisRanks].includes(twoPartRank)) return twoPartRank;
    }
    return parts[0];
  };
  const getMilitaryRankWeight = (rank: string): number => {
    if (cbSdRanks.includes(rank)) return 1;
    if (stSgtRanks.includes(rank)) return 2;
    if (oficiaisRanks.includes(rank)) return 3;
    return 0;
  };
  const formattedDiaryCount = (count: number) => {
    const fmtCount = count.toLocaleString("pt-BR", { minimumFractionDigits: count % 1 !== 0 ? 1 : 0, maximumFractionDigits: 1 });
    return `${fmtCount} ${count === 1 ? 'diária' : 'diárias'}`;
  };

  const getSortedVolunteers = (travel: Travel) => {
    const allRegisteredVolunteers = travel.volunteers || [];
    let displayList = allRegisteredVolunteers.map((volunteerName, index) => ({
      fullName: volunteerName,
      diaryCount: diaryCounts[volunteerName] || 0,
      rankWeight: getMilitaryRankWeight(getVolunteerRank(volunteerName)),
      originalIndex: index,
      isSelected: (travel.selectedVolunteers || []).includes(volunteerName)
    }));

    if (travel.isLocked) {
      return displayList
        .filter(v => (travel.selectedVolunteers || []).includes(v.fullName))
        .sort((a, b) => (travel.selectedVolunteers || []).indexOf(a.fullName) - (travel.selectedVolunteers || []).indexOf(b.fullName));
    } else {
      displayList.sort((a, b) => {
        if (a.isSelected && !b.isSelected) return -1;
        if (!a.isSelected && b.isSelected) return 1;
        if (a.diaryCount !== b.diaryCount) return a.diaryCount - b.diaryCount;
        if (a.rankWeight !== b.rankWeight) return b.rankWeight - a.rankWeight;
        return a.originalIndex - b.originalIndex;
      });

      let selectedCount = 0;
      return displayList.map(volunteer => {
        let finalIsSelected = volunteer.isSelected; 
        if (selectedCount < travel.slots && !finalIsSelected) {
          finalIsSelected = true;
        }
        if(finalIsSelected) {
            selectedCount++;
        }
        return { ...volunteer, isSelected: finalIsSelected };
      });
    }
  };
  
  const getCategoryChipColor = (category?: string) => {
    switch (category) {
      case "KM Inicial": return "bg-blue-100 text-blue-800";
      case "KM Final": return "bg-blue-100 text-blue-800";
      case "Abastecimento": return "bg-amber-100 text-amber-800";
      case "Termo de Cautela": return "bg-red-100 text-red-800";
      case "Outros Gastos": return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return <>
      <div className="max-w-7xl p-4 mx-0 px-[5px]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {travels.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .map(travel => {
            const travelEnd = new Date(travel.endDate + "T00:00:00");
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isLocked = travel.isLocked ?? false;
            const isArchived = travel.archived ?? false;
            const isPast = today > travelEnd;
            const isOpen = !isLocked && !isPast && !isArchived;
            const isOngoing = isLocked && today >= new Date(travel.startDate + "T00:00:00") && today <= travelEnd && !isArchived;
            const isProcessing = isLocked && !isPast && !isOngoing && !isArchived; 
            const isAwaitingAccountability = isPast && !isArchived;
            const isConcluded = isArchived;
            const requiresAccountability = travel.agency !== "Gefron";

            const isUserVolunteered = travel.volunteers?.includes(currentUserInfo);
            const isUserSelected = (travel.selectedVolunteers || []).includes(currentUserInfo);

            let statusConfig;
            if (isConcluded) { 
              statusConfig = { title: requiresAccountability ? 'Missão Concluída' : 'Viagem Encerrada', icon: <CheckCircle2 size={16} />, headerClass: 'bg-gray-500', h2Icon: <CheckCircle2 className="h-5 w-5" /> };
            } else if (isOpen) {
              statusConfig = { title: 'Em aberto', icon: <div className="w-2 h-2 bg-white rounded-full animate-pulse" />, headerClass: 'bg-emerald-500', ctaClass: 'bg-emerald-500 hover:bg-emerald-600', h2Icon: <Handshake className="h-5 w-5" /> };
            } else if (isOngoing) {
              statusConfig = { title: 'Em trânsito', icon: <Route size={14}/>, headerClass: 'bg-blue-500', h2Icon: <Car className="h-5 w-5" /> };
            } else if (isProcessing) {
              statusConfig = { title: 'Processando diária', icon: <Loader2 size={14} className="animate-spin" />, headerClass: 'bg-orange-500', h2Icon: <Calculator className="h-5 w-5" /> };
            } else if (isAwaitingAccountability) { 
              statusConfig = { title: requiresAccountability ? 'Aguardando P. de Contas' : 'Viagem Encerrada', icon: <Info size={16} />, headerClass: 'bg-red-600', h2Icon: <Info className="h-5 w-5" /> };
            } else {
              statusConfig = { title: 'Status Desconhecido', icon: <CheckCircle2 size={16} />, headerClass: 'bg-gray-500', h2Icon: <CheckCircle2 className="h-5 w-5" /> };
            }
          
            const missingDocs = requiresAccountability ? REQUIRED_DOCS.filter(reqDoc => !(travel.documents?.map(d => d.category).includes(reqDoc))) : [];
            const displayVolunteersList = getSortedVolunteers(travel);
            const dailyCount = differenceInDays(travelEnd, new Date(travel.startDate + "T00:00:00")) + (travel.halfLastDay ? 0.5 : 1);
            const totalCost = travel.dailyRate && dailyCount > 0 ? dailyCount * Number(travel.dailyRate) : 0;
            
            return (
              <div key={travel.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className={`text-white p-4 ${statusConfig.headerClass}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">{statusConfig.icon} {statusConfig.title}</div>
                    </div>
                    {isAdmin && <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-7 w-7 p-0 hover:bg-black/20 rounded-full text-white"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isLocked && !isPast && <DropdownMenuItem onClick={() => handleEditTravel(travel)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
                        {isOpen && <DropdownMenuItem onClick={() => handleToggleLock(travel.id)}><Lock className="mr-2 h-4 w-4" />Processar</DropdownMenuItem>}
                        {(isProcessing || isOngoing) && <DropdownMenuItem onClick={() => handleToggleLock(travel.id)}><LockOpen className="mr-2 h-4 w-4" />Reabrir</DropdownMenuItem>}
                        {isAwaitingAccountability && requiresAccountability && <DropdownMenuItem onClick={() => handleArchive(travel.id, true)}><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />Encerrar P. de Contas</DropdownMenuItem>}
                        {isConcluded && requiresAccountability && <DropdownMenuItem onClick={() => handleArchive(travel.id, false)}><Archive className="mr-2 h-4 w-4" />Reabrir P. de Contas</DropdownMenuItem>}
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTravel(travel.id)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>}
                  </div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                     {statusConfig.h2Icon} 
                     {travel.agency && <span className="font-normal text-white/80 uppercase text-base">{travel.agency} /</span>}
                     {travel.destination}
                  </h2>
                </div>
                <div className="main-content p-5">
                  <div className="info-section mb-5 grid grid-cols-2 gap-3">
                      <div className="info-item bg-slate-50 p-3 rounded-lg border-l-4 border-blue-400"><div className="text-xs font-medium text-slate-500 uppercase">Período</div><div className="text-sm font-semibold text-slate-800">{new Date(travel.startDate + 'T00:00').toLocaleDateString()} - {new Date(travel.endDate + 'T00:00').toLocaleDateString()}</div></div>
                      <div className="info-item bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-400"><div className="text-xs font-medium text-slate-500 uppercase">{isOpen ? "Vagas" : "Selecionados"}</div><div className="text-sm font-semibold text-slate-800">{isLocked || isConcluded ? `${(travel.selectedVolunteers || []).length}` : `${travel.slots} para seleção`}</div></div>
                      <div className="info-item bg-slate-50 p-3 rounded-lg border-l-4 border-amber-400"><div className="text-xs font-medium text-slate-500 uppercase">Duração</div><div className="text-sm font-semibold text-slate-800">{formattedDiaryCount(dailyCount)}</div></div>
                      <div className="info-item bg-slate-50 p-3 rounded-lg border-l-4 border-purple-400"><div className="text-xs font-medium text-slate-500 uppercase">Remuneração</div><div className="text-sm font-semibold text-slate-800">{totalCost > 0 ? totalCost.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' }) : 'N/A'}</div></div>
                  </div>
                  <div className="volunteers-section mb-5">
                       <div className="flex justify-between items-center mb-3 pb-2 border-b"><h3 className="text-sm font-semibold text-slate-800">{isOpen ? `Voluntários (${travel.volunteers?.length || 0} inscritos)` : 'Voluntário(s) em Missão'}</h3>{isAdmin && isOpen && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedTravelId(travel.id); setAddVolunteerDialogOpen(true); }}><UserPlus className="h-3.5 w-3.5 mr-1.5" />Adicionar</Button>}</div>
                      <div className="volunteer-grid grid gap-2">
                          {displayVolunteersList.length > 0 ? displayVolunteersList.map((vol, index) => <div 
                              key={`${vol.fullName}-${index}`} 
                              className={`volunteer-item border rounded-lg p-3 transition-all ${!isLocked && !isConcluded ? 'cursor-pointer' : ''} ${isLocked || isConcluded ? 'border-emerald-400 bg-emerald-50' : vol.isSelected ? 'border-blue-400 bg-blue-50' : 'bg-white'}`}
                              onDoubleClick={() => isAdmin && isOpen && handleToggleSelectedVolunteer(travel.id, vol.fullName)}
                          >
                                  <div className="flex justify-between items-start">
                                      <div className="flex flex-col flex-1 overflow-hidden">
                                           <p className={`text-sm font-semibold truncate ${isLocked || isConcluded ? 'text-emerald-800' : vol.isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{vol.fullName}</p>
                                           <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                               <span className="flex items-center gap-1.5"><MapPin size={12} /> {volunteerCounts[vol.fullName] || 0} viagens</span>
                                               <span className="flex items-center gap-1.5"><DollarSign size={12} /> {formattedDiaryCount(diaryCounts[vol.fullName] || 0)}</span>
                                           </div>
                                      </div>
                                      <div className="flex items-center gap-2 pl-2">
                                          {(isLocked || isConcluded) && (travel.selectedVolunteers || []).includes(vol.fullName) && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                                          {isAdmin && isOpen && <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleRemoveVolunteer(travel.id, vol.fullName); }}><X className="h-4 w-4 text-red-500" /></Button>}
                                      </div>
                                  </div>
                              </div>) : <p className="text-xs text-slate-500 italic">Nenhum voluntário {isOpen ? 'inscrito' : 'selecionado'}.</p>}
                      </div>
                  </div>
                  {(isOngoing || isAwaitingAccountability || isConcluded) && (isUserSelected || isAdmin) && requiresAccountability && <div className="documents-section mb-5">
                          <div className="section-header flex justify-between items-center mb-3 pb-2 border-b">
                              <h3 className="section-title text-sm font-semibold text-slate-800">Prestação de Contas</h3>
                              {!isConcluded && <Button size="sm" onClick={() => { setSelectedTravelForDocument(travel); setIsDocumentModalOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Adicionar Documento</Button>}
                          </div>
                          {(isOngoing || isAwaitingAccountability) && missingDocs.length > 0 && <div className="p-3 my-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg">
                                  <p className="font-semibold flex items-center gap-2 text-sm"><AlertTriangle size={16} /> Documentos Obrigatórios Pendentes:</p>
                                  <ul className="list-disc list-inside mt-1 pl-2 text-xs">{missingDocs.map(doc => <li key={doc}>{doc}</li>)}</ul>
                              </div>}
                          <div className="document-list mt-3 space-y-2">
                              {travel.documents && travel.documents.length > 0 ? travel.documents.map(doc => <div key={doc.id} className="document-item flex items-center justify-between p-2.5 bg-white border rounded-lg">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          {doc.type.includes('pdf') ? <FileText className="text-red-500 flex-shrink-0" /> : <FileImage className="text-sky-500 flex-shrink-0" />}
                                          <div className="overflow-hidden">
                                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="document-name text-sm font-medium text-slate-800 hover:underline truncate block" title={doc.name}>{doc.name}</a>
                                              <div className="document-meta flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                {doc.category && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryChipColor(doc.category)}`}>{doc.category}</span>}
                                                <span>{formatFileSize(doc.size)}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2 pl-2">
                                          <a href={doc.url} download={doc.originalFileName || doc.name} target="_blank" rel="noopener noreferrer" title="Baixar"><Download size={16} className="text-slate-500 hover:text-blue-600 cursor-pointer" /></a>
                                          {(doc.uploaderId === user.id || isAdmin) && !isConcluded && <button onClick={() => handleFileDelete(travel, doc)} title="Excluir"><X size={16} className="text-slate-500 hover:text-red-600 cursor-pointer" /></button>}
                                      </div>
                                  </div>) : <p className="text-xs text-slate-500 italic">Nenhum documento enviado.</p>}
                          </div>
                      </div>}
                  {isOpen && <div className="cta-section pt-4 border-t">
                          <Button onClick={() => handleVolunteer(travel.id)} className={`w-full font-bold text-base py-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 ${isUserVolunteered ? 'bg-red-500 hover:bg-red-600' : statusConfig.ctaClass}`}>
                              {isUserVolunteered ? "Desistir da Viagem" : "Quero ser Voluntário"}
                          </Button>
                      </div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {isAdmin && <Button onClick={() => { setIsModalOpen(true); resetFormState(); }} className="fixed bottom-24 right-6 h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl transition-all z-30"><Plus className="h-8 w-8" /></Button>}
      {isModalOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="p-6 bg-white shadow-2xl max-w-lg w-full relative rounded-lg">
            <button onClick={() => { setIsModalOpen(false); resetFormState(); }} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100" title="Fechar"><X className="h-5 w-5" /></button>
            <form onSubmit={handleCreateTravel} className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-800">{editingTravel ? "Editar Viagem" : "Criar Nova Viagem"}</h2>
              <div className="space-y-4">
                <div><Label htmlFor="destination" className="text-sm font-medium text-gray-700">Destino</Label><Input id="destination" type="text" value={destination} onChange={e => setDestination(e.target.value)} required placeholder="Ex: Operação Fronteira Segura" className="w-full mt-1" /></div>
                <div>
                  <Label htmlFor="agency" className="text-sm font-medium text-gray-700">Órgão</Label>
                  <Select value={agency} onValueChange={setAgency}><SelectTrigger id="agency" className="w-full mt-1"><SelectValue placeholder="Selecione um órgão..." /></SelectTrigger><SelectContent>{AGENCIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="startDate" className="text-sm font-medium text-gray-700">Data Inicial</Label><Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full mt-1" /></div>
                  <div><Label htmlFor="endDate" className="text-sm font-medium text-gray-700">Data Final</Label><Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full mt-1" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="slots" className="text-sm font-medium text-gray-700">Vagas (para seleção)</Label><Input id="slots" type="number" value={slots} onChange={e => setSlots(e.target.value)} required min="1" placeholder="Ex: 3" className="w-full mt-1" /></div>
                  <div><Label htmlFor="dailyRate" className="text-sm font-medium text-gray-700">Valor da Diária (R$)</Label><Input id="dailyRate" type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="Opcional (Ex: 310.75)" step="0.01" min="0" className="w-full mt-1" /></div>
                </div>
                <div className="flex items-center pt-2"><Switch id="halfLastDay" checked={halfLastDay} onCheckedChange={setHalfLastDay} /><Label htmlFor="halfLastDay" className="ml-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none">Considerar meia diária no último dia</Label></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="w-full sm:w-auto flex-grow bg-blue-600 hover:bg-blue-700">{editingTravel ? "Salvar Alterações" : "Criar Viagem"}</Button>
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetFormState(); }} className="w-full sm:w-auto">Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>}
      <AddDocumentDialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen} travel={selectedTravelForDocument} onUploadSuccess={() => {}} />
      <AddVolunteerDialog open={addVolunteerDialogOpen} onOpenChange={setAddVolunteerDialogOpen} travelId={selectedTravelId} currentVolunteers={travels.find(t => t.id === selectedTravelId)?.volunteers || []} onVolunteersAdded={() => toast({ title: "Sucesso", description: "Voluntários adicionados com sucesso!" })} />
    </>;
};
export default TravelManagement;
