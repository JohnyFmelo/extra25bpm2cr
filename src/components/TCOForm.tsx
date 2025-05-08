import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GuarnicaoTab from "@/components/tco/GuarnicaoTab";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const TCOForm = ({ selectedTco, onClear }: { selectedTco: any; onClear: () => void }) => {
  const [formData, setFormData] = useState({
    relatante: "",
    rgRelatante: "",
    enderecoRelatante: "",
    telefoneRelatante: "",
    emailRelatante: "",
    local: "",
    dataFato: null,
    horaFato: "",
    natureza: "",
    outrosEnvolvidos: "",
    historico: "",
    providencias: "",
    apreensaoDescrição: "",
    tcoNumber: "",
    createdBy: JSON.parse(localStorage.getItem("user") || "{}").id,
    createdAt: new Date(),
    updatedAt: new Date(),
    autores: [],
    vitimas: [],
    testemunhas: [],
    apreensoes: [],
    drogaTipo: "",
    drogaNomeComum: "",
    drogaQuantidade: "",
    encaminhamentos: "",
    observacoes: "",
    status: "Em Aberto",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTco) {
      // Convertendo os dados do Firebase para o formato esperado pelo formulário
      const formattedTco = {
        ...selectedTco,
        dataFato: selectedTco.dataFato ? new Date(selectedTco.dataFato.seconds * 1000) : null,
        createdAt: selectedTco.createdAt ? new Date(selectedTco.createdAt.seconds * 1000) : new Date(),
        updatedAt: selectedTco.updatedAt ? new Date(selectedTco.updatedAt.seconds * 1000) : new Date(),
      };
      setFormData(formattedTco);
    } else {
      // Se não houver TCO selecionado, define o usuário logado como o criador
      const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
      setFormData(prev => ({
        ...prev,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }
  }, [selectedTco]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGuarnicaoChange = (guarnicao: any[]) => {
    setFormData({ ...formData, guarnicao });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validações básicas
    if (!formData.relatante || !formData.local || !formData.dataFato || !formData.horaFato) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const formattedData = {
        ...formData,
        dataFato: formData.dataFato ? new Date(formData.dataFato) : null,
        updatedAt: new Date(),
      };

      if (selectedTco) {
        // Atualizar TCO existente
        const tcoRef = doc(db, "tcos", selectedTco.id);
        await updateDoc(tcoRef, formattedData);
        toast({
          title: "TCO Atualizado",
          description: "O TCO foi atualizado com sucesso.",
        });
      } else {
        // Criar novo TCO
        const tcoCollection = collection(db, "tcos");
        const docRef = await addDoc(tcoCollection, formattedData);

        // Atualizar o número do TCO com o ID gerado
        const tcoNumber = `TCO-${docRef.id.substring(0, 6).toUpperCase()}`;
        await updateDoc(docRef, { tcoNumber, id: docRef.id });

        toast({
          title: "TCO Criado",
          description: "O TCO foi criado com sucesso.",
        });
        navigate(0);
      }
      onClear();
    } catch (error) {
      console.error("Erro ao salvar TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o TCO. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <Label htmlFor="relatante">Relatante</Label>
        <Input
          type="text"
          id="relatante"
          name="relatante"
          value={formData.relatante || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="rgRelatante">RG do Relatante</Label>
        <Input
          type="text"
          id="rgRelatante"
          name="rgRelatante"
          value={formData.rgRelatante || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="enderecoRelatante">Endereço do Relatante</Label>
        <Input
          type="text"
          id="enderecoRelatante"
          name="enderecoRelatante"
          value={formData.enderecoRelatante || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="telefoneRelatante">Telefone do Relatante</Label>
        <Input
          type="text"
          id="telefoneRelatante"
          name="telefoneRelatante"
          value={formData.telefoneRelatante || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="emailRelatante">Email do Relatante</Label>
        <Input
          type="email"
          id="emailRelatante"
          name="emailRelatante"
          value={formData.emailRelatante || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="local">Local</Label>
        <Input
          type="text"
          id="local"
          name="local"
          value={formData.local || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label>Data e Hora do Fato</Label>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={
                  "pl-3 text-left font-normal" +
                  (date ? " text-foreground" : " text-muted-foreground")
                }
              >
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={date}
                onSelect={setDate}
                defaultMonth={date}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            id="horaFato"
            name="horaFato"
            value={formData.horaFato || ""}
            onChange={handleChange}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="natureza">Natureza</Label>
        <Select onValueChange={(value) => setFormData({ ...formData, natureza: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a natureza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ameaça">Ameaça</SelectItem>
            <SelectItem value="Lesão Corporal">Lesão Corporal</SelectItem>
            <SelectItem value="Vias de Fato">Vias de Fato</SelectItem>
            <SelectItem value="Injúria">Injúria</SelectItem>
            <SelectItem value="Dano">Dano</SelectItem>
            <SelectItem value="Furto">Furto</SelectItem>
            <SelectItem value="Roubo">Roubo</SelectItem>
            <SelectItem value="Estelionato">Estelionato</SelectItem>
            <SelectItem value="Apropriação Indébita">Apropriação Indébita</SelectItem>
            <SelectItem value="Receptação">Receptação</SelectItem>
            <SelectItem value="Porte de drogas para consumo">Porte de drogas para consumo</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="outrosEnvolvidos">Outros Envolvidos</Label>
        <Input
          type="text"
          id="outrosEnvolvidos"
          name="outrosEnvolvidos"
          value={formData.outrosEnvolvidos || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="historico">Histórico</Label>
        <Textarea
          id="historico"
          name="historico"
          value={formData.historico || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="providencias">Providências</Label>
        <Textarea
          id="providencias"
          name="providencias"
          value={formData.providencias || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="apreensaoDescrição">Apreensão (Descrição)</Label>
        <Textarea
          id="apreensaoDescrição"
          name="apreensaoDescrição"
          value={formData.apreensaoDescrição || ""}
          onChange={handleChange}
        />
      </div>
      <GuarnicaoTab onChange={handleGuarnicaoChange} />
      <div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClear}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default TCOForm;
