
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tco_form_data';

interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
  apoio?: boolean;
}

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
  relato?: string;
  representacao?: string;
}

export interface TCOFormData {
  tcoNumber: string;
  natureza: string;
  customNatureza: string;
  autor: string;
  representacao: string;
  tipificacao: string;
  penaDescricao: string;
  dataFato: string;
  horaFato: string;
  localFato: string;
  endereco: string;
  comunicante: string;
  guarnicao: string;
  operacao: string;
  apreensoes: string;
  lacreNumero: string;
  componentesGuarnicao: ComponenteGuarnicao[];
  quantidade: string;
  substancia: string;
  cor: string;
  odor: string;
  indicios: string;
  customMaterialDesc: string;
  isUnknownMaterial: boolean;
  juizadoEspecialData: string;
  juizadoEspecialHora: string;
  videoLinks: string[];
  autores: Pessoa[];
  vitimas: Pessoa[];
  testemunhas: Pessoa[];
  providencias: string;
  documentosAnexos: string;
  relatoPolicial: string;
  relatoAutor: string;
  relatoVitima: string;
  relatoTestemunha: string;
  conclusaoPolicial: string;
}

export const useTCOPersistence = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const saveToStorage = useCallback((data: Partial<TCOFormData>) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const currentData = existing ? JSON.parse(existing) : {};
      const updatedData = { ...currentData, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Erro ao salvar dados do formulário:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): Partial<TCOFormData> | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setIsLoaded(true);
        return data;
      }
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
    }
    setIsLoaded(true);
    return null;
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar dados do formulário:', error);
    }
  }, []);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage,
    isLoaded
  };
};
