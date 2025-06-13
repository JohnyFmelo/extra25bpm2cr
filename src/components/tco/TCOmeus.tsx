import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, FileText, X } from 'lucide-react';
import TCOForm from './TCOForm';
import { dataOperations } from '@/lib/firebase';
import { TimeSlot } from '@/types/user';
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { TCORankingChart } from './TCORankingChart';

const TCOMeus = () => {
  const [tcos, setTCOs] = useState<TimeSlot[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTCO, setEditingTCO] = useState<TimeSlot | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTCOs();
  }, []);

  const fetchTCOs = async () => {
    try {
      const data = await dataOperations.fetch();
      setTCOs(data);
    } catch (error) {
      console.error("Failed to fetch TCOs:", error);
      toast({
        title: "Erro ao carregar TCOs",
        description: "Houve um problema ao buscar os TCOs do servidor.",
        variant: "destructive",
      })
    }
  };

  const handleSave = async (tcoData: TimeSlot) => {
    try {
      if (editingTCO) {
        // Update existing TCO
        await dataOperations.update(tcoData, {
          date: editingTCO.date,
          start_time: editingTCO.start_time,
          end_time: editingTCO.end_time
        });
        toast({
          title: "TCO atualizado com sucesso!",
          description: "As informações do TCO foram atualizadas.",
        })
      } else {
        // Create new TCO
        await dataOperations.insert(tcoData);
        toast({
          title: "TCO criado com sucesso!",
          description: "Um novo TCO foi adicionado à sua lista.",
        })
      }
      fetchTCOs(); // Refresh TCO list
      setShowForm(false);
      setEditingTCO(null);
    } catch (error) {
      console.error("Failed to save TCO:", error);
      toast({
        title: "Erro ao salvar TCO",
        description: "Houve um problema ao salvar o TCO. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  };

  const handleEdit = (tco: TimeSlot) => {
    setEditingTCO(tco);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Find the TCO to be deleted
      const tcoToDelete = tcos.find(tco => tco.id === id);
      if (!tcoToDelete) {
        console.error("TCO not found for deletion");
        toast({
          title: "Erro ao excluir TCO",
          description: "TCO não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Delete the TCO
      await dataOperations.delete({
        date: tcoToDelete.date,
        start_time: tcoToDelete.start_time,
        end_time: tcoToDelete.end_time
      });
      fetchTCOs(); // Refresh TCO list
      toast({
        title: "TCO excluído com sucesso!",
        description: "O TCO foi removido da sua lista.",
      });
    } catch (error) {
      console.error("Failed to delete TCO:", error);
      toast({
        title: "Erro ao excluir TCO",
        description: "Houve um problema ao excluir o TCO. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleViewPDF = (tco: TimeSlot) => {
    // Placeholder for PDF viewing logic
    console.log('View PDF for TCO:', tco);
    toast({
      title: "Visualizar PDF",
      description: "Funcionalidade de visualização de PDF em desenvolvimento.",
    })
  };

  const filteredTCOs = tcos.filter(tco =>
    Object.values(tco).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meus TCOs</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo TCO
        </Button>
      </div>

      {/* Adicionar o gráfico de ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Lista de TCOs existente */}
          <div className="space-y-4">
            {filteredTCOs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum TCO encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              filteredTCOs.map((tco) => (
                <Card key={tco.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">TCO #{tco.tcoNumber}</CardTitle>
                        <CardDescription>
                          {tco.natureza} - {new Date(tco.dataOcorrencia).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tco)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(tco.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPDF(tco)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Local:</strong> {tco.localOcorrencia}
                      </div>
                      <div>
                        <strong>Horário:</strong> {tco.horaOcorrencia}
                      </div>
                      {tco.autores?.[0]?.nome && (
                        <div>
                          <strong>Autor:</strong> {tco.autores[0].nome}
                        </div>
                      )}
                      {tco.vitimas?.[0]?.nome && (
                        <div>
                          <strong>Vítima:</strong> {tco.vitimas[0].nome}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Gráfico de ranking na lateral */}
        <div className="space-y-4">
          <TCORankingChart tcoData={tcos} />
          
          {/* Card com estatísticas rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total de TCOs:</span>
                <Badge variant="secondary">{tcos.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Este mês:</span>
                <Badge variant="secondary">
                  {tcos.filter(tco => {
                    const tcoDate = new Date(tco.dataOcorrencia);
                    const now = new Date();
                    return tcoDate.getMonth() === now.getMonth() && 
                           tcoDate.getFullYear() === now.getFullYear();
                  }).length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Natureza mais comum:</span>
                <Badge variant="outline" className="text-xs">
                  {tcos.length > 0 ? 
                    Object.entries(
                      tcos.reduce((acc, tco) => {
                        acc[tco.natureza] = (acc[tco.natureza] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"
                    : "N/A"
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal do formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingTCO ? 'Editar TCO' : 'Novo TCO'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingTCO(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <TCOForm
                initialData={editingTCO}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTCO(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCOMeus;
