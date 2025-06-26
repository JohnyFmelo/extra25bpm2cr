import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Settings } from 'lucide-react';
import ConvocacaoDialog from './ConvocacaoDialog';
import ConvocacaoRespostas from './ConvocacaoRespostas';

interface Volunteer {
  id: string;
  name: string;
  email: string;
}

const VolunteersManager = () => {
  const [showConvocacaoDialog, setShowConvocacaoDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('convocacao');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Voluntários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="convocacao">Convocação</TabsTrigger>
              <TabsTrigger value="respostas">Respostas</TabsTrigger>
            </TabsList>

            <TabsContent value="convocacao" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Nova Convocação</h3>
                <Button 
                  onClick={() => setShowConvocacaoDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Criar Convocação
                </Button>
              </div>
              <p className="text-gray-600">
                Crie uma nova convocação que será enviada para todos os usuários. 
                As respostas serão coletadas automaticamente dentro do prazo estipulado.
              </p>
            </TabsContent>

            <TabsContent value="respostas">
              <ConvocacaoRespostas />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConvocacaoDialog 
        open={showConvocacaoDialog} 
        onOpenChange={setShowConvocacaoDialog} 
      />
    </div>
  );
};

export default VolunteersManager;
