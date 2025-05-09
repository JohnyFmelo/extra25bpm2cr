// src/components/tco/GuarnicaoTab.tsx
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import supabase from "@/lib/supabaseClient";

interface GuarnicaoTabProps {
  guarnicao: string;
  setGuarnicao: (guarnicao: string) => void;
  operacao: string;
  setOperacao: (operacao: string) => void;
  componentes: { id: string; nome: string }[];
  setComponentes: (componentes: { id: string; nome: string }[]) => void;
	onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const GuarnicaoTab = ({
  guarnicao,
  setGuarnicao,
  operacao,
  setOperacao,
  componentes,
  setComponentes,
	onKeyDown
}: GuarnicaoTabProps) => {
  const [newComponente, setNewComponente] = useState("");
  const [selectedComponente, setSelectedComponente] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleGuarnicaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuarnicao(e.target.value);
  };

  const handleOperacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOperacao(e.target.value);
  };

  const handleNewComponenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComponente(e.target.value);
  };

  const handleAddComponente = () => {
    if (newComponente.trim() !== "") {
      setIsAdding(true);
      const newId = Math.random().toString(36).substring(2, 15);
      const newComponenteObj = { id: newId, nome: newComponente.trim() };
      setComponentes([...componentes, newComponenteObj]);
      setNewComponente("");
      setIsAdding(false);
    }
  };

  const handleDeleteComponente = (id: string) => {
    setIsDeleting(true);
    setComponentes(componentes.filter((componente) => componente.id !== id));
    setIsDeleting(false);
  };

  const handleComponenteSelect = (value: string) => {
    setSelectedComponente(value);
		// Capture onKeyDown event for the select component
		if (onKeyDown) {
			onKeyDown({ key: "Tab" } as any);
		}
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="guarnicao" className="block text-sm font-medium text-gray-700">
          Guarnição
        </label>
        <Input
          type="text"
          id="guarnicao"
          value={guarnicao}
          onChange={handleGuarnicaoChange}
					onKeyDown={onKeyDown}
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="operacao" className="block text-sm font-medium text-gray-700">
          Operação
        </label>
        <Input
          type="text"
          id="operacao"
          value={operacao}
          onChange={handleOperacaoChange}
					onKeyDown={onKeyDown}
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="componentes" className="block text-sm font-medium text-gray-700">
          Componentes
        </label>
        <div className="flex items-center space-x-2 mt-1">
          <Input
            type="text"
            id="newComponente"
            value={newComponente}
            onChange={handleNewComponenteChange}
						onKeyDown={onKeyDown}
            placeholder="Novo Componente"
            className="flex-grow"
          />
          <Button type="button" onClick={handleAddComponente} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        <div className="mt-2 space-y-1">
          {componentes.map((componente) => (
            <div key={componente.id} className="flex items-center justify-between">
              <Badge variant="secondary">{componente.nome}</Badge>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleDeleteComponente(componente.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuarnicaoTab;
