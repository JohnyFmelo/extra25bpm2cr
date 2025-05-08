import React, { useState, useEffect, useCallback } from "react"; // Adicionado useCallback
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
    dataNascimento: string;
    naturalidade: string;
    filiacaoMae: string;
    filiacaoPai: string;
    rg: string;
    cpf: string;
    celular: string;
    email: string;
    laudoPericial: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento: string;
    cidade: string;
    uf: string;
  };
  onChangeHandler: (index: number, field: string, value: string) => void; // index agora é number, não number | null
  prefix?: string;
  index: number; // index é sempre um número aqui
  isAuthor?: boolean;
  isVictim?: boolean;
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

  // console.log(`[${prefix}${index}] Renderizando com data:`, data); // Log para cada render

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCEPInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const validateCPF = (cpf: string) => {
    const stripped = cpf.replace(/\D/g, '');
    if (stripped.length !== 11) {
      setCpfError('CPF deve conter 11 dígitos'); return;
    }
    if (/^(\d)\1+$/.test(stripped)) {
      setCpfError('CPF inválido'); return;
    }
    setCpfError(null);
  };

  const validatePhone = (phone: string) => {
    const stripped = phone.replace(/\D/g, '');
    if (stripped.length !== 11) {
      setPhoneError('Celular deve conter 11 dígitos (com DDD)'); return;
    }
    setPhoneError(null);
  };

  useEffect(() => {
    if (data.dataNascimento && isAuthor) {
      const birthDate = new Date(data.dataNascimento); // Considerar fuso horário se data é string YYYY-MM-DD
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const months = today.getMonth() - birthDate.getMonth();
      const days = today.getDate() - birthDate.getDate();
      if (months < 0 || (months === 0 && days < 0)) {
        years--;
      }
      if (years < 18) {
        let ageMonths = months < 0 ? 12 + months : months;
        let ageDays = days < 0 ? new Date(today.getFullYear(), today.getMonth(), 0).getDate() + days : days;
        if (days < 0 && months !== 0) { // Ajuste se o dia for negativo e não for o mesmo mês
          ageMonths = (ageMonths - 1 + 12) % 12;
        } else if (days <0 && months === 0) { // Se for mesmo mês e dia negativo, subtrai um mês
             ageMonths = 11;
        }

        setAgeWarning(`ATENÇÃO: O Autor é menor de idade (${years} anos, ${ageMonths} meses e ${ageDays} dias). Avalie corretamente se cabe TCO contra esse suspeito.`);
      } else {
        setAgeWarning(null);
      }
    } else {
       setAgeWarning(null); // Limpa o aviso se não for autor ou não tiver data
    }
  }, [data.dataNascimento, isAuthor]);

  const handleCepInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // console.log(`[${prefix}${index}] CEP Input raw: "${rawValue}"`);
    const formattedCep = formatCEPInput(rawValue);
    // console.log(`[${prefix}${index}] CEP Input formatted: "${formattedCep}"`);

    onChangeHandler(index, 'cep', formattedCep);
    
    setCepApiError(null);
    setCepCityNotification(null);

    const cepDigits = formattedCep.replace(/\D/g, '');
    if (cepDigits.length < 8 || rawValue === '') {
      // console.log(`[${prefix}${index}] Limpando campos de endereço pois CEP incompleto/vazio.`);
      onChangeHandler(index, 'endereco', '');
      onChangeHandler(index, 'cidade', '');
      onChangeHandler(index, 'uf', '');
    }
  }, [onChangeHandler, index, prefix]);

  const handleCepSearch = useCallback(async () => {
    const cepToSearch = data.cep.replace(/\D/g, '');
    // console.log(`[${prefix}${index}] Buscando CEP: "${cepToSearch}" (original: "${data.cep}")`);
    if (cepToSearch.length !== 8) {
      setCepApiError("CEP deve conter 8 dígitos.");
      return;
    }

    setCepLoading(true);
    setCepApiError(null);
    setCepCityNotification(null);
    onChangeHandler(index, 'endereco', ''); // Limpa antes da busca
    onChangeHandler(index, 'cidade', '');
    onChangeHandler(index, 'uf', '');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepToSearch}/json/`);
      if (!response.ok) {
        // console.error(`[${prefix}${index}] Erro HTTP API CEP: ${response.status}`);
        throw new Error("Serviço de CEP indisponível. Tente novamente.");
      }
      const apiData = await response.json();
      // console.log(`[${prefix}${index}] API CEP Response:`, apiData);

      if (apiData.erro) {
        setCepApiError("CEP não encontrado ou inválido.");
      } else {
        const newEndereco = `${apiData.logradouro || ''}${apiData.logradouro && apiData.bairro ? ', ' : ''}${apiData.bairro || ''}`;
        // console.log(`[${prefix}${index}] Preenchendo endereço: "${newEndereco.trim()}", Cidade: "${apiData.localidade || ''}", UF: "${apiData.uf || ''}"`);
        onChangeHandler(index, 'endereco', newEndereco.trim());
        onChangeHandler(index, 'cidade', apiData.localidade || '');
        onChangeHandler(index, 'uf', apiData.uf || '');

        if (apiData.localidade && apiData.localidade.toUpperCase() !== "VÁRZEA GRANDE") {
          setCepCityNotification(`Atenção: O CEP ${data.cep} é de ${apiData.localidade} - ${apiData.uf}.`);
        }
      }
    } catch (error) {
      // console.error(`[${prefix}${index}] Erro ao buscar CEP:`, error);
      setCepApiError(error instanceof Error ? error.message : "Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  }, [data.cep, onChangeHandler, index, prefix]);
  
  // Para o campo CEP, usar data.cep diretamente no value. A formatação acontece no onChange.
  // O `maxLength` no input já ajuda a restringir o tamanho.

  return <div className="space-y-4">
      {isAuthor && ageWarning && <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>{ageWarning}</AlertDescription>
        </Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}nome_${index}`}>Nome completo *</Label>
          <Input id={`${prefix}nome_${index}`} value={data.nome} onChange={e => onChangeHandler(index, 'nome', e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${prefix}sexo_${index}`}>Sexo</Label>
          <Select value={data.sexo || ""} onValueChange={value => onChangeHandler(index, 'sexo', value)}>
            <SelectTrigger id={`${prefix}sexo_${index}`}><SelectValue placeholder="Selecione o sexo" /></SelectTrigger>
            <SelectContent><SelectItem value="MASCULINO">Masculino</SelectItem><SelectItem value="FEMININO">Feminino</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}estadoCivil_${index}`}>Estado Civil</Label>
          <Select value={data.estadoCivil || ""} onValueChange={value => onChangeHandler(index, 'estadoCivil', value)}>
            <SelectTrigger id={`${prefix}estadoCivil_${index}`}><SelectValue placeholder="Selecione o estado civil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SOLTEIRO">Solteiro</SelectItem><SelectItem value="UNIÃO ESTÁVEL">União Estável</SelectItem>
              <SelectItem value="CASADO">Casado</SelectItem><SelectItem value="DIVORCIADO">Divorciado</SelectItem>
              <SelectItem value="VIÚVO">Viúvo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${prefix}profissao_${index}`}>Profissão</Label>
          <Input id={`${prefix}profissao_${index}`} value={data.profissao} onChange={e => onChangeHandler(index, 'profissao', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2 border-t pt-4 mt-4">
        <Label className="text-base font-semibold">Endereço da Pessoa</Label>
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor={`${prefix}cep_${index}`}>CEP</Label>
            <Input
              id={`${prefix}cep_${index}`}
              placeholder="00000-000"
              value={data.cep} // O valor vem diretamente do estado pai
              onChange={handleCepInputChange} // Formata e atualiza o estado pai
              maxLength={9}
            />
          </div>
          <Button type="button" onClick={handleCepSearch} disabled={cepLoading || data.cep.replace(/\D/g, '').length !== 8} variant="outline" size="icon" className="mb-px">
            {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {cepApiError && <p className="text-xs text-red-500 mt-1">{cepApiError}</p>}
        {cepCityNotification && <Alert variant="warning" className="mt-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Atenção</AlertTitle><AlertDescription>{cepCityNotification}</AlertDescription></Alert>}
      </div>

      <div>
        <Label htmlFor={`${prefix}endereco_${index}`}>Logradouro, Bairro</Label>
        <Input id={`${prefix}endereco_${index}`} placeholder="Ex: Rua das Palmeiras, Centro" value={data.endereco} onChange={e => onChangeHandler(index, 'endereco', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}numero_${index}`}>Número *</Label>
          <Input id={`${prefix}numero_${index}`} placeholder="Ex: 123 ou S/N" value={data.numero} onChange={e => onChangeHandler(index, 'numero', e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${prefix}complemento_${index}`}>Complemento</Label>
          <Input id={`${prefix}complemento_${index}`} placeholder="Apto, Bloco, Casa (Opcional)" value={data.complemento} onChange={e => onChangeHandler(index, 'complemento', e.target.value)} />
        </div>
      </div>

      {(data.cidade || data.uf) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Cidade (Conforme CEP)</Label><Input value={data.cidade} readOnly disabled className="bg-gray-100 dark:bg-gray-800"/></div>
            <div><Label>UF (Conforme CEP)</Label><Input value={data.uf} readOnly disabled className="bg-gray-100 dark:bg-gray-800"/></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor={`${prefix}dataNascimento_${index}`}>Data de Nascimento</Label><Input id={`${prefix}dataNascimento_${index}`} type="date" value={data.dataNascimento} onChange={e => onChangeHandler(index, 'dataNascimento', e.target.value)} /></div>
        <div><Label htmlFor={`${prefix}naturalidade_${index}`}>Naturalidade</Label><Input id={`${prefix}naturalidade_${index}`} placeholder="MUNICÍPIO" value={data.naturalidade} onChange={e => onChangeHandler(index, 'naturalidade', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor={`${prefix}filiacaoMae_${index}`}>Filiação - Mãe</Label><Input id={`${prefix}filiacaoMae_${index}`} placeholder="NOME COMPLETO" value={data.filiacaoMae} onChange={e => onChangeHandler(index, 'filiacaoMae', e.target.value)} /></div>
        <div><Label htmlFor={`${prefix}filiacaoPai_${index}`}>Filiação - Pai</Label><Input id={`${prefix}filiacaoPai_${index}`} placeholder="NOME COMPLETO" value={data.filiacaoPai} onChange={e => onChangeHandler(index, 'filiacaoPai', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor={`${prefix}rg_${index}`}>RG ou Documento</Label><Input id={`${prefix}rg_${index}`} placeholder="RG 00000000 UF" value={data.rg} onChange={e => onChangeHandler(index, 'rg', e.target.value)} /></div>
        <div>
          <Label htmlFor={`${prefix}cpf_${index}`}>CPF</Label>
          <Input id={`${prefix}cpf_${index}`} placeholder="000.000.000-00" value={data.cpf} onChange={e => onChangeHandler(index, 'cpf', formatCPF(e.target.value))} onBlur={() => validateCPF(data.cpf)} />
          {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}celular_${index}`}>Celular</Label>
          <Input id={`${prefix}celular_${index}`} placeholder="(65) 90000-0000" value={data.celular} onChange={e => onChangeHandler(index, 'celular', formatPhone(e.target.value))} onBlur={() => validatePhone(data.celular)} />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>
        <div><Label htmlFor={`${prefix}email_${index}`}>E-mail</Label><Input id={`${prefix}email_${index}`} type="email" placeholder="contato@exemplo.com" value={data.email} onChange={e => onChangeHandler(index, 'email', e.target.value)} /></div>
      </div>

      {(isAuthor || isVictim) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}laudoPericial_${index}`}>Solicitar Corpo de Delito?</Label>
            <Select value={data.laudoPericial || "Não"} onValueChange={value => onChangeHandler(index, 'laudoPericial', value)}>
              <SelectTrigger id={`${prefix}laudoPericial_${index}`}><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent><SelectItem value="Não">Não</SelectItem><SelectItem value="Sim">Sim</SelectItem></SelectContent>
            </Select>
          </div>
        </div>}
    </div>;
};
export default PersonalInfoFields;
