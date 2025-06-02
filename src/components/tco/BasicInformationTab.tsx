import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import TCOTimer from "./TCOTimer";
import { useToast } from "@/hooks/use-toast";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BasicInformationTabProps {
  tcoNumber: string;
  setTcoNumber: (value: string) => void;
  natureza: string;
  setNatureza: (value: string) => void;
  autor: string;
  setAutor: (value: string) => void;
  penaDescricao: string;
  naturezaOptions: string[];
  customNatureza: string;
  setCustomNatureza: (value: string) => void;
  startTime: Date | null;
  isTimerRunning: boolean;
  juizadoEspecialData: string;
  setJuizadoEspecialData: (value: string) => void;
  juizadoEspecialHora: string;
  setJuizadoEspecialHora: (value: string) => void;
}

// Mapeamento de naturezas para penas MÁXIMAS (em anos)
const naturezaPenas: Record<string, number> = {
  "Porte de drogas para consumo": 0, // Não há pena de prisão, apenas medidas educativas
  "Lesão Corporal": 1.0, // 1 ano (máxima)
  "Ameaça": 0.5, // 6 meses (máxima)
  "Injúria": 0.5, // 6 meses
  "Difamação": 1.0, // 1 ano
  "Calúnia": 2.0, // 2 anos (máxima)
  "Perturbação do trabalho ou do sossego alheios": 0.25, // 3 meses
  "Vias de Fato": 0.25, // 3 meses (máxima)
  "Contravenção penal": 0.25, // 3 meses
  "Dano": 0.5, // 6 meses
  "Perturbação do Sossego": 0.25, // 3 meses
  "Conduzir veículo sem CNH gerando perigo de dano": 1.0, // 1 ano
  "Entregar veículo automotor a pessoa não habilitada": 1.0, // 1 ano
  "Trafegar em velocidade incompatível com segurança": 1.0, // 1 ano
  "Omissão de socorro": 0.5, // 6 meses
  "Rixa": 0.17, // 2 meses (máxima)
  "Invasão de domicílio": 0.25, // 3 meses
  "Fraude em comércio": 2.0, // 2 anos
  "Ato obsceno": 1.0, // 1 ano
  "Falsa identidade": 1.0, // 1 ano
  "Resistência": 2.0, // 2 anos
  "Desobediência": 0.5, // 6 meses
  "Desacato": 2.0, // 2 anos
  "Exercício arbitrário das próprias razões": 0.08, // 1 mês
};

// Mapeamento de naturezas para tipificações
const naturezaTipificacoes: Record<string, string> = {
  "Ameaça": "ART. 147 DO CÓDIGO PENAL",
  "Vias de Fato": "ART. 21 DA LEI DE CONTRAVENÇÕES PENAIS",
  "Lesão Corporal": "ART. 129 DO CÓDIGO PENAL",
  "Dano": "ART. 163 DO CÓDIGO PENAL",
  "Injúria": "ART. 140 DO CÓDIGO PENAL",
  "Difamação": "ART. 139 DO CÓDIGO PENAL",
  "Calúnia": "ART. 138 DO CÓDIGO PENAL",
  "Perturbação do Sossego": "ART. 42 DA LEI DE CONTRAVENÇÕES PENAIS",
  "Porte de drogas para consumo": "ART. 28 DA LEI Nº 11.343/2006 (LEI DE DROGAS)",
  "Conduzir veículo sem CNH gerando perigo de dano": "ART. 309 DO CÓDIGO DE TRÂNSITO BRASILEIRO",
  "Entregar veículo automotor a pessoa não habilitada": "ART. 310 DO CÓDIGO DE TRÂNSITO BRASILEIRO",
  "Trafegar em velocidade incompatível com segurança": "ART. 311 DO CÓDIGO DE TRÂNSITO BRASILEIRO",
  "Omissão de socorro": "ART. 135 DO CÓDIGO PENAL",
  "Rixa": "ART. 137 DO CÓDIGO PENAL",
  "Invasão de domicílio": "ART. 150 DO CÓDIGO PENAL",
  "Fraude em comércio": "ART. 176 DO CÓDIGO PENAL",
  "Ato obsceno": "ART. 233 DO CÓDIGO PENAL",
  "Falsa identidade": "ART. 307 DO CÓDIGO PENAL",
  "Resistência": "ART. 329 DO CÓDIGO PENAL",
  "Desobediência": "ART. 330 DO CÓDIGO PENAL",
  "Desacato": "ART. 331 DO CÓDIGO PENAL",
  "Exercício arbitrário das próprias razões": "ART. 345 DO CÓDIGO PENAL",
};

