import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import HistoricoTab from "./tco/HistoricoTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import { generatePDF } from "./tco/pdfGenerator";

const naturezas = [
  "Ameaça",
  "Vias de Fato",
  "Lesão Corporal",
  "Dano",
  "Injúria",
  "Difamação",
  "Calúnia",
  "Perturbação do Sossego",
  "Porte de drogas para consumo",
  "Conduzir veículo sem CNH gerando perigo de dano",
  "Entregar veículo automotor a pessoa não habilitada",
  "Trafegar em velocidade incompatível com segurança",
  "Omissão de socorro",
  "Rixa",
  "Invasão de domicílio",
  "Fraude em comércio",
  "Ato obsceno",
  "Falsa identidade",
  "Resistência",
  "Desobediência",
  "Desacato",
  "Exercício arbitrário das próprias razões",
  "Outros",
];

interface TCOFormProps {
  selectedTco?: any;
}

const TCOForm: React.FC<TCOFormProps> = ({ selectedTco }) => {
  const [tcoNumber, setTcoNumber] = useState<string>("");
  const [natureza, setNatureza] = useState<string>("");
  const [tipificacao, setTipificacao] = useState<string>("");
  const [isCustomNatureza, setIsCustomNatureza] = useState<boolean>(false);
  const [customNatureza, setCustomNatureza] = useState<string>("");
  const [dataFato, setDataFato] = useState<string>("");
  const [horaFato, setHoraFato] = useState<string>("");
  const [dataInicioRegistro, setDataInicioRegistro] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaInicioRegistro, setHoraInicioRegistro] = useState<string>("");
  const [localFato, setLocalFato] = useState<string>("");
  const [endereco, setEndereco] = useState<string>("");
  const [municipio, setMunicipio] = useState<string>("Várzea Grande");
  const [comunicante, setComunicante] = useState<string>("");
  const [guarnicao, setGuarnicao] = useState<string>("");
  const [operacao, setOperacao] = useState<string>("");
  const [relatoPolicial, setRelatoPolicial] = useState<string>("");
  const [relatoAutor, setRelatoAutor] = useState<string>("");
  const [relatoVitima, setRelatoVitima] = useState<string>("");
  const [relatoTestemunha, setRelatoTestemunha] = useState<string>("");
  const [apreensoes, setApreensoes] = useState<string>("");
  const [conclusaoPolicial, setConclusaoPolicial] = useState<string>("");
  const [providencias, setProvidencias] = useState<string>("");
  const [documentosAnexos, setDocumentosAnexos] = useState<string>("");
  const [juizadoEspecialData, setJuizadoEspecialData] = useState<string>("");
  const [juizadoEspecialHora, setJuizadoEspecialHora] = useState<string>("");
  const [autores, setAutores] = useState<any[]>([]);
  const [vitimas, setVitimas] = useState<any[]>([]);
  const [testemunhas, setTestemunhas] = useState<any[]>([]);
  const [componentesGuarnicao, setComponentesGuarnicao] = useState<any[]>([]);
  const [downloadLocal, setDownloadLocal] = useState<boolean>(false);
  const [videoLinks, setVideoLinks] = useState<any[]>([]);
  const [apreensoesList, setApreensoesList] = useState<any[]>([]);
  const [drogaTipo, setDrogaTipo] = useState<string>("");
  const [drogaNomeComum, setDrogaNomeComum] = useState<string>("");
  const [condutorNome, setCondutorNome] = useState<string>("");
  const [condutorPosto, setCondutorPosto] = useState<string>("");
  const [condutorRg, setCondutorRg] = useState<string>("");

  const resetForm = useCallback(() => {
    setTcoNumber("");
    setNatureza("");
    setTipificacao("");
    setIsCustomNatureza(false);
    setCustomNatureza("");
    setDataFato("");
    setHoraFato("");
    setDataInicioRegistro(new Date().toISOString().split('T')[0]);
    setHoraInicioRegistro("");
    setLocalFato("");
    setEndereco("");
    setMunicipio("Várzea Grande");
    setComunicante("");
    setGuarnicao("");
    setOperacao("");
    setRelatoPolicial("");
    setRelatoAutor("");
    setRelatoVitima("");
    setRelatoTestemunha("");
    setApreensoes("");
    setConclusaoPolicial("");
    setProvidencias("");
    setDocumentosAnexos("");
    setJuizadoEspecialData("");
    setJuizadoEspecialHora("");
    setAutores([]);
    setVitimas([]);
    setTestemunhas([]);
    setComponentesGuarnicao([]);
    setDownloadLocal(false);
    setVideoLinks([]);
    setApreensoesList([]);
    setDrogaTipo("");
    setDrogaNomeComum("");
    setCondutorNome("");
    setCondutorPosto("");
    setCondutorRg("");
  }, []);

  // Helper functions for managing arrays
  const addAutor = () => {
    setAutores([...autores, { nome: "", rg: "", cpf: "", endereco: "", celular: "", filiacaoPai: "", filiacaoMae: "", dataNascimento: "", sexo: "", profissao: "", nacionalidade: "", naturalidade: "", estadoCivil: "", grauInstrucao: "", laudoPericial: "Não", fielDepositario: "Não", objetoDepositado: "" }]);
  };

  const updateAutor = (index: number, field: string, value: any) => {
    const newAutores = [...autores];
    newAutores[index][field] = value;
    setAutores(newAutores);
  };

  const removeAutor = (index: number) => {
    const newAutores = [...autores];
    newAutores.splice(index, 1);
    setAutores(newAutores);
  };

  const setAutorRelato = (index: number, relato: string) => {
    const newAutores = [...autores];
    newAutores[index].relato = relato;
    setAutores(newAutores);
  };

  const addVitima = () => {
    setVitimas([...vitimas, { nome: "", rg: "", cpf: "", endereco: "", celular: "", filiacaoPai: "", filiacaoMae: "", dataNascimento: "", sexo: "", profissao: "", nacionalidade: "", naturalidade: "", estadoCivil: "", grauInstrucao: "", laudoPericial: "Não" }]);
  };

  const updateVitima = (index: number, field: string, value: any) => {
    const newVitimas = [...vitimas];
    newVitimas[index][field] = value;
    setVitimas(newVitimas);
  };

  const removeVitima = (index: number) => {
    const newVitimas = [...vitimas];
    newVitimas.splice(index, 1);
    setVitimas(newVitimas);
  };

  const setVitimaRelato = (index: number, relato: string) => {
    const newVitimas = [...vitimas];
    newVitimas[index].relato = relato;
    setVitimas(newVitimas);
  };

  const setVitimaRepresentacao = (index: number, representacao: string) => {
    const newVitimas = [...vitimas];
    newVitimas[index].representacao = representacao;
    setVitimas(newVitimas);
  };

  const addTestemunha = () => {
    setTestemunhas([...testemunhas, { nome: "", rg: "", cpf: "", endereco: "", celular: "" }]);
  };

  const updateTestemunha = (index: number, field: string, value: any) => {
    const newTestemunhas = [...testemunhas];
    newTestemunhas[index][field] = value;
    setTestemunhas(newTestemunhas);
  };

  const removeTestemunha = (index: number) => {
    const newTestemunhas = [...testemunhas];
    newTestemunhas.splice(index, 1);
    setTestemunhas(newTestemunhas);
  };

  const setTestemunhaRelato = (index: number, relato: string) => {
    const newTestemunhas = [...testemunhas];
    newTestemunhas[index].relato = relato;
    setTestemunhas(newTestemunhas);
  };

  const addGuarnicao = () => {
    setComponentesGuarnicao([...componentesGuarnicao, { nome: "", posto: "", rg: "", cnh: "", apoio: false }]);
  };

  const updateGuarnicao = (index: number, field: string, value: any) => {
    const newGuarnicao = [...componentesGuarnicao];
    newGuarnicao[index][field] = value;
    setComponentesGuarnicao(newGuarnicao);
  };

  const removeGuarnicao = (index: number) => {
    const newGuarnicao = [...componentesGuarnicao];
    newGuarnicao.splice(index, 1);
    setComponentesGuarnicao(newGuarnicao);
  };

  const addVideoLink = () => {
    setVideoLinks([...videoLinks, { url: "", descricao: "" }]);
  };

  const updateVideoLink = (index: number, field: string, value: any) => {
    const newVideoLinks = [...videoLinks];
    newVideoLinks[index][field] = value;
    setVideoLinks(newVideoLinks);
  };

  const removeVideoLink = (index: number) => {
    const newVideoLinks = [...videoLinks];
    newVideoLinks.splice(index, 1);
    setVideoLinks(newVideoLinks);
  };

  const addApreensao = () => {
    setApreensoesList([...apreensoesList, { item: "", quantidade: "", unidade: "" }]);
  };

  const updateApreensao = (index: number, field: string, value: any) => {
    const newApreensoes = [...apreensoesList];
    newApreensoes[index][field] = value;
    setApreensoesList(newApreensoes);
  };

  const removeApreensao = (index: number) => {
    const newApreensoes = [...apreensoesList];
    newApreensoes.splice(index, 1);
    setApreensoesList(newApreensoes);
  };

  const handleGeneratePDF = async () => {
    if (!natureza || !dataFato || !horaFato || !localFato || !endereco || !comunicante || !guarnicao) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const data = {
      tcoNumber,
      natureza,
      customNatureza,
      dataFato,
      horaFato,
      dataInicioRegistro,
      horaInicioRegistro,
      localFato,
      endereco,
      municipio,
      comunicante,
      guarnicao,
      operacao,
      relatoPolicial,
      relatoAutor,
      relatoVitima,
      relatoTestemunha,
      apreensoes,
      conclusaoPolicial,
      providencias,
      documentosAnexos,
      juizadoEspecialData,
      juizadoEspecialHora,
      autores,
      vitimas,
      testemunhas,
      componentesGuarnicao,
      downloadLocal,
      videoLinks,
      apreensoes: apreensoesList,
      drogaTipo,
      drogaNomeComum,
      condutorNome,
      condutorPosto,
      condutorRg
    };

    try {
      const pdfBlob = await generatePDF(data);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tco.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Erro ao gerar o PDF:", error);
      alert(`Erro ao gerar o PDF: ${error.message}`);
    }
  };

  const handleSaveTCO = async () => {
    // Note: Saving to database is disabled as 'tcos' table doesn't exist
    // This would require creating the proper table structure first
    alert("Funcionalidade de salvamento temporariamente desabilitada. Use apenas a geração de PDF.");
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Termo Circunstanciado de Ocorrência (TCO)
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Preencha todos os campos obrigatórios para gerar o TCO
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="geral" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
          <TabsTrigger value="pessoas">Pessoas Envolvidas</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="guarnicao">Guarnição</TabsTrigger>
          <TabsTrigger value="drogas">Verificação de Drogas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral">
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
            condutorNome={condutorNome}
            condutorPosto={condutorPosto}
            condutorRg={condutorRg}
          />
        </TabsContent>
        
        <TabsContent value="pessoas">
          <PessoasEnvolvidasTab
            vitimas={vitimas}
            handleVitimaChange={updateVitima}
            handleAddVitima={addVitima}
            handleRemoveVitima={removeVitima}
            testemunhas={testemunhas}
            handleTestemunhaChange={updateTestemunha}
            handleAddTestemunha={addTestemunha}
            handleRemoveTestemunha={removeTestemunha}
            autores={autores}
            handleAutorDetalhadoChange={updateAutor}
            handleAddAutor={addAutor}
            handleRemoveAutor={removeAutor}
            natureza={natureza}
          />
        </TabsContent>
        
        <TabsContent value="historico">
          <HistoricoTab
            relatoPolicial={relatoPolicial}
            setRelatoPolicial={setRelatoPolicial}
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
            natureza={natureza}
            providencias={providencias}
            setProvidencias={setProvidencias}
            documentosAnexos={documentosAnexos}
            setDocumentosAnexos={setDocumentosAnexos}
            vitimas={vitimas}
            setVitimaRelato={setVitimaRelato}
            setVitimaRepresentacao={setVitimaRepresentacao}
            testemunhas={testemunhas}
            setTestemunhaRelato={setTestemunhaRelato}
            autores={autores}
            setAutorRelato={setAutorRelato}
          />
        </TabsContent>
        
        <TabsContent value="guarnicao">
          <GuarnicaoTab
            currentGuarnicaoList={componentesGuarnicao}
            onAddPolicial={addGuarnicao}
            onRemovePolicial={removeGuarnicao}
            onToggleApoioPolicial={(index: number) => updateGuarnicao(index, 'apoio', !componentesGuarnicao[index].apoio)}
          />
        </TabsContent>
        
        <TabsContent value="drogas">
          <DrugVerificationTab
            quantidade=""
            setQuantidade={() => {}}
            substancia=""
            setSubstancia={() => {}}
            cor=""
            setCor={() => {}}
            odor=""
            setOdor={() => {}}
            indicios=""
            customMaterialDesc=""
            setCustomMaterialDesc={() => {}}
            isUnknownMaterial={false}
            lacreNumero=""
            setLacreNumero={() => {}}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="secondary" onClick={resetForm}>
          Limpar Tudo
        </Button>
        <Button onClick={handleSaveTCO}>Salvar TCO</Button>
        <Button onClick={handleGeneratePDF}>Gerar PDF</Button>
      </div>
      
      <div className="mt-4">
        <Label htmlFor="downloadLocal" className="mr-2">Salvar PDF localmente?</Label>
        <input
          type="checkbox"
          id="downloadLocal"
          checked={downloadLocal}
          onChange={(e) => setDownloadLocal(e.target.checked)}
        />
      </div>
    </div>
  );
};

export default TCOForm;
