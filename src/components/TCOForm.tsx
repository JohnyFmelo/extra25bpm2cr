import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";

// Lista de naturezas de TCO
const naturezas = [
  { id: "drogas", label: "Art. 28 - Posse de droga para consumo pessoal", 
    pena: "I - advertência sobre os efeitos das drogas; II - prestação de serviços à comunidade; III - medida educativa de comparecimento a programa ou curso educativo." },
  { id: "perturbacao", label: "Art. 65 - Perturbação do sossego alheio", 
    pena: "Prisão simples, de quinze dias a três meses, ou multa." },
  { id: "ameaca", label: "Art. 147 - Ameaça", 
    pena: "Detenção, de um a seis meses, ou multa." },
  { id: "lesao_leve", label: "Art. 129 § 6º - Lesão corporal leve", 
    pena: "Detenção, de três meses a um ano." },
  { id: "desacato", label: "Art. 331 - Desacato", 
    pena: "Detenção, de seis meses a dois anos, ou multa." },
  { id: "outro", label: "Outro (especificar)", pena: "" }
];

// Formato de hora (24h)
const formatTime = (date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Formato de data (DD/MM/YYYY)
const formatDate = (date) => {
  return date.toLocaleDateString('pt-BR');
};

const TCOForm = () => {
  const { toast } = useToast();
  const now = new Date();
  
  // Estado para controle dos campos do formulário
  const [formData, setFormData] = useState({
    numeroTCO: "",
    natureza: "",
    naturezaOutro: "",
    // Dados da droga
    quantidade: "",
    tipoDroga: "",
    corDroga: "",
    indiciosDroga: "",
    descricaoMaterial: "",
    solicitarPericia: "sim",
    // Dados da ocorrência
    dataFato: formatDate(now),
    horaFato: formatTime(now),
    dataInicioRegistro: formatDate(now),
    horaInicioRegistro: formatTime(now),
    dataFimRegistro: "",
    horaFimRegistro: "",
    // Campos originais
    location: "",
    defendant: "",
    description: "",
    witnesses: "",
    officer: "",
  });

  // Estado para armazenar a pena da natureza selecionada
  const [penaNatureza, setPenaNatureza] = useState("");
  
  // Estado para controlar a visibilidade da seção de drogas
  const [mostrarSecaoDroga, setMostrarSecaoDroga] = useState(false);

  // Efeito para atualizar o horário de início do registro
  useEffect(() => {
    const dataInicioRegistro = formatDate(new Date());
    const horaInicioRegistro = formatTime(new Date());
    
    setFormData(prev => ({
      ...prev,
      dataInicioRegistro,
      horaInicioRegistro
    }));
  }, []);

  // Função para inferir os indícios com base no tipo e cor da droga
  const inferirIndiciosDroga = (tipo, cor) => {
    if (!tipo || !cor) return "";
    
    if (tipo === "vegetal" && cor === "verde") {
      return "Maconha";
    } else if (tipo === "mineral" && cor === "amarelada") {
      return "Pasta Base";
    } else if (tipo === "mineral" && cor === "branca") {
      return "Cocaína";
    } else {
      return "Material Desconhecido";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Lógica para natureza
    if (name === "natureza") {
      const naturezaSelecionada = naturezas.find(n => n.id === value);
      setPenaNatureza(naturezaSelecionada?.pena || "");
      setMostrarSecaoDroga(value === "drogas");
    }
    
    // Lógica para inferir indícios de droga quando tipo ou cor são alterados
    if (name === "tipoDroga" || name === "corDroga") {
      const tipo = name === "tipoDroga" ? value : formData.tipoDroga;
      const cor = name === "corDroga" ? value : formData.corDroga;
      const indiciosDroga = inferirIndiciosDroga(tipo, cor);
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        indiciosDroga
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Atualizar data e hora de fim do registro
    const dataFimRegistro = formatDate(new Date());
    const horaFimRegistro = formatTime(new Date());
    
    const formDataFinal = {
      ...formData,
      dataFimRegistro,
      horaFimRegistro
    };
    
    // Aqui você enviaria para o backend
    console.log("TCO Form submitted:", formDataFinal);
    
    toast({
      title: "TCO Registrado",
      description: "O registro foi salvo com sucesso.",
      duration: 3000,
    });
    
    // Reset form after submission
    setFormData({
      numeroTCO: "",
      natureza: "",
      naturezaOutro: "",
      quantidade: "",
      tipoDroga: "",
      corDroga: "",
      indiciosDroga: "",
      descricaoMaterial: "",
      solicitarPericia: "sim",
      dataFato: formatDate(now),
      horaFato: formatTime(now),
      dataInicioRegistro: formatDate(now),
      horaInicioRegistro: formatTime(now),
      dataFimRegistro: "",
      horaFimRegistro: "",
      location: "",
      defendant: "",
      description: "",
      witnesses: "",
      officer: "",
    });
    setPenaNatureza("");
    setMostrarSecaoDroga(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">Registro de TCO</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção de Identificação do TCO */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do TCO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroTCO">Nº do TCO</Label>
                <Input
                  id="numeroTCO"
                  name="numeroTCO"
                  value={formData.numeroTCO}
                  onChange={handleChange}
                  placeholder="Número do TCO"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="natureza">Natureza</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("natureza", value)}
                  value={formData.natureza}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a natureza do TCO" />
                  </SelectTrigger>
                  <SelectContent>
                    {naturezas.map((natureza) => (
                      <SelectItem key={natureza.id} value={natureza.id}>{natureza.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Campo para especificar outra natureza */}
            {formData.natureza === "outro" && (
              <div className="space-y-2">
                <Label htmlFor="naturezaOutro">Especifique a natureza</Label>
                <Input
                  id="naturezaOutro"
                  name="naturezaOutro"
                  value={formData.naturezaOutro}
                  onChange={handleChange}
                  placeholder="Descreva a natureza do TCO"
                  required
                />
              </div>
            )}
            
            {/* Exibir pena prevista */}
            {penaNatureza && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-800">Pena prevista:</h4>
                <p className="text-blue-700">{penaNatureza}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Seção específica para Drogas */}
        {mostrarSecaoDroga && (
          <Card>
            <CardHeader>
              <CardTitle>Informações sobre a Droga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade (g)</Label>
                  <Input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantidade}
                    onChange={handleChange}
                    placeholder="Quantidade em gramas"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipoDroga">Tipo</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("tipoDroga", value)}
                    value={formData.tipoDroga}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetal">Vegetal</SelectItem>
                      <SelectItem value="mineral">Mineral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corDroga">Cor</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("corDroga", value)}
                    value={formData.corDroga}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verde">Verde</SelectItem>
                      <SelectItem value="amarelada">Amarelada</SelectItem>
                      <SelectItem value="branca">Branca</SelectItem>
                      <SelectItem value="outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Indícios */}
              <div className="space-y-2">
                <Label>Indícios:</Label>
                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="font-medium">
                    {formData.indiciosDroga || "Aguardando informações..."}
                  </p>
                </div>
              </div>
              
              {/* Descrição para material desconhecido */}
              {formData.indiciosDroga === "Material Desconhecido" && (
                <div className="space-y-2">
                  <Label htmlFor="descricaoMaterial">Descrição do Material</Label>
                  <Textarea
                    id="descricaoMaterial"
                    name="descricaoMaterial"
                    value={formData.descricaoMaterial}
                    onChange={handleChange}
                    placeholder="Descreva o material encontrado"
                    rows={2}
                    required
                  />
                </div>
              )}
              
              {/* Solicitar Perícia */}
              <div className="space-y-2">
                <Label>Solicitar Perícia?</Label>
                <RadioGroup
                  defaultValue="sim"
                  value={formData.solicitarPericia}
                  onValueChange={(value) => handleSelectChange("solicitarPericia", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="sim" />
                    <Label htmlFor="sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="nao" />
                    <Label htmlFor="nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Seção de Dados da Ocorrência */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Ocorrência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="dataInicioRegistro">Data de Início do Registro</Label>
                <Input
                  id="dataInicioRegistro"
                  name="dataInicioRegistro"
                  type="text"
                  value={formData.dataInicioRegistro}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="horaInicioRegistro">Hora de Início do Registro</Label>
                <Input
                  id="horaInicioRegistro"
                  name="horaInicioRegistro"
                  type="text"
                  value={formData.horaInicioRegistro}
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Local da Ocorrência</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Local da ocorrência"
                  required
                />
              </div>
              
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
                <Label htmlFor="officer">Policial Responsável</Label>
                <Input
                  id="officer"
                  name="officer"
                  value={formData.officer}
                  onChange={handleChange}
                  placeholder="Nome do policial"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Ocorrência</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva detalhes da ocorrência"
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="witnesses">Testemunhas</Label>
              <Textarea
                id="witnesses"
                name="witnesses"
                value={formData.witnesses}
                onChange={handleChange}
                placeholder="Nome e contato das testemunhas (se houver)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">Cancelar</Button>
          <Button type="submit">Registrar TCO</Button>
        </div>
      </form>
    </div>
  );
};

export default TCOForm;