const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
  tcoNumber,
  setTcoNumber,
  natureza,
  setNatureza,
  penaDescricao,
  naturezaOptions,
  customNatureza,
  setCustomNatureza,
  startTime,
  isTimerRunning,
  juizadoEspecialData,
  setJuizadoEspecialData,
  juizadoEspecialHora,
  setJuizadoEspecialHora
}) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [selectedNaturezas, setSelectedNaturezas] = useState<string[]>([]);
  const [selectedCustomNatureza, setSelectedCustomNatureza] = useState<string>("");
  const [totalPenaAnos, setTotalPenaAnos] = useState<number>(0);
  const [showPenaAlert, setShowPenaAlert] = useState<boolean>(false);
  const [tipificacaoCompleta, setTipificacaoCompleta] = useState<string>("");

  // Inicializar com a natureza atual se existir
  useEffect(() => {
    if (natureza && !selectedNaturezas.includes(natureza)) {
      setSelectedNaturezas([natureza]);
    }
  }, [natureza]);

  // Calcular pena total e tipificação sempre que as naturezas selecionadas mudarem
  useEffect(() => {
    let total = 0;
    const tipificacoes: string[] = [];
    
    selectedNaturezas.forEach(nat => {
      if (nat === "Outros") {
        // Para natureza customizada, assumir pena de 2 anos como padrão (máximo para TCO)
        total += 2.0;
        tipificacoes.push("[TIPIFICAÇÃO LEGAL A SER INSERIDA]");
      } else {
        total += naturezaPenas[nat] || 2.0; // Default 2 anos se não encontrado
        tipificacoes.push(naturezaTipificacoes[nat] || "[TIPIFICAÇÃO NÃO MAPEADA]");
      }
    });
    
    setTotalPenaAnos(total);
    setShowPenaAlert(total > 2);
    
    // Formato da tipificação: usar vírgulas e "E" apenas antes do último item
    let tipificacaoFormatada = "";
    if (tipificacoes.length === 1) {
      tipificacaoFormatada = tipificacoes[0];
    } else if (tipificacoes.length === 2) {
      tipificacaoFormatada = tipificacoes.join(" E ");
    } else if (tipificacoes.length > 2) {
      const ultimoItem = tipificacoes.pop();
      tipificacaoFormatada = tipificacoes.join(", ") + " E " + ultimoItem;
    }
    
    setTipificacaoCompleta(tipificacaoFormatada);
    
    if (total > 2) {
      toast({
        variant: "warning",
        title: "Atenção: Pena Superior a 2 Anos",
        description: `A soma das penas máximas das naturezas selecionadas é de ${total} anos, excedendo o limite de 2 anos para TCO.`
      });
    }
  }, [selectedNaturezas, toast]);

  const handleTcoNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    setTcoNumber(numericValue);

    if (numericValue && numericValue.length >= 3) {
      await checkDuplicateTco(numericValue);
    }
  };

  const checkDuplicateTco = async (tcoNum: string) => {
    setIsChecking(true);
    try {
      const tcosRef = collection(db, "tcos");
      const q = query(tcosRef, where("tcoNumber", "==", tcoNum));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingTco = querySnapshot.docs[0].data();
        const createdAt = existingTco.createdAt?.toDate?.() || new Date(existingTco.createdAt);
        const formattedDate = createdAt.toLocaleDateString('pt-BR');
        
        toast({
          variant: "destructive",
          title: "TCO Duplicado",
          description: `Já existe um TCO com a numeração ${tcoNum}. Registrado em ${formattedDate}, Natureza: ${existingTco.natureza || 'Não informada'}.`
        });
      }
    } catch (error) {
      console.error("Erro ao verificar TCO duplicado:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddNatureza = (selectedNatureza: string) => {
    if (selectedNatureza && !selectedNaturezas.includes(selectedNatureza)) {
      const newNaturezas = [...selectedNaturezas, selectedNatureza];
      setSelectedNaturezas(newNaturezas);
      
      // Atualizar a natureza principal (primeira selecionada define o comportamento do formulário)
      if (newNaturezas.length === 1) {
        setNatureza(selectedNatureza);
      } else {
        // Para múltiplas naturezas, concatenar com " + "
        setNatureza(newNaturezas.join(" + "));
      }
    }
  };

  const handleRemoveNatureza = (naturezaToRemove: string) => {
    const newNaturezas = selectedNaturezas.filter(nat => nat !== naturezaToRemove);
    setSelectedNaturezas(newNaturezas);
    
    if (naturezaToRemove === "Outros") {
      setSelectedCustomNatureza("");
      setCustomNatureza("");
    }
    
    if (newNaturezas.length === 0) {
      setNatureza("");
    } else if (newNaturezas.length === 1) {
      setNatureza(newNaturezas[0]);
    } else {
      setNatureza(newNaturezas.join(" + "));
    }
  };

  const handleCustomNaturezaChange = (value: string) => {
    setSelectedCustomNatureza(value);
    setCustomNatureza(value);
  };

  // Verificar duplicatas quando o número do TCO muda (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tcoNumber) {
        checkDuplicateTco(tcoNumber);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [tcoNumber]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>TCO</CardTitle>
            <CardDescription>
              Preencha os dados básicos do TCO
            </CardDescription>
          </div>
          <TCOTimer startTime={startTime} isRunning={isTimerRunning} />
        </div>
      </CardHeader>
      <CardContent className="px-[5px]">
        <div className="space-y-4">
          
          {/* Número do TCO */}
          <div>
            <Label htmlFor="tcoNumber">Número do TCO *</Label>
            <div className="relative">
              <Input 
                id="tcoNumber" 
                placeholder="Informe o número do TCO (apenas números)" 
                value={tcoNumber} 
                onChange={handleTcoNumberChange} 
                className={isChecking ? "border-yellow-300" : ""} 
              />
              {isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Alert de Pena Superior a 2 Anos - Aparece no formulário */}
          {showPenaAlert && (
            <Alert variant="destructive" className="border-red-600 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção: Pena Superior a 2 Anos Detectada</AlertTitle>
              <AlertDescription>
                A soma das penas máximas das naturezas selecionadas é de {totalPenaAnos} anos, 
                excedendo o limite de 2 anos. Não é permitido registrar TCO quando a pena máxima total excede 2 anos.
              </AlertDescription>
            </Alert>
          )}

          {/* Naturezas Selecionadas */}
          {selectedNaturezas.length > 0 && (
            <div>
              <Label>Naturezas Selecionadas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedNaturezas.map((nat, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {nat === "Outros" ? selectedCustomNatureza || "Outros" : nat}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveNatureza(nat)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pena máxima total: {totalPenaAnos} anos
              </p>
            </div>
          )}
          
          {/* Seleção de Natureza */}
          <div>
            <Label htmlFor="natureza">Adicionar Natureza *</Label>
            <Select onValueChange={handleAddNatureza}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma natureza para adicionar" />
              </SelectTrigger>
              <SelectContent>
                {naturezaOptions
                  .filter(option => !selectedNaturezas.includes(option))
                  .map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Natureza Personalizada */}
          {selectedNaturezas.includes("Outros") && (
            <div>
              <Label htmlFor="customNatureza">Especifique a Natureza *</Label>
              <Input 
                id="customNatureza" 
                placeholder="Digite a natureza específica" 
                value={selectedCustomNatureza} 
                onChange={(e) => handleCustomNaturezaChange(e.target.value)} 
              />
            </div>
          )}

          {/* Tipificação Legal - Mostra a tipificação ordenada conforme ordem de inserção */}
          {tipificacaoCompleta && (
            <div>
              <Label>Tipificação Legal</Label>
              <Input readOnly value={tipificacaoCompleta} className="bg-gray-100" />
            </div>
          )}

          {/* Pena da Tipificação - Ocultada quando há múltiplas naturezas ou "Outros" */}
          {penaDescricao && selectedNaturezas.length === 1 && !selectedNaturezas.includes("Outros") && (
            <div>
              <Label>Pena da Tipificação</Label>
              <Input readOnly value={penaDescricao} className="bg-gray-100" />
            </div>
          )}

          {/* Apresentação em Juizado Especial VG */}
          <div className="space-y-2">
            <Label>Apresentação em Juizado Especial VG</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              
              {/* Campo Data */}
              <div className="space-y-1">
                <Label htmlFor="juizadoData">Data</Label>
                <Input 
                  id="juizadoData" 
                  type="date" 
                  value={juizadoEspecialData} 
                  onChange={(e) => setJuizadoEspecialData(e.target.value)} 
                />
              </div>
              
              {/* Campo Hora */}
              <div className="space-y-1">
                <Label htmlFor="juizadoHora">Hora</Label>
                <Input 
                  id="juizadoHora" 
                  type="time" 
                  value={juizadoEspecialHora} 
                  onChange={(e) => setJuizadoEspecialHora(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* Conteúdo do rodapé, se houver */}
      </CardFooter>
    </Card>
  );
};

export default BasicInformationTab;
