
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Pessoa {
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
}

interface PersonalInfoFieldsProps {
  pessoa: Pessoa;
  index: number;
  handleChange: (index: number, field: string, value: string) => void;
  isMobile?: boolean;
}

const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({ 
  pessoa, 
  index, 
  handleChange,
  isMobile = false
}) => {
  return (
    <div className="space-y-4">
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor={`nome-${index}`}>Nome Completo</Label>
          <Input
            id={`nome-${index}`}
            value={pessoa.nome}
            onChange={(e) => handleChange(index, "nome", e.target.value)}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <Label htmlFor={`sexo-${index}`}>Sexo</Label>
          <Select
            value={pessoa.sexo}
            onValueChange={(value) => handleChange(index, "sexo", value)}
          >
            <SelectTrigger id={`sexo-${index}`}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor={`estadoCivil-${index}`}>Estado Civil</Label>
          <Select
            value={pessoa.estadoCivil}
            onValueChange={(value) => handleChange(index, "estadoCivil", value)}
          >
            <SelectTrigger id={`estadoCivil-${index}`}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
              <SelectItem value="Casado(a)">Casado(a)</SelectItem>
              <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
              <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
              <SelectItem value="União Estável">União Estável</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`profissao-${index}`}>Profissão</Label>
          <Input
            id={`profissao-${index}`}
            value={pessoa.profissao}
            onChange={(e) => handleChange(index, "profissao", e.target.value)}
            placeholder="Profissão"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`endereco-${index}`}>Endereço</Label>
        <Input
          id={`endereco-${index}`}
          value={pessoa.endereco}
          onChange={(e) => handleChange(index, "endereco", e.target.value)}
          placeholder="Endereço completo"
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor={`dataNascimento-${index}`}>Data de Nascimento</Label>
          <Input
            id={`dataNascimento-${index}`}
            type="date"
            value={pessoa.dataNascimento}
            onChange={(e) => handleChange(index, "dataNascimento", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor={`naturalidade-${index}`}>Naturalidade</Label>
          <Input
            id={`naturalidade-${index}`}
            value={pessoa.naturalidade}
            onChange={(e) => handleChange(index, "naturalidade", e.target.value)}
            placeholder="Cidade/Estado de nascimento"
          />
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor={`filiacaoMae-${index}`}>Nome da Mãe</Label>
          <Input
            id={`filiacaoMae-${index}`}
            value={pessoa.filiacaoMae}
            onChange={(e) => handleChange(index, "filiacaoMae", e.target.value)}
            placeholder="Nome completo da mãe"
          />
        </div>

        <div>
          <Label htmlFor={`filiacaoPai-${index}`}>Nome do Pai</Label>
          <Input
            id={`filiacaoPai-${index}`}
            value={pessoa.filiacaoPai}
            onChange={(e) => handleChange(index, "filiacaoPai", e.target.value)}
            placeholder="Nome completo do pai"
          />
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor={`rg-${index}`}>RG</Label>
          <Input
            id={`rg-${index}`}
            value={pessoa.rg}
            onChange={(e) => handleChange(index, "rg", e.target.value)}
            placeholder="Número do RG"
          />
        </div>

        <div>
          <Label htmlFor={`cpf-${index}`}>CPF</Label>
          <Input
            id={`cpf-${index}`}
            value={pessoa.cpf}
            onChange={(e) => handleChange(index, "cpf", e.target.value)}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label htmlFor={`celular-${index}`}>Celular</Label>
          <Input
            id={`celular-${index}`}
            value={pessoa.celular}
            onChange={(e) => handleChange(index, "celular", e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <Label htmlFor={`email-${index}`}>E-mail</Label>
          <Input
            id={`email-${index}`}
            type="email"
            value={pessoa.email}
            onChange={(e) => handleChange(index, "email", e.target.value)}
            placeholder="exemplo@email.com"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoFields;
