
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, Trash } from 'lucide-react';
import { useOperacoes } from '@/hooks/useOperacoes';

interface OperacoesManagerProps {
  onSelectOperacao: (operacao: string) => void;
  valorAtual: string;
}

const OperacoesManager: React.FC<OperacoesManagerProps> = ({ onSelectOperacao, valorAtual }) => {
  const { operacoes, operacoesAtivas, adicionarOperacao, removerOperacao, toggleOperacao } = useOperacoes();
  const [novaOperacao, setNovaOperacao] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);

  const handleAdicionarOperacao = () => {
    if (adicionarOperacao(novaOperacao)) {
      setNovaOperacao('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdicionarOperacao();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label htmlFor="operacao">OPERAÇÃO</Label>
        <div className="flex gap-1">
          <Input 
            id="operacao" 
            placeholder="Digite ou selecione uma operação"
            value={valorAtual} 
            onChange={e => onSelectOperacao(e.target.value)}
            list="operacoes-list"
          />
          <datalist id="operacoes-list">
            {operacoesAtivas.map(operacao => (
              <option key={operacao.id} value={operacao.nome} />
            ))}
          </datalist>
          
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                title="Gerenciar operações"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerenciar Operações</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da nova operação"
                    value={novaOperacao}
                    onChange={e => setNovaOperacao(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button 
                    onClick={handleAdicionarOperacao}
                    size="icon"
                    disabled={!novaOperacao.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <Label className="text-sm font-medium">Operações Cadastradas:</Label>
                  {operacoes.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma operação cadastrada.</p>
                  ) : (
                    operacoes.map(operacao => (
                      <div key={operacao.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2 flex-1">
                          <Switch
                            checked={operacao.ativa}
                            onCheckedChange={() => toggleOperacao(operacao.id)}
                          />
                          <span className={`text-sm ${operacao.ativa ? 'text-black' : 'text-gray-500'}`}>
                            {operacao.nome}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerOperacao(operacao.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default OperacoesManager;
