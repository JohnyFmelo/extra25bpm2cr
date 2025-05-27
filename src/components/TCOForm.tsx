import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BasicInformationTab from "./tco/BasicInformationTab";
import GuarnicaoTab from "./tco/GuarnicaoTab";
import PessoasEnvolvidasTab from "./tco/PessoasEnvolvidasTab";
import GeneralInformationTab from "./tco/GeneralInformationTab";
import DrugVerificationTab from "./tco/DrugVerificationTab";
import HistoricoTab from "./tco/HistoricoTab";

interface TCOFormProps {
  selectedTco: any;
}

const TCOForm = ({ selectedTco }: TCOFormProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [tcoNumber, setTcoNumber] = useState(selectedTco?.tcoNumber || "");
  const [natureza, setNatureza] = useState(selectedTco?.natureza || "");
  const [autor, setAutor] = useState("");
  const [penaDescricao, setPenaDescricao] = useState("");
  const [customNatureza, setCustomNatureza] = useState(selectedTco?.customNatureza || "");
  const [guarnicao, setGuarnicao] = useState(selectedTco?.guarnicao || "");
  const [address, setAddress] = useState(selectedTco?.address || "");
  const [addressNumber, setAddressNumber] = useState(selectedTco?.addressNumber || "");
  const [addressComplement, setAddressComplement] = useState(selectedTco?.addressComplement || "");
  const [city, setCity] = useState(selectedTco?.city || "");
  const [estado, setEstado] = useState(selectedTco?.estado || "");
  const [boletimOcorrencia, setBoletimOcorrencia] = useState(selectedTco?.boletimOcorrencia || "");
  const [vitimaNome, setVitimaNome] = useState("");
  const [vitimaDocumento, setVitimaDocumento] = useState("");
  const [condutorNome, setCondutorNome] = useState("");
  const [condutorDocumento, setCondutorDocumento] = useState("");
  const [veiculoMarca, setVeiculoMarca] = useState("");
  const [veiculoModelo, setVeiculoModelo] = useState("");
  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [drogasApreendidas, setDrogasApreendidas] = useState(selectedTco?.drogasApreendidas || false);
  const [tipoDroga, setTipoDroga] = useState(selectedTco?.tipoDroga || "");
  const [quantidadeDroga, setQuantidadeDroga] = useState(selectedTco?.quantidadeDroga || "");
  const [unidadeMedida, setUnidadeMedida] = useState(selectedTco?.unidadeMedida || "");
  const [pessoasEnvolvidas, setPessoasEnvolvidas] = useState<any[]>([]);
  const [historico, setHistorico] = useState(selectedTco?.historico || "");
  const [startTime, setStartTime] = useState<Date | null>(selectedTco?.startTime?.toDate() || new Date());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [juizadoEspecialData, setJuizadoEspecialData] = useState(selectedTco?.juizadoEspecialData || "");
  const [juizadoEspecialHora, setJuizadoEspecialHora] = useState(selectedTco?.juizadoEspecialHora || "");

  // Add new state for existing TCOs
  const [existingTcos, setExistingTcos] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { toast } = useToast();

  // Add useEffect to fetch existing TCOs
  useEffect(() => {
    const fetchExistingTcos = async () => {
      try {
        const tcosRef = collection(db, "tcos");
        const q = query(tcosRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const tcos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExistingTcos(tcos);
      } catch (error) {
        console.error("Erro ao buscar TCOs existentes:", error);
      }
    };

    fetchExistingTcos();
  }, []);

  const naturezaOptions = [
    "Embriaguez ao volante",
    "Porte de drogas para consumo",
    "Desacato",
    "Dirigir sem CNH",
    "Vias de fato",
    "Dano",
    "Outros"
  ];

  useEffect(() => {
    if (natureza && natureza !== "Outros") {
      switch (natureza) {
        case "Embriaguez ao volante":
          setPenaDescricao("Pena - detenção, de seis meses a três anos, multa e suspensão ou proibição de se obter a permissão ou a habilitação para dirigir veículo automotor.");
          break;
        case "Porte de drogas para consumo":
          setPenaDescricao("Pena - advertência sobre os efeitos das drogas; prestação de serviços à comunidade; medida educativa de comparecimento a programa ou curso educativo.");
          break;
        case "Desacato":
          setPenaDescricao("Pena - detenção, de seis meses a dois anos, ou multa.");
          break;
        case "Dirigir sem CNH":
          setPenaDescricao("Pena - detenção, de seis meses a um ano, ou multa.");
          break;
        case "Vias de fato":
          setPenaDescricao("Pena - prisão simples, de quinze dias a três meses, ou multa, se o fato não constitue crime mais grave.");
          break;
        case "Dano":
          setPenaDescricao("Pena - detenção, de um a seis meses, ou multa.");
          break;
        default:
          setPenaDescricao("");
          break;
      }
    } else {
      setPenaDescricao("");
    }
  }, [natureza]);

  useEffect(() => {
    if (selectedTco) {
      setTcoNumber(selectedTco.tcoNumber || "");
      setNatureza(selectedTco.natureza || "");
      setCustomNatureza(selectedTco.customNatureza || "");
      setGuarnicao(selectedTco.guarnicao || "");
      setAddress(selectedTco.address || "");
      setAddressNumber(selectedTco.addressNumber || "");
      setAddressComplement(selectedTco.addressComplement || "");
      setCity(selectedTco.city || "");
      setEstado(selectedTco.estado || "");
      setBoletimOcorrencia(selectedTco.boletimOcorrencia || "");
      setDrogasApreendidas(selectedTco.drogasApreendidas || false);
      setTipoDroga(selectedTco.tipoDroga || "");
      setQuantidadeDroga(selectedTco.quantidadeDroga || "");
      setUnidadeMedida(selectedTco.unidadeMedida || "");
      setPessoasEnvolvidas(selectedTco.pessoasEnvolvidas || []);
      setHistorico(selectedTco.historico || "");
      setStartTime(selectedTco.startTime?.toDate() || new Date());
      setJuizadoEspecialData(selectedTco.juizadoEspecialData || "");
      setJuizadoEspecialHora(selectedTco.juizadoEspecialHora || "");
    }
  }, [selectedTco]);

  const handleSubmit = async () => {
    if (!tcoNumber || !natureza || (natureza === "Outros" && !customNatureza)) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Número do TCO, Natureza e a Natureza Especifica são obrigatórios."
      });
      return;
    }

    const tcoData = {
      tcoNumber,
      natureza,
      customNatureza,
      guarnicao,
      address,
      addressNumber,
      addressComplement,
      city,
      estado,
      boletimOcorrencia,
      drogasApreendidas,
      tipoDroga,
      quantidadeDroga,
      unidadeMedida,
      pessoasEnvolvidas,
      historico,
      startTime,
      juizadoEspecialData,
      juizadoEspecialHora,
      updatedAt: serverTimestamp(),
      updatedBy: user.id
    };

    try {
      if (selectedTco) {
        // Update existing TCO
        const tcoRef = doc(db, "tcos", selectedTco.id);
        await updateDoc(tcoRef, tcoData);
        toast({
          title: "TCO atualizado!",
          description: "O TCO foi atualizado com sucesso."
        });
      } else {
        // Create new TCO
        await addDoc(collection(db, "tcos"), {
          ...tcoData,
          createdAt: serverTimestamp(),
          createdBy: user.id,
          archived: false
        });
        toast({
          title: "TCO criado!",
          description: "O TCO foi criado com sucesso."
        });
        setTcoNumber("");
        setNatureza("");
        setCustomNatureza("");
        setGuarnicao("");
        setAddress("");
        setAddressNumber("");
        setAddressComplement("");
        setCity("");
        setEstado("");
        setBoletimOcorrencia("");
        setDrogasApreendidas(false);
        setTipoDroga("");
        setQuantidadeDroga("");
        setUnidadeMedida("");
        setPessoasEnvolvidas([]);
        setHistorico("");
        setStartTime(new Date());
        setJuizadoEspecialData("");
        setJuizadoEspecialHora("");
      }
    } catch (error: any) {
      console.error("Error creating/updating TCO:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o TCO."
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex justify-center">
            <TabsTrigger value="basic" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Informações Básicas</TabsTrigger>
            <TabsTrigger value="guarnicao" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Guarnição</TabsTrigger>
            <TabsTrigger value="pessoas" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Pessoas Envolvidas</TabsTrigger>
            <TabsTrigger value="general" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Informações Gerais</TabsTrigger>
            <TabsTrigger value="drogas" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Drogas Apreendidas</TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <BasicInformationTab
              tcoNumber={tcoNumber}
              setTcoNumber={setTcoNumber}
              natureza={natureza}
              setNatureza={setNatureza}
              autor={autor}
              setAutor={setAutor}
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
              existingTcos={existingTcos}
            />
          </TabsContent>

          <TabsContent value="guarnicao">
            <GuarnicaoTab
              guarnicao={guarnicao}
              setGuarnicao={setGuarnicao}
              address={address}
              setAddress={setAddress}
              addressNumber={addressNumber}
              setAddressNumber={setAddressNumber}
              addressComplement={addressComplement}
              setAddressComplement={setAddressComplement}
              city={city}
              setCity={setCity}
              estado={estado}
              setEstado={setEstado}
            />
          </TabsContent>

          <TabsContent value="pessoas">
            <PessoasEnvolvidasTab
              pessoasEnvolvidas={pessoasEnvolvidas}
              setPessoasEnvolvidas={setPessoasEnvolvidas}
            />
          </TabsContent>

          <TabsContent value="general">
            <GeneralInformationTab
              boletimOcorrencia={boletimOcorrencia}
              setBoletimOcorrencia={setBoletimOcorrencia}
              vitimaNome={vitimaNome}
              setVitimaNome={setVitimaNome}
              vitimaDocumento={vitimaDocumento}
              setVitimaDocumento={setVitimaDocumento}
              condutorNome={condutorNome}
              setCondutorNome={setCondutorNome}
              condutorDocumento={condutorDocumento}
              setCondutorDocumento={setCondutorDocumento}
              veiculoMarca={veiculoMarca}
              setVeiculoMarca={setVeiculoMarca}
              veiculoModelo={veiculoModelo}
              setVeiculoModelo={setVeiculoModelo}
              veiculoPlaca={veiculoPlaca}
              setVeiculoPlaca={setVeiculoPlaca}
            />
          </TabsContent>

          <TabsContent value="drogas">
            <DrugVerificationTab
              drogasApreendidas={drogasApreendidas}
              setDrogasApreendidas={setDrogasApreendidas}
              tipoDroga={tipoDroga}
              setTipoDroga={setTipoDroga}
              quantidadeDroga={quantidadeDroga}
              setQuantidadeDroga={setQuantidadeDroga}
              unidadeMedida={unidadeMedida}
              setUnidadeMedida={setUnidadeMedida}
            />
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoTab
              historico={historico}
              setHistorico={setHistorico}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </div>
    </div>
  );
};

export default TCOForm;
