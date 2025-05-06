import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

// Helper function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Define Naturezas and Penalties
const naturezasEOpcoes: { [key: string]: string } = {
  'Ameaça': 'Pena - detenção, de um a seis meses, ou multa.',
  'Vias de fato': 'Pena - prisão simples, de quinze dias a três meses, ou multa.',
  'Lesão corporal leve': 'Pena - detenção, de três meses a um ano.',
  'Perturbação do trabalho ou do sossego alheios': 'Pena - prisão simples, de quinze dias a três meses, ou multa.',
  'Dano simples': 'Pena - detenção, de um a seis meses, ou multa.',
  'Desacato': 'Pena - detenção, de seis meses a dois anos, ou multa.',
  'Posse de droga para consumo pessoal': 'Pena - advertência sobre os efeitos das drogas, prestação de serviços à comunidade, medida educativa de comparecimento a programa ou curso educativo.',
  // Adicione outras naturezas comuns de TCO aqui
  'Outros': '', // No predefined penalty
};

const TCOForm = () => {
  const { toast } = useToast();

  const getInitialFormData = () => {
    const now = new Date();
    return {
      tcoNumber: "",
      natureza: "",
      outraNatureza: "",
      dataFato: getCurrentDate(),
      horaFato: "",
      dataInicioRegistro: getCurrentDate(),
      horaInicioRegistro: getCurrentTime(),
      // dataFimRegistro: "", // Hidden/Internal - manage on submit if needed
      // horaFimRegistro: "", // Hidden/Internal - manage on submit if needed
      location: "",
      defendant: "",
      description: "",
      witnesses: "",
      officer: "",
      // Drug related fields
      drugQuantity: "",
      drugType: "", // 'Vegetal' | 'Mineral' | ''
      drugColor: "", // 'Verde' | 'Amarelada' | 'Branco' | ''
      drugDescription: "", // For unknown material
      solicitarPericia: "Sim", // Default to 'Sim'
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [penaPrevista, setPenaPrevista] = useState("");
  const [indiciosDroga, setIndiciosDroga] = useState<string | null>(null);

  // Effect to update penalty when natureza changes
  useEffect(() => {
    setPenaPrevista(naturezasEOpcoes[formData.natureza] || "");
  }, [formData.natureza]);

  // Effect to determine drug indications
  useEffect(() => {
    if (formData.natureza !== 'Posse de droga para consumo pessoal') {
        setIndiciosDroga(null);
        return;
    }

    const { drugType, drugColor } = formData;

    if (drugType === "Vegetal" && drugColor === "Verde") {
      setIndiciosDroga("Maconha");
    } else if (drugType === "Mineral" && drugColor === "Amarelada") {
      setIndiciosDroga("Pasta Base");
    } else if (drugType === "Mineral" && drugColor === "Branco") {
      setIndiciosDroga("Cocaína");
    } else if (drugType && drugColor) {
        // Only set to unknown if both type and color are selected but don't match known combos
        setIndiciosDroga("Material Desconhecido");
    } else {
        setIndiciosDroga(null); // Not enough info yet
    }
  }, [formData.natureza, formData.drugType, formData.drugColor]);

  // Generic handler for Input and Textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for Select components
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        // Reset conditional fields if parent changes
        if (name === 'natureza') {
            if (value !== 'Outros') newState.outraNatureza = '';
            if (value !== 'Posse de droga para consumo pessoal') {
                newState.drugQuantity = '';
                newState.drugType = '';
                newState.drugColor = '';
                newState.drugDescription = '';
                // Keep solicitarPericia default? Or reset only if needed? Let's keep it for now.
            }
        }
        if (name === 'drugType' || name === 'drugColor') {
           // Reset description if type/color changes and indication is no longer 'Unknown'
           // The useEffect handles recalculating 'indicios', just need to maybe clear description
            if(indiciosDroga === 'Material Desconhecido') {
                // Check if new state will *not* be unknown
                const nextIndicios = determineIndicios(newState.drugType, newState.drugColor);
                 if (nextIndicios !== 'Material Desconhecido') {
                    newState.drugDescription = '';
                 }
            }
        }
        return newState;
    });
  };

    // Helper specifically for the indicios logic used above
    const determineIndicios = (type?: string, color?: string): string | null => {
        if (type === "Vegetal" && color === "Verde") return "Maconha";
        if (type === "Mineral" && color === "Amarelada") return "Pasta Base";
        if (type === "Mineral" && color === "Branco") return "Cocaína";
        if (type && color) return "Material Desconhecido";
        return null;
    }


  // Handler for RadioGroup
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add data/hora final do registro here if needed
    const finalFormData = {
        ...formData,
        // dataFimRegistro: getCurrentDate(),
        // horaFimRegistro: getCurrentTime(),
        indiciosDroga: indiciosDroga // Include derived indication in submission data
    };

    console.log("TCO Form submitted:", finalFormData);

    toast({
      title: "TCO Registrado",
      description: "O registro foi salvo com sucesso.",
    });

    // Reset form after submission to initial state
    setFormData(getInitialFormData());
    setPenaPrevista("");
    setIndiciosDroga(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">Registro de Termo Circunstanciado de Ocorrência (TCO)</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Informações da Ocorrência */}
        <div className="border p-4 rounded-md space-y-4">
           <h3 className="text-lg font-medium mb-2">Detalhes da Ocorrência</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="tcoNumber">Nº do TCO</Label>
                    <Input
                    id="tcoNumber"
                    name="tcoNumber"
                    value={formData.tcoNumber}
                    onChange={handleChange}
                    placeholder="Número do TCO"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="dataFato">Data do Fato</Label>
                    <Input
                        id="dataFato"
                        name="dataFato"
                        type="date"
                        value={formData.dataFato}
                        onChange={handleChange}
                        required
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="horaFato">Hora do Fato</Label>
                    <Input
                        id="horaFato"
                        name="horaFato"
                        type="time"
                        value={formData.horaFato}
                        onChange={handleChange}
                        required
                    />
                </div>
             </div>
             <div className="space-y-2">
                 <Label htmlFor="location">Local da Ocorrência</Label>
                 <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Endereço completo do local"
                    required
                 />
             </div>

              {/* Informações de Registro (Automáticas/Informativas) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                <div>
                    <p><strong>Início do Registro:</strong></p>
                    <p>Data: {formData.dataInicioRegistro}</p>
                    <p>Hora: {formData.horaInicioRegistro}</p>
                </div>
                 {/* Data/Hora Fim podem ser adicionadas aqui ou gerenciadas internamente */}
             </div>
        </div>


        {/* Natureza da Ocorrência */}
        <div className="border p-4 rounded-md space-y-4">
             <h3 className="text-lg font-medium mb-2">Natureza da Ocorrência</h3>
             <div className="space-y-2">
                <Label htmlFor="natureza">Natureza Principal</Label>
                <Select
                  name="natureza"
                  value={formData.natureza}
                  onValueChange={(value) => handleSelectChange('natureza', value)}
                  required
                >
                  <SelectTrigger id="natureza">
                    <SelectValue placeholder="Selecione a natureza da ocorrência" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(naturezasEOpcoes).map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Mostra campo Outros se Natureza for 'Outros' */}
             {formData.natureza === 'Outros' && (
               <div className="space-y-2">
                 <Label htmlFor="outraNatureza">Descreva a Natureza</Label>
                 <Input
                   id="outraNatureza"
                   name="outraNatureza"
                   value={formData.outraNatureza}
                   onChange={handleChange}
                   placeholder="Descreva a natureza manualmente"
                   required={formData.natureza === 'Outros'} // Required only if 'Outros' is selected
                 />
               </div>
             )}

             {/* Mostra Pena Prevista se houver */}
             {penaPrevista && (
                <div className="p-3 bg-gray-100 rounded border border-gray-200 text-sm">
                    <p><strong>Pena Prevista:</strong> {penaPrevista}</p>
                </div>
             )}
        </div>


        {/* Detalhes de Droga (Condicional) */}
        {formData.natureza === 'Posse de droga para consumo pessoal' && (
            <div className="border p-4 rounded-md space-y-4 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Detalhes da Droga Apreendida</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="drugQuantity">Quantidade (aprox.)</Label>
                        <Input
                            id="drugQuantity"
                            name="drugQuantity"
                            type="number" // Use number or text depending on unit needs
                            value={formData.drugQuantity}
                            onChange={handleChange}
                            placeholder="Ex: 5 (gramas, unidades)"
                            required
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="drugType">Tipo</Label>
                         <Select
                            name="drugType"
                            value={formData.drugType}
                            onValueChange={(value) => handleSelectChange('drugType', value)}
                            required
                        >
                            <SelectTrigger id="drugType">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Vegetal">Vegetal</SelectItem>
                                <SelectItem value="Mineral">Mineral</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="drugColor">Cor Predominante</Label>
                         <Select
                            name="drugColor"
                            value={formData.drugColor}
                            onValueChange={(value) => handleSelectChange('drugColor', value)}
                            required
                        >
                            <SelectTrigger id="drugColor">
                                <SelectValue placeholder="Selecione a cor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Verde">Verde</SelectItem>
                                <SelectItem value="Amarelada">Amarelada</SelectItem>
                                <SelectItem value="Branco">Branco</SelectItem>
                                {/* Add more colors if needed */}
                            </SelectContent>
                        </Select>
                     </div>
                </div>

                {/* Indícios Calculados */}
                {indiciosDroga && (
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm">
                        <p><strong>Indícios Sugerem:</strong> {indiciosDroga}</p>
                    </div>
                )}

                {/* Descrição para Material Desconhecido */}
                {indiciosDroga === 'Material Desconhecido' && (
                    <div className="space-y-2">
                        <Label htmlFor="drugDescription">Descrição do Material Apreendido</Label>
                        <Textarea
                            id="drugDescription"
                            name="drugDescription"
                            value={formData.drugDescription}
                            onChange={handleChange}
                            placeholder="Descreva o material (cor, textura, cheiro, formato)"
                            rows={3}
                            required={indiciosDroga === 'Material Desconhecido'}
                        />
                    </div>
                )}

                {/* Solicitar Perícia */}
                 <div className="space-y-2 pt-2">
                    <Label>Solicitar Perícia no Material?</Label>
                    <RadioGroup
                        name="solicitarPericia"
                        value={formData.solicitarPericia}
                        onValueChange={(value) => handleRadioChange('solicitarPericia', value)}
                        className="flex space-x-4"
                        required
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Sim" id="periciaSim" />
                            <Label htmlFor="periciaSim">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Não" id="periciaNao" />
                            <Label htmlFor="periciaNao">Não</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
        )}


        {/* Envolvidos e Descrição */}
        <div className="border p-4 rounded-md space-y-4">
            <h3 className="text-lg font-medium mb-2">Envolvidos e Narrativa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="defendant">Nome do Infrator</Label>
                    <Input
                        id="defendant"
                        name="defendant"
                        value={formData.defendant}
                        onChange={handleChange}
                        placeholder="Nome completo"
                        required
                    />
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="officer">Policial Responsável pelo Registro</Label>
                    <Input
                        id="officer"
                        name="officer"
                        value={formData.officer}
                        onChange={handleChange}
                        placeholder="Nome e Matrícula/Identificação"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada do Fato</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descreva como a ocorrência se desenvolveu, ações tomadas, etc."
                    rows={5}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="witnesses">Testemunhas (Opcional)</Label>
                <Textarea
                    id="witnesses"
                    name="witnesses"
                    value={formData.witnesses}
                    onChange={handleChange}
                    placeholder="Nome completo e contato das testemunhas (uma por linha)"
                    rows={3}
                />
            </div>
        </div>


        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit">Registrar TCO</Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
