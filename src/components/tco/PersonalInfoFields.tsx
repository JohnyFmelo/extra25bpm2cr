import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonalInfoFieldsProps {
  data: {
    nome: string;
    sexo: string;
    estadoCivil: string;
    profissao: string;
    // endereco: string; // Original: RUA, NÚMERO/QUADRA/LOTE, BAIRRO
    dataNascimento: string;
    naturalidade: string;
    filiacaoMae: string;
    filiacaoPai: string;
    rg: string;
    cpf: string;
    celular: string;
    email: string;
    laudoPericial: string; // Novo campo: "Sim" ou "Não"

    // Campos de endereço atualizados/novos
    cep: string;
    endereco: string; // Armazenará Logradouro, Bairro
    numero: string;
    complemento: string;
    cidade: string; // Armazenará a cidade do CEP
    uf: string;     // Armazenará o UF do CEP
  };
  onChangeHandler: (index: number | null, field: string, value: string) => void;
  prefix?: string;
  index: number;
  isAuthor?: boolean;
  isVictim?: boolean; // Novo prop para Vítimas
}
const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  data,
  onChangeHandler,
  prefix = "",
  index,
  isAuthor = false,
  isVictim = false
}) => {
  const [ageWarning, setAgeWarning] = useState<string | null>(null);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepApiError, setCepApiError] = useState<string | null>(null);
  const [cepCityNotification, setCepCityNotification] = useState<string | null>(null);

  // Format CPF: 000.000.000-00
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Format phone: (00) 00000-0000
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Format CEP input: 00000-000
  const formatCEPInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Validate CPF
  const validateCPF = (cpf: string) => {
    const stripped = cpf.replace(/\D/g, '');
    if (stripped.length !== 11) {
      setCpfError('CPF deve conter 11 dígitos');
      return;
    }

    // Check for repeated digits (simple validation)
    if (/^(\d)\1+$/.test(stripped)) {
      setCpfError('CPF inválido');
      return;
    }
    setCpfError(null);
  };

  // Validate phone number
  const validatePhone = (phone: string) => {
    const stripped = phone.replace(/\D/g, '');
    if (stripped.length !== 11) {
      setPhoneError('Celular deve conter 11 dígitos (com DDD)');
      return;
    }
    setPhoneError(null);
  };

  // Calculate age from birthdate
  useEffect(() => {
    if (data.dataNascimento && isAuthor) {
      const birthDate = new Date(data.dataNascimento);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const months = today.getMonth() - birthDate.getMonth();
      const days = today.getDate() - birthDate.getDate();
      if (months < 0 || months === 0 && days < 0) {
        years--;
      }
      if (years < 18) {
        // Calculate exact age in years, months and days
        let ageMonths = months < 0 ? 12 + months : months;
        let ageDays = days < 0 ? new Date(today.getFullYear(), today.getMonth(), 0).getDate() + days : days;
        if (days < 0) {
          ageMonths--;
          if (ageMonths < 0) ageMonths = 11;
        }
        setAgeWarning(`ATENÇÃO: O Autor é menor de idade (${years} anos, ${ageMonths} meses e ${ageDays} dias). Avalie corretamente se cabe TCO contra esse suspeito.`);
      } else {
        setAgeWarning(null);
      }
    }
  }, [data.dataNascimento, isAuthor]);

  const handleCepInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCep = formatCEPInput(e.target.value);
    onChangeHandler(index !== undefined ? index : null, 'cep', formattedCep);
    setCepApiError(null);
    setCepCityNotification(null);
    // Clear address fields if CEP is being re-typed and is not yet complete or was shortened
    if (e.target.value.length < data.cep.length || e.target.value.replace(/\D/g, '').length < 8) {
        onChangeHandler(index !== undefined ? index : null, 'endereco', '');
        onChangeHandler(index !== undefined ? index : null, 'cidade', '');
        onChangeHandler(index !== undefined ? index : null, 'uf', '');
    }
  };

  const handleCepSearch = async () => {
    const cepToSearch = data.cep.replace(/\D/g, '');
    if (cepToSearch.length !== 8) {
      setCepApiError("CEP deve conter 8 dígitos.");
      return;
    }

    setCepLoading(true);
    setCepApiError(null);
    setCepCityNotification(null);
    // Clear previous address info before new search
    onChangeHandler(index !== undefined ? index : null, 'endereco', '');
    onChangeHandler(index !== undefined ? index : null, 'cidade', '');
    onChangeHandler(index !== undefined ? index : null, 'uf', '');
    // onChangeHandler(index !== undefined ? index : null, 'numero', ''); // User might want to keep numero
    // onChangeHandler(index !== undefined ? index : null, 'complemento', ''); // User might want to keep complemento

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepToSearch}/json/`);
      if (!response.ok) {
        throw new Error("Serviço de CEP indisponível. Tente novamente.");
      }
      const apiData = await response.json();

      if (apiData.erro) {
        setCepApiError("CEP não encontrado ou inválido.");
      } else {
        const newEndereco = `${apiData.logradouro || ''}${apiData.logradouro && apiData.bairro ? ', ' : ''}${apiData.bairro || ''}`;
        onChangeHandler(index !== undefined ? index : null, 'endereco', newEndereco.trim());
        onChangeHandler(index !== undefined ? index : null, 'cidade', apiData.localidade || '');
        onChangeHandler(index !== undefined ? index : null, 'uf', apiData.uf || '');

        if (apiData.localidade && apiData.localidade.toUpperCase() !== "VÁRZEA GRANDE") {
          setCepCityNotification(`Atenção: O CEP ${data.cep} é de ${apiData.localidade} - ${apiData.uf}.`);
        }
      }
    } catch (error) {
      setCepApiError(error instanceof Error ? error.message : "Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  return <div className="space-y-4">
      {isAuthor && ageWarning && <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            {ageWarning}
          </AlertDescription>
        </Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}nome_${index}`}>Nome completo *</Label>
          <Input id={`${prefix}nome_${index}`} value={data.nome} onChange={e => onChangeHandler(index !== undefined ? index : null, 'nome', e.target.value)} />
        </div>
        
        <div>
          <Label htmlFor={`${prefix}sexo_${index}`}>Sexo</Label>
          <Select value={data.sexo || ""} onValueChange={value => onChangeHandler(index !== undefined ? index : null, 'sexo', value)}>
            <SelectTrigger id={`${prefix}sexo_${index}`}>
              <SelectValue placeholder="Selecione o sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MASCULINO">Masculino</SelectItem>
              <SelectItem value="FEMININO">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}estadoCivil_${index}`}>Estado Civil</Label>
          <Select value={data.estadoCivil || ""} onValueChange={value => onChangeHandler(index !== undefined ? index : null, 'estadoCivil', value)}>
            <SelectTrigger id={`${prefix}estadoCivil_${index}`}>
              <SelectValue placeholder="Selecione o estado civil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOLTEIRO">Solteiro</SelectItem>
              <SelectItem value="UNIÃO ESTÁVEL">União Estável</SelectItem>
              <SelectItem value="CASADO">Casado</SelectItem>
              <SelectItem value="DIVORCIADO">Divorciado</SelectItem>
              <SelectItem value="VIÚVO">Viúvo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor={`${prefix}profissao_${index}`}>Profissão</Label>
          <Input id={`${prefix}profissao_${index}`} value={data.profissao} onChange={e => onChangeHandler(index !== undefined ? index : null, 'profissao', e.target.value)} />
        </div>
      </div>

      {/* Seção de Endereço com CEP */}
      <div className="space-y-2 border-t pt-4 mt-4"> {/* Adicionado mt-4 para separar visualmente */}
        <Label className="text-base font-semibold">Endereço da Pessoa</Label> {/* Título da seção */}
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor={`${prefix}cep_${index}`}>CEP</Label>
            <Input
              id={`${prefix}cep_${index}`}
              placeholder="00000-000"
              value={data.cep}
              onChange={handleCepInputChange}
              maxLength={9} // "00000-000"
            />
          </div>
          <Button 
            type="button" 
            onClick={handleCepSearch} 
            disabled={cepLoading || data.cep.replace(/\D/g, '').length !== 8} 
            variant="outline" 
            size="icon" 
            className="mb-px" // Alinha com a base do input
          >
            {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {cepApiError && <p className="text-xs text-red-500 mt-1">{cepApiError}</p>}
        {cepCityNotification && (
          <Alert variant="warning" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>{cepCityNotification}</AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <Label htmlFor={`${prefix}endereco_${index}`}>Logradouro, Bairro</Label>
        <Input
          id={`${prefix}endereco_${index}`}
          placeholder="Ex: Rua das Palmeiras, Centro (Preenchido pelo CEP)"
          value={data.endereco}
          onChange={e => onChangeHandler(index !== undefined ? index : null, 'endereco', e.target.value)}
          // Considerar readOnly={!!data.cidade && !cepApiError} se o preenchimento for estritamente via CEP
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}numero_${index}`}>Número *</Label>
          <Input id={`${prefix}numero_${index}`} placeholder="Ex: 123 ou S/N" value={data.numero} onChange={e => onChangeHandler(index !== undefined ? index : null, 'numero', e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${prefix}complemento_${index}`}>Complemento</Label>
          <Input id={`${prefix}complemento_${index}`} placeholder="Apto, Bloco, Casa (Opcional)" value={data.complemento} onChange={e => onChangeHandler(index !== undefined ? index : null, 'complemento', e.target.value)} />
        </div>
      </div>

      {(data.cidade || data.uf) && ( // Mostra cidade/UF se preenchido pelo CEP
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label>Cidade (Conforme CEP)</Label>
                <Input value={data.cidade} readOnly disabled className="bg-gray-100 dark:bg-gray-800"/>
            </div>
            <div>
                <Label>UF (Conforme CEP)</Label>
                <Input value={data.uf} readOnly disabled className="bg-gray-100 dark:bg-gray-800"/>
            </div>
        </div>
      )}
      {/* Fim da Seção de Endereço com CEP */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}dataNascimento_${index}`}>Data de Nascimento</Label>
          <Input id={`${prefix}dataNascimento_${index}`} type="date" value={data.dataNascimento} onChange={e => onChangeHandler(index !== undefined ? index : null, 'dataNascimento', e.target.value)} />
        </div>
        
        <div>
          <Label htmlFor={`${prefix}naturalidade_${index}`}>Naturalidade</Label>
          <Input id={`${prefix}naturalidade_${index}`} placeholder="MUNICÍPIO" value={data.naturalidade} onChange={e => onChangeHandler(index !== undefined ? index : null, 'naturalidade', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}filiacaoMae_${index}`}>Filiação - Mãe</Label>
          <Input id={`${prefix}filiacaoMae_${index}`} placeholder="NOME COMPLETO" value={data.filiacaoMae} onChange={e => onChangeHandler(index !== undefined ? index : null, 'filiacaoMae', e.target.value)} />
        </div>
        
        <div>
          <Label htmlFor={`${prefix}filiacaoPai_${index}`}>Filiação - Pai</Label>
          <Input id={`${prefix}filiacaoPai_${index}`} placeholder="NOME COMPLETO" value={data.filiacaoPai} onChange={e => onChangeHandler(index !== undefined ? index : null, 'filiacaoPai', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}rg_${index}`}>RG ou Documento</Label>
          <Input id={`${prefix}rg_${index}`} placeholder="RG 00000000 UF" value={data.rg} onChange={e => onChangeHandler(index !== undefined ? index : null, 'rg', e.target.value)} />
        </div>
        
        <div>
          <Label htmlFor={`${prefix}cpf_${index}`}>CPF</Label>
          <Input id={`${prefix}cpf_${index}`} placeholder="000.000.000-00" value={data.cpf} onChange={e => {
          const formatted = formatCPF(e.target.value);
          onChangeHandler(index !== undefined ? index : null, 'cpf', formatted);
        }} onBlur={() => validateCPF(data.cpf)} />
          {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}celular_${index}`}>Celular</Label>
          <Input id={`${prefix}celular_${index}`} placeholder="(65) 90000-0000" value={data.celular} onChange={e => {
          const formatted = formatPhone(e.target.value);
          onChangeHandler(index !== undefined ? index : null, 'celular', formatted);
        }} onBlur={() => validatePhone(data.celular)} />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>
        
        <div>
          <Label htmlFor={`${prefix}email_${index}`}>E-mail</Label>
          <Input id={`${prefix}email_${index}`} type="email" placeholder="contato@exemplo.com" value={data.email} onChange={e => onChangeHandler(index !== undefined ? index : null, 'email', e.target.value)} />
        </div>
      </div>

      {(isAuthor || isVictim) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}laudoPericial_${index}`}>Solicitar Corpo de Delito?</Label>
            <Select value={data.laudoPericial || "Não"} onValueChange={value => onChangeHandler(index !== undefined ? index : null, 'laudoPericial', value)}>
              <SelectTrigger id={`${prefix}laudoPericial_${index}`}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Não">Não</SelectItem>
                <SelectItem value="Sim">Sim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>}
    </div>;
};
export default PersonalInfoFields;
