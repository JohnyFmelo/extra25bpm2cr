
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, CheckCheck, Copy, CopyCheck, ShieldAlert, ShieldCheck, User, UserPlus, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { InputMask } from '@react-input/mask';
import GuarnicaoTab from "./tco/GuarnicaoTab";
import { supabase } from "@/lib/supabaseClient";

// --- Funções Auxiliares ---
const somenteNumeros = (value: string | null | undefined): string => {
  return value?.replace(/\D/g, '') || '';
};
const formatarCPF = (value: string): string => {
  const numeros = somenteNumeros(value);
  let cpfFormatado = numeros.slice(0, 11);
  cpfFormatado = cpfFormatado.replace(/^(\d{3})(\d)/, '$1.$2');
  cpfFormatado = cpfFormatado.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
  cpfFormatado = cpfFormatado.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  return cpfFormatado;
};
const formatarCelular = (value: string): string => {
  const numeros = somenteNumeros(value);
  let foneFormatado = numeros.slice(0, 11);
  if (foneFormatado.length === 11) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (foneFormatado.length === 10) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (foneFormatado.length > 6) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (foneFormatado.length > 2) {
    foneFormatado = foneFormatado.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  }
  return foneFormatado;
};
const validateCPF = (cpf: string) => {
  cpf = somenteNumeros(cpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cpf.charAt(10));
};

// --- Interfaces ---
interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cpf?: string;
  telefone?: string;
  apoio?: boolean; // Novo campo para status de apoio
}
interface PoliceOfficerSearchResult {
  nome: string | null;
  graduacao: string | null;
  pai: string | null;
  mae: string | null;
  naturalidade: string | null;
  cpf: string | null;
  telefone: string | null;
}
interface PoliceOfficerFormData {
  rgpm: string;
  nome: string;
  graduacao: string;
  pai: string;
  mae: string;
  naturalidade: string;
  cpf: string;
  telefone: string;
}

const initialOfficerFormData: PoliceOfficerFormData = {
  rgpm: "",
  nome: "",
  graduacao: "",
  pai: "",
  mae: "",
  naturalidade: "",
  cpf: "",
  telefone: ""
};
const graduacoes = ["SD PM", "CB PM", "3º SGT PM", "2º SGT PM", "1º SGT PM", "SUB TEN PM", "ASPIRANTE PM", "2º TEN PM", "1º TEN PM", "CAP PM", "MAJ PM", "TEN CEL PM", "CEL PM"];

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
})

