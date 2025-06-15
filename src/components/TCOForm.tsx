import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // << CORREÇÃO: Importação adicionada
import { FileText, Image as ImageIcon, Video as VideoIcon, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { saveTCO } from "@/lib/firebase";
import BasicInformationTab from "./tco/BasicInformationTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import HistoricoTab from "./tco/HistoricoTab";
import { ComponenteGuarnicao } from "./tco/GuarnicaoTab";

interface Droga {
  id: string;
  quantidade: string;
  substancia: string;
  cor: string;
  odor: string;
  indicios: string;
  isUnknownMaterial: boolean;
  customMaterialDesc: string;
}

interface Pessoa {
  id: string;
  nome: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  endereco: string;
  dataNascimento: string;
  naturalidade: string;
  filiacaoMae: string;
  filiacaoPai: string;
  rg: string;
  cpf: string;
  celular: string;
  email: string;
  laudoPericial: string;
  relato?: string;
  representacao?: string;
  fielDepositario?: string;
  objetoDepositado?: string;
}

interface TCOFormProps {
  selectedTco: any;
  onClear: () => void;
}

const initialPersonData: Omit<Pessoa, 'id'> = {
  nome: '',
  sexo: 'masculino',
  estadoCivil: 'solteiro',
  profissao: '',
  endereco: '',
  dataNascimento: '',
  naturalidade: '',
  filiacaoMae: '',
  filiacaoPai: '',
  rg: '',
  cpf: '',
  celular: '',
  email: '',
  laudoPericial: 'Não',
  relato: '',
  representacao: '',
  fielDepositario: 'Não',
  objetoDepositado: '',
};

const initialNovaDrogaState: Omit<Droga, 'id'> = {
  quantidade: '',
  substancia: 'Vegetal',
  cor: 'Verde',
  odor: 'Característico',
  indicios: '',
  isUnknownMaterial: false,
  customMaterialDesc: '',
};

const formatarData = (data: Date): string => {
  return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const formatarHora = (data: Date): string => {
  return format(data, "HH:mm", { locale: ptBR });
};

const relatoPolicialTemplate = `
Informo que nesta data, por volta das [HORA] horas, a guarnição da [GUARNIÇÃO] realizava patrulhamento na [LOCAL DO FATO], quando avistou [DESCRIÇÃO DO CENÁRIO].

Diante da fundada suspeita, foi realizada a abordagem e, em busca pessoal, foi encontrado [OBJETOS APREENDIDOS].

Em entrevista, [AUTOR(ES)] confessou(aram) [CONFISSÃO DO(S) AUTOR(ES)].

Ato contínuo, foi dada voz de prisão a [AUTOR(ES)] e conduzido(s) à Delegacia de Polícia para as providências cabíveis.

A presente ocorrência foi registrada para as devidas providências.
`;

const TCOForm: React.FC<TCOFormProps> = ({
  selectedTco,
  onClear
}) => {
  const {
    toast
  } = useToast();

  // Estados do formulário
  const [tcoNumber, setTcoNumber] = useState('');
  const [natureza, setNatureza] = useState('');
  const [penaDescricao, setPenaDescricao] = useState('');
  const [tipificacao, setTipificacao] = useState('');
  const [dataFato, setDataFato] = useState('');
  const [horaFato, setHoraFato] = useState('');
  const [dataInicioRegistro, setDataInicioRegistro] = useState('');
  const [horaInicioRegistro, setHoraInicioRegistro] = useState('');
  const [dataTerminoRegistro, setDataTerminoRegistro] = useState('');
  const [horaTerminoRegistro, setHoraTerminoRegistro] = useState('');
  const [localFato, setLocalFato] = useState('');
  const [endereco, setEndereco] = useState('');
  const [municipio, setMunicipio] = useState('Várzea Grande');
  const [comunicante, setComunicante] = useState('CIOSP');
  const [guarnicao, setGuarnicao] = useState('');
  const [operacao, setOperacao] = useState('');
  const [relatoAutor, setRelatoAutor] = useState('');
  const [relatoVitima, setRelatoVitima] = useState('');
  const [relatoTestemunha, setRelatoTestemunha] = useState('');
  const [apreensoes, setApreensoes] = useState('Não informado.');
  const [conclusaoPolicial, setConclusaoPolicial] = useState('O(A) AUTOR(A) DO FATO FOI LIBERADO(A) SEM LESÕES CORPORAIS APARENTES, APÓS ASSINAR TERMO DE COMPROMISSO DE COMPARECIMENTO EM JUÍZO.');
  const [representacao, setRepresentacao] = useState('');
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [providencias, setProvidencias] = useState('Não informado.');
  const [documentosAnexos, setDocumentosAnexos] = useState('');
  const [customNatureza, setCustomNatureza] = useState('');
  const [juizadoEspecialData, setJuizadoEspecialData] = useState('');
  const [juizadoEspecialHora, setJuizadoEspecialHora] = useState('');
  const [drogas, setDrogas] = useState<Droga[]>([]);
  const [novaDroga, setNovaDroga] = useState(initialNovaDrogaState);
  const [lacreNumero, setLacreNumero] = useState('');
  const [autores, setAutores] = useState<Pessoa[]>([]);
  const [vitimas, setVitimas] = useState<Pessoa[]>([]);
  const [testemunhas, setTestemunhas] = useState<Pessoa[]>([]);
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<ComponenteGuarnicao[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [relatoPolicial, setRelatoPolicial] = useState(relatoPolicialTemplate);
  const [isRelatoPolicialManuallyEdited, setIsRelatoPolicialManuallyEdited] = useState(false);
  const isPrimaryDrugCase = natureza.split(' + ')[0] === "Porte de drogas para consumo";

  const handleRelatoPolicialChange = (value: string) => {
    setRelatoPolicial(value);
    setIsRelatoPolicialManuallyEdited(true);
  };

  // << CORREÇÃO: Handlers para a GuarnicaoTab >>
  const handleAddPolicial = useCallback((policial: ComponenteGuarnicao) => {
    setComponentesGuarnicao(prev => [...prev, policial]);
  }, []);

  const handleRemovePolicial = useCallback((index: number) => {
    setComponentesGuarnicao(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleToggleApoioPolicial = useCallback((index: number) => {
    setComponentesGuarnicao(prev => prev.map((p, i) => i === index ? { ...p, apoio: !p.apoio } : p));
  }, []);


  const handleFielDepositarioChange = (index: number, field: keyof Pessoa, value: string) => {
    const newAutores = [...autores];
    if (newAutores[index]) {
      (newAutores[index] as any)[field] = value;
      setAutores(newAutores);
    }
  };
  
  const handleNovaDrogaChange = (field: keyof Omit<Droga, 'id'>, value: string | boolean) => {
    setNovaDroga(prev => ({ ...prev, [field]: value }));
  };

  const handleAdicionarDroga = () => {
    if (!novaDroga.quantidade || !novaDroga.substancia || !novaDroga.cor || !novaDroga.odor) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos da droga."
      });
      return;
    }

    if (novaDroga.isUnknownMaterial && !novaDroga.customMaterialDesc) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, descreva o material não identificado."
      });
      return;
    }

    const novaDrogaCompleta: Droga = {
      id: Date.now().toString(),
      ...novaDroga,
      indicios: `${novaDroga.quantidade} de substância ${novaDroga.substancia.toLowerCase()} de cor ${novaDroga.cor.toLowerCase()} e odor ${novaDroga.odor.toLowerCase()}`
    };

    setDrogas(prev => [...prev, novaDrogaCompleta]);
    setNovaDroga(initialNovaDrogaState);
  };

  const handleRemoverDroga = (id: string) => {
    setDrogas(prev => prev.filter(droga => droga.id !== id));
  };

  const handleVitimaRelatoChange = (index: number, relato: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index].relato = relato;
      setVitimas(newVitimas);
    }
  };

  const handleVitimaRepresentacaoChange = (index: number, representacao: string) => {
    const newVitimas = [...vitimas];
    if (newVitimas[index]) {
      newVitimas[index].representacao = representacao;
      setVitimas(newVitimas);
    }
  };

  const handleTestemunhaRelatoChange = (index: number, relato: string) => {
    const newTestemunhas = [...testemunhas];
    if (newTestemunhas[index]) {
      newTestemunhas[index].relato = relato;
      setTestemunhas(newTestemunhas);
    }
  };

  const handleAutorRelatoChange = (index: number, relato: string) => {
    const newAutores = [...autores];
    if (newAutores[index]) {
      newAutores[index].relato = relato;
      setAutores(newAutores);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!tcoNumber || !natureza || !dataFato || !horaFato || !localFato || !endereco || !comunicante || !guarnicao) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios."
      });
      setIsSubmitting(false);
      return;
    }

    if (isPrimaryDrugCase && (!drogas || drogas.length === 0 || !lacreNumero)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Para TCO de drogas, adicione pelo menos uma droga e informe o número do lacre."
      });
      setIsSubmitting(false);
      return;
    }

    const formData = {
      tcoNumber,
      natureza,
      penaDescricao,
      tipificacao,
      dataFato,
      horaFato,
      dataInicioRegistro,
      horaInicioRegistro,
      dataTerminoRegistro,
      horaTerminoRegistro,
      localFato,
      endereco,
      municipio,
      comunicante,
      guarnicao,
      operacao,
      relatoAutor,
      relatoVitima,
      relatoTestemunha,
      apreensoes,
      conclusaoPolicial,
      representacao,
      videoLinks,
      providencias,
      documentosAnexos,
      customNatureza,
      juizadoEspecialData,
      juizadoEspecialHora,
      drogas,
      lacreNumero,
      autores,
      vitimas,
      testemunhas,
      componentesGuarnicao,
      imageFiles: imageFiles.map(file => file.name),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await saveTCO(formData, imageFiles);
      toast({
        title: "TCO Salvo",
        description: "O TCO foi salvo com sucesso."
      });
      onClear();
    } catch (error: any) {
      console.error("Erro ao salvar o TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: `Ocorreu um erro ao salvar o TCO: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const naturezaOptions = ["Ameaça", "Vias de Fato", "Lesão Corporal", "Dano", "Injúria", "Difamação", "Calúnia", "Perturbação do Sossego", "Porte de drogas para consumo", "Conduzir veículo sem CNH gerando perigo de dano", "Entregar veículo automotor a pessoa não habilitada", "Trafegar em velocidade incompatível com segurança", "Omissão de socorro", "Rixa", "Invasão de domicílio", "Fraude em comércio", "Ato obsceno", "Falsa identidade", "Resistência", "Desobediência", "Desacato", "Exercício arbitrário das próprias razões", "Outros"];
  const condutorParaDisplay = componentesGuarnicao.find(c => c.nome && c.rg);
  const isCustomNatureza = natureza.includes("Outros");

  return <div className="container md:py-10 max-w-5xl mx-auto py-0 px-[9px]">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Termo Circunstanciado de Ocorrência</CardTitle>
              <CardDescription>
                Preencha os campos abaixo para gerar o TCO. Os campos com * são obrigatórios.
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* << CORREÇÃO: Props corrigidas para cada componente de aba >> */}
          <BasicInformationTab 
            tcoNumber={tcoNumber}
            setTcoNumber={setTcoNumber}
            natureza={natureza}
            setNatureza={setNatureza}
            penaDescricao={penaDescricao}
            naturezaOptions={naturezaOptions}
            customNatureza={customNatureza}
            setCustomNatureza={setCustomNatureza}
            startTime={startTime}
            isTimerRunning={isTimerRunning}
            juizadoEspecialData={juizadoEspecialData}
            setJuizadoEspecialData={setJuizadoEspecialData}
            juizadoEspecialHora={juizadoEspecialHora}
            setJuizadoEspecialHora={setJuizadoEspecialHora}
          />
          
          <GeneralInformationTab 
            natureza={natureza}
            tipificacao={tipificacao}
            setTipificacao={setTipificacao}
            isCustomNatureza={isCustomNatureza}
            customNatureza={customNatureza}
            dataFato={dataFato}
            setDataFato={setDataFato}
            horaFato={horaFato}
            setHoraFato={setHoraFato}
            dataInicioRegistro={dataInicioRegistro}
            horaInicioRegistro={horaInicioRegistro}
            setHoraInicioRegistro={setHoraInicioRegistro}
            dataTerminoRegistro={dataTerminoRegistro}
            horaTerminoRegistro={horaTerminoRegistro}
            localFato={localFato}
            setLocalFato={setLocalFato}
            endereco={endereco}
            setEndereco={setEndereco}
            municipio={municipio}
            comunicante={comunicante}
            setComunicante={setComunicante}
            guarnicao={guarnicao}
            setGuarnicao={setGuarnicao}
            operacao={operacao}
            setOperacao={setOperacao}
            condutorNome={condutorParaDisplay?.nome || ""}
            condutorPosto={condutorParaDisplay?.posto || ""}
            condutorRg={condutorParaDisplay?.rg || ""}
          />
          
          <GuarnicaoTab 
            currentGuarnicaoList={componentesGuarnicao}
            onAddPolicial={handleAddPolicial}
            onRemovePolicial={handleRemovePolicial}
            onToggleApoioPolicial={handleToggleApoioPolicial}
          />

          <PessoasEnvolvidasTab 
            autores={autores} 
            setAutores={setAutores} 
            vitimas={vitimas} 
            setVitimas={setVitimas} 
            testemunhas={testemunhas} 
            setTestemunhas={setTestemunhas} 
            onFielDepositarioChange={handleFielDepositarioChange} 
          />
          
          {isPrimaryDrugCase && (
            <DrugVerificationTab 
              novaDroga={novaDroga}
              onNovaDrogaChange={handleNovaDrogaChange}
              onAdicionarDroga={handleAdicionarDroga}
              drogasAdicionadas={drogas}
              onRemoverDroga={handleRemoverDroga}
              lacreNumero={lacreNumero}
              setLacreNumero={setLacreNumero}
            />
          )}

          <HistoricoTab 
            relatoPolicial={relatoPolicial}
            setRelatoPolicial={handleRelatoPolicialChange}
            relatoAutor={relatoAutor}
            setRelatoAutor={setRelatoAutor}
            relatoVitima={relatoVitima}
            setRelatoVitima={setRelatoVitima}
            relatoTestemunha={relatoTestemunha}
            setRelatoTestemunha={setRelatoTestemunha}
            apreensoes={apreensoes}
            setApreensoes={setApreensoes}
            conclusaoPolicial={conclusaoPolicial}
            setConclusaoPolicial={setConclusaoPolicial}
            drugSeizure={isPrimaryDrugCase}
            representacao={representacao}
            setRepresentacao={setRepresentacao}
            natureza={natureza}
            videoLinks={videoLinks}
            setVideoLinks={setVideoLinks}
            solicitarCorpoDelito={autores[0]?.laudoPericial || "Não"}
            autorSexo={autores[0]?.sexo || "masculino"}
            providencias={providencias}
            setProvidencias={setProvidencias}
            documentosAnexos={documentosAnexos}
            setDocumentosAnexos={setDocumentosAnexos}
            lacreNumero={lacreNumero}
            internalDrugs={drogas}
            vitimas={vitimas}
            setVitimaRelato={handleVitimaRelatoChange}
            setVitimaRepresentacao={handleVitimaRepresentacaoChange}
            testemunhas={testemunhas}
            setTestemunhaRelato={handleTestemunhaRelatoChange}
            autores={autores}
            setAutorRelato={handleAutorRelatoChange}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Mídias</CardTitle>
              <CardDescription>Adicione links de vídeos e imagens relacionadas à ocorrência.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="video-link">Links de Vídeos (um por linha)</Label>
                  <Textarea id="video-link" placeholder="https://example.com/video1..." value={videoLinks.join('\n')} onChange={(e) => setVideoLinks(e.target.value.split('\n'))} />
                </div>
                <div>
                  <Label>Imagens</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Adicionar Imagens
                    </Button>
                    <Input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => setImageFiles(files => files.filter((_, i) => i !== index))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Gerando PDF..." : "Gerar e Salvar TCO"}
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Limpar Formulário
          </Button>
        </div>
      </form>
    </div>;
};

export default TCOForm;
