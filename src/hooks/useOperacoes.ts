
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Operacao {
  id: string;
  nome: string;
  ativa: boolean;
  criadaEm: string;
}

const STORAGE_KEY = 'tco_operacoes_ativas';

const operacoesDefault: Operacao[] = [
  {
    id: '1',
    nome: 'Operação Asfixia IV',
    ativa: true,
    criadaEm: new Date().toISOString()
  },
  {
    id: '2', 
    nome: 'Operação Varredura',
    ativa: true,
    criadaEm: new Date().toISOString()
  }
];

export const useOperacoes = () => {
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setOperacoes(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar operações:', error);
        setOperacoes(operacoesDefault);
      }
    } else {
      setOperacoes(operacoesDefault);
    }
  }, []);

  const salvarOperacoes = (novasOperacoes: Operacao[]) => {
    setOperacoes(novasOperacoes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasOperacoes));
  };

  const adicionarOperacao = (nome: string) => {
    if (!nome.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Informe o nome da operação.",
        className: "bg-yellow-600 text-white border-yellow-700",
        duration: 5000
      });
      return false;
    }

    const existe = operacoes.some(op => op.nome.toLowerCase() === nome.toLowerCase());
    if (existe) {
      toast({
        title: "Operação Duplicada",
        description: "Esta operação já existe na lista.",
        className: "bg-yellow-600 text-white border-yellow-700",
        duration: 5000
      });
      return false;
    }

    const novaOperacao: Operacao = {
      id: Date.now().toString(),
      nome: nome.trim(),
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const novasOperacoes = [...operacoes, novaOperacao];
    salvarOperacoes(novasOperacoes);
    
    toast({
      title: "Operação Adicionada",
      description: `"${nome}" foi adicionada à lista.`,
      className: "bg-green-600 text-white border-green-700",
      duration: 5000
    });
    
    return true;
  };

  const removerOperacao = (id: string) => {
    const operacao = operacoes.find(op => op.id === id);
    if (!operacao) return;

    const novasOperacoes = operacoes.filter(op => op.id !== id);
    salvarOperacoes(novasOperacoes);
    
    toast({
      title: "Operação Removida",
      description: `"${operacao.nome}" foi removida da lista.`,
      className: "bg-green-600 text-white border-green-700",
      duration: 5000
    });
  };

  const toggleOperacao = (id: string) => {
    const novasOperacoes = operacoes.map(op => 
      op.id === id ? { ...op, ativa: !op.ativa } : op
    );
    salvarOperacoes(novasOperacoes);
  };

  const operacoesAtivas = operacoes.filter(op => op.ativa);

  return {
    operacoes,
    operacoesAtivas,
    adicionarOperacao,
    removerOperacao,
    toggleOperacao
  };
};