const TCOForm = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(2023, 0, 10),
    to: new Date(2023, 0, 20),
  })
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [guarnicaoList, setGuarnicaoList] = useState<ComponenteGuarnicao[]>([]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  const handleAddPolicial = (novoPolicial: ComponenteGuarnicao) => {
    console.log("[TCOForm] Recebido novo policial:", novoPolicial);
    setGuarnicaoList(prevList => [...prevList, novoPolicial]);
  };

  const handleRemovePolicial = (indexToRemove: number) => {
    console.log("[TCOForm] Removendo policial no índice:", indexToRemove);
    setGuarnicaoList(prevList => {
      const newList = [...prevList];
      newList.splice(indexToRemove, 1);
      return newList;
    });
  };

  const handleToggleApoioPolicial = (index: number) => {
    // Create a copy of the current guarnicao list
    const updatedGuarnicao = [...guarnicaoList];
    
    // Toggle the apoio property for the component at the specified index
    updatedGuarnicao[index] = {
      ...updatedGuarnicao[index],
      apoio: !updatedGuarnicao[index].apoio
    };
    
    // Update the state with the new guarnicao list
    setGuarnicaoList(updatedGuarnicao);
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <h1 className="text-3xl font-semibold mb-4">Formulário de TCO</h1>

      {/* Guarnição Tab */}
      <Card className="mb-4">
        <GuarnicaoTab
          currentGuarnicaoList={guarnicaoList}
          onAddPolicial={handleAddPolicial}
          onRemovePolicial={handleRemovePolicial}
          onToggleApoioPolicial={handleToggleApoioPolicial}
        />
      </Card>

      {/* Card de Dados Gerais */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Dados Gerais</CardTitle>
          <CardDescription>Informações básicas do TCO</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data do Fato */}
            <div>
              <Label htmlFor="dataFato">Data do Fato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário do Fato */}
            <div>
              <Label htmlFor="horarioFato">Horário do Fato</Label>
              <Input
                type="time"
                id="horarioFato"
                className="w-full"
              />
            </div>
          </div>

          {/* Endereço do Fato */}
          <div>
            <Label htmlFor="enderecoFato">Endereço do Fato</Label>
            <Input
              type="text"
              id="enderecoFato"
              placeholder="Rua, número, bairro, cidade"
              className="w-full"
            />
          </div>

          {/* Descrição do Fato */}
          <div>
            <Label htmlFor="descricaoFato">Descrição do Fato</Label>
            <Textarea
              id="descricaoFato"
              placeholder="Descreva o fato ocorrido"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card de Envolvidos */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Envolvidos</CardTitle>
          <CardDescription>Informações sobre os envolvidos no TCO</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Abas para Tipos de Envolvidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Envolvido 1 */}
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-semibold mb-2">Envolvido 1</h3>
              <Label htmlFor="nomeEnvolvido1">Nome</Label>
              <Input type="text" id="nomeEnvolvido1" className="w-full mb-2" />

              <Label htmlFor="cpfEnvolvido1">CPF</Label>
              <InputMask
                mask="000.000.000-00"
                type="text"
                id="cpfEnvolvido1"
                className="w-full mb-2"
              />

              <Label htmlFor="telefoneEnvolvido1">Telefone</Label>
              <InputMask
                mask="(00) 00000-0000"
                type="text"
                id="telefoneEnvolvido1"
                className="w-full mb-2"
              />

              <Label htmlFor="enderecoEnvolvido1">Endereço</Label>
              <Input type="text" id="enderecoEnvolvido1" className="w-full mb-2" />
            </div>

            {/* Envolvido 2 */}
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-semibold mb-2">Envolvido 2</h3>
              <Label htmlFor="nomeEnvolvido2">Nome</Label>
              <Input type="text" id="nomeEnvolvido2" className="w-full mb-2" />

              <Label htmlFor="cpfEnvolvido2">CPF</Label>
              <InputMask
                mask="000.000.000-00"
                type="text"
                id="cpfEnvolvido2"
                className="w-full mb-2"
              />

              <Label htmlFor="telefoneEnvolvido2">Telefone</Label>
              <InputMask
                mask="(00) 00000-0000"
                type="text"
                id="telefoneEnvolvido2"
                className="w-full mb-2"
              />

              <Label htmlFor="enderecoEnvolvido2">Endereço</Label>
              <Input type="text" id="enderecoEnvolvido2" className="w-full mb-2" />
            </div>

            {/* Envolvido 3 */}
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-semibold mb-2">Envolvido 3</h3>
              <Label htmlFor="nomeEnvolvido3">Nome</Label>
              <Input type="text" id="nomeEnvolvido3" className="w-full mb-2" />

              <Label htmlFor="cpfEnvolvido3">CPF</Label>
              <InputMask
                mask="000.000.000-00"
                type="text"
                id="cpfEnvolvido3"
                className="w-full mb-2"
              />

              <Label htmlFor="telefoneEnvolvido3">Telefone</Label>
              <InputMask
                mask="(00) 00000-0000"
                type="text"
                id="telefoneEnvolvido3"
                className="w-full mb-2"
              />

              <Label htmlFor="enderecoEnvolvido3">Endereço</Label>
              <Input type="text" id="enderecoEnvolvido3" className="w-full mb-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Testemunhas */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Testemunhas</CardTitle>
          <CardDescription>Informações sobre as testemunhas do TCO</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Testemunha 1 */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">Testemunha 1</h3>
            <Label htmlFor="nomeTestemunha1">Nome</Label>
            <Input type="text" id="nomeTestemunha1" className="w-full mb-2" />

            <Label htmlFor="cpfTestemunha1">CPF</Label>
            <InputMask
              mask="000.000.000-00"
              type="text"
              id="cpfTestemunha1"
              className="w-full mb-2"
            />

            <Label htmlFor="telefoneTestemunha1">Telefone</Label>
            <InputMask
              mask="(00) 00000-0000"
              type="text"
              id="telefoneTestemunha1"
              className="w-full mb-2"
            />

            <Label htmlFor="enderecoTestemunha1">Endereço</Label>
            <Input type="text" id="enderecoTestemunha1" className="w-full mb-2" />
          </div>

          {/* Testemunha 2 */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">Testemunha 2</h3>
            <Label htmlFor="nomeTestemunha2">Nome</Label>
            <Input type="text" id="nomeTestemunha2" className="w-full mb-2" />

            <Label htmlFor="cpfTestemunha2">CPF</Label>
            <InputMask
              mask="000.000.000-00"
              type="text"
              id="cpfTestemunha2"
              className="w-full mb-2"
            />

            <Label htmlFor="telefoneTestemunha2">Telefone</Label>
            <InputMask
              mask="(00) 00000-0000"
              type="text"
              id="telefoneTestemunha2"
              className="w-full mb-2"
            />

            <Label htmlFor="enderecoTestemunha2">Endereço</Label>
            <Input type="text" id="enderecoTestemunha2" className="w-full mb-2" />
          </div>
        </CardContent>
      </Card>

      {/* Card de Materiais Apreendidos */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Materiais Apreendidos</CardTitle>
          <CardDescription>Lista de materiais apreendidos no TCO</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Material 1 */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">Material 1</h3>
            <Label htmlFor="descricaoMaterial1">Descrição</Label>
            <Input type="text" id="descricaoMaterial1" className="w-full mb-2" />

            <Label htmlFor="quantidadeMaterial1">Quantidade</Label>
            <Input type="number" id="quantidadeMaterial1" className="w-full mb-2" />
          </div>

          {/* Material 2 */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">Material 2</h3>
            <Label htmlFor="descricaoMaterial2">Descrição</Label>
            <Input type="text" id="descricaoMaterial2" className="w-full mb-2" />

            <Label htmlFor="quantidadeMaterial2">Quantidade</Label>
            <Input type="number" id="quantidadeMaterial2" className="w-full mb-2" />
          </div>
        </CardContent>
      </Card>

      {/* Card de Observações */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Observações</CardTitle>
          <CardDescription>Observações adicionais sobre o TCO</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Adicione observações relevantes"
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Botão de Envio */}
      <Button className="w-full">
        Enviar TCO
      </Button>
    </div>
  );
};

export default TCOForm;
