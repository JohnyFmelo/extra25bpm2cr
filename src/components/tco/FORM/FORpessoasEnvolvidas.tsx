import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserMinus, UserPlus, Users, ShieldQuestion, UserCheck, UserX } from "lucide-react";

// Re-declare interfaces here or import from a shared types file if one is created
// For this exercise, we assume TCOForm.tsx will pass objects matching these structures
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
  laudoPericial: string; // "Sim", "Não", "Não se aplica"
}

interface FORpessoasEnvolvidasProps {
  vitimas: Pessoa[];
  handleVitimaChange: (index: number, field: keyof Pessoa, value: string) => void;
  handleAddVitima: () => void;
  handleRemoveVitima: (index: number) => void;

  testemunhas: Pessoa[];
  handleTestemunhaChange: (index: number, field: keyof Pessoa, value: string) => void;
  handleAddTestemunha: () => void;
  handleRemoveTestemunha: (index: number) => void;

  autores: Pessoa[];
  handleAutorDetalhadoChange: (index: number, field: keyof Pessoa, value: string) => void;
  handleAddAutor: () => void;
  handleRemoveAutor: (index: number) => void;
  natureza: string; // Used to conditionally show laudo pericial
}

const PersonFormFields: React.FC<{
  person: Pessoa;
  onChange: (field: keyof Pessoa, value: string) => void;
  type: 'autor' | 'vitima' | 'testemunha';
  natureza?: string; // Only for vitima/autor for laudoPericial
}> = ({ person, onChange, type, natureza }) => (
  <div className="space-y-3 border p-4 rounded-md">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><Label>Nome Completo</Label><Input value={person.nome} onChange={e => onChange('nome', e.target.value)} /></div>
      <div><Label>Sexo</Label>
        <Select value={person.sexo} onValueChange={v => onChange('sexo', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem><SelectItem value="Outro">Outro</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div><Label>Data de Nascimento</Label><Input type="date" value={person.dataNascimento} onChange={e => onChange('dataNascimento', e.target.value)} /></div>
      <div><Label>Estado Civil</Label><Input value={person.estadoCivil} onChange={e => onChange('estadoCivil', e.target.value)} /></div>
      <div><Label>Profissão</Label><Input value={person.profissao} onChange={e => onChange('profissao', e.target.value)} /></div>
    </div>
    <div><Label>Endereço</Label><Input value={person.endereco} onChange={e => onChange('endereco', e.target.value)} /></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><Label>Naturalidade (Cidade-UF)</Label><Input value={person.naturalidade} onChange={e => onChange('naturalidade', e.target.value)} /></div>
      <div><Label>RG</Label><Input value={person.rg} onChange={e => onChange('rg', e.target.value)} /></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><Label>CPF</Label><Input value={person.cpf} onChange={e => onChange('cpf', e.target.value)} placeholder="000.000.000-00" /></div>
      <div><Label>Celular</Label><Input value={person.celular} onChange={e => onChange('celular', e.target.value)} placeholder="(00) 00000-0000" /></div>
    </div>
    <div><Label>E-mail</Label><Input type="email" value={person.email} onChange={e => onChange('email', e.target.value)} /></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><Label>Filiação (Mãe)</Label><Input value={person.filiacaoMae} onChange={e => onChange('filiacaoMae', e.target.value)} /></div>
      <div><Label>Filiação (Pai)</Label><Input value={person.filiacaoPai} onChange={e => onChange('filiacaoPai', e.target.value)} /></div>
    </div>
    {(type === 'vitima' || type === 'autor') && (natureza === "Lesão Corporal" || natureza === "Vias de Fato" || natureza === "Dano") && (
      <div>
        <Label>Encaminhado para Laudo Pericial?</Label>
        <Select value={person.laudoPericial} onValueChange={v => onChange('laudoPericial', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Sim">Sim</SelectItem>
            <SelectItem value="Não">Não</SelectItem>
            <SelectItem value="Não se aplica">Não se aplica</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
  </div>
);


const FORpessoasEnvolvidas: React.FC<FORpessoasEnvolvidasProps> = ({
  vitimas, handleVitimaChange, handleAddVitima, handleRemoveVitima,
  testemunhas, handleTestemunhaChange, handleAddTestemunha, handleRemoveTestemunha,
  autores, handleAutorDetalhadoChange, handleAddAutor, handleRemoveAutor,
  natureza
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pessoas Envolvidas</CardTitle>
        <CardDescription>Detalhes sobre autores, vítimas e testemunhas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Autores */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><UserX className="mr-2 text-red-600" /> Autor(es) do Fato</h3>
          {autores.map((autor, index) => (
            <div key={index} className="space-y-3 p-3 border rounded-md relative">
              <PersonFormFields person={autor} onChange={(field, value) => handleAutorDetalhadoChange(index, field, value)} type="autor" natureza={natureza} />
              {autores.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => handleRemoveAutor(index)} className="absolute top-2 right-2">
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button onClick={handleAddAutor} variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Adicionar Autor</Button>
        </div>

        {/* Vítimas */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><UserCheck className="mr-2 text-green-600" /> Vítima(s)</h3>
          {vitimas.map((vitima, index) => (
            (vitima.nome !== "" || vitimas.length === 1) && // Show if named or only one (empty) entry
            <div key={index} className="space-y-3 p-3 border rounded-md relative">
              <PersonFormFields person={vitima} onChange={(field, value) => handleVitimaChange(index, field, value)} type="vitima" natureza={natureza} />
              { (vitimas.length > 1 || (vitimas.length === 1 && vitima.nome !== "")) && ( // Allow removal if more than one, or if the single one is not blank
                 <Button variant="destructive" size="sm" onClick={() => handleRemoveVitima(index)} className="absolute top-2 right-2">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )
              }
            </div>
          ))}
           <Button onClick={handleAddVitima} variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Adicionar Vítima</Button>
        </div>

        {/* Testemunhas */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><ShieldQuestion className="mr-2 text-yellow-600" /> Testemunha(s)</h3>
          {testemunhas.map((testemunha, index) => (
            (testemunha.nome !== "" || testemunhas.length === 1) &&
            <div key={index} className="space-y-3 p-3 border rounded-md relative">
              <PersonFormFields person={testemunha} onChange={(field, value) => handleTestemunhaChange(index, field, value)} type="testemunha" />
               { (testemunhas.length > 1 || (testemunhas.length === 1 && testemunha.nome !== "")) && (
                 <Button variant="destructive" size="sm" onClick={() => handleRemoveTestemunha(index)} className="absolute top-2 right-2">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )
              }
            </div>
          ))}
          <Button onClick={handleAddTestemunha} variant="outline" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Adicionar Testemunha</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FORpessoasEnvolvidas;
