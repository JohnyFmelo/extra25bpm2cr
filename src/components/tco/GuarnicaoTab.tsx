
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ComponenteGuarnicaoFields from "./ComponenteGuarnicaoFields";

interface ComponenteGuarnicao {
  rg: string;
  nome: string;
  posto: string;
}

interface GuarnicaoTabProps {
  currentGuarnicaoList: ComponenteGuarnicao[];
  onAddPolicial: (policial: ComponenteGuarnicao) => void;
  onRemovePolicial: (index: number) => void;
}

const GuarnicaoTab = ({
  currentGuarnicaoList,
  onAddPolicial,
  onRemovePolicial
}: GuarnicaoTabProps) => {
  const [rg, setRg] = useState("");
  const [nome, setNome] = useState("");
  const [posto, setPosto] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddPolicial = () => {
    if (rg.trim() && nome.trim() && posto.trim()) {
      onAddPolicial({
        rg: rg.trim(),
        nome: nome.trim(),
        posto: posto.trim()
      });
      setRg("");
      setNome("");
      setPosto("");
      setShowAddForm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guarnição</CardTitle>
        <CardDescription>
          Adicione os membros da guarnição que lavraram o TCO
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentGuarnicaoList.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-medium">Componentes da Guarnição</h3>
            <div className="space-y-4">
              {currentGuarnicaoList.map((policial, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">{policial.posto} {policial.nome}</p>
                    <p className="text-sm text-gray-500">RG: {policial.rg}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemovePolicial(index)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddForm ? (
          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="text-lg font-medium">Adicionar Policial</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="rg">
                    RG
                  </label>
                  <input
                    type="text"
                    id="rg"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="posto">
                    Posto/Graduação
                  </label>
                  <select
                    id="posto"
                    value={posto}
                    onChange={(e) => setPosto(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione...</option>
                    <option value="SD">SD</option>
                    <option value="CB">CB</option>
                    <option value="3º SGT">3º SGT</option>
                    <option value="2º SGT">2º SGT</option>
                    <option value="1º SGT">1º SGT</option>
                    <option value="ST">ST</option>
                    <option value="ASP">ASP</option>
                    <option value="2º TEN">2º TEN</option>
                    <option value="1º TEN">1º TEN</option>
                    <option value="CAP">CAP</option>
                    <option value="MAJ">MAJ</option>
                    <option value="TC">TC</option>
                    <option value="CEL">CEL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="nome">
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddPolicial}
                  disabled={!rg.trim() || !nome.trim() || !posto.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full justify-center"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Policial
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GuarnicaoTab;
