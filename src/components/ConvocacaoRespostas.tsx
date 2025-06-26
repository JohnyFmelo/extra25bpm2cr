
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConvocationResponse {
  id: string;
  convocation_id: string;
  user_email: string;
  user_name: string;
  is_volunteer: boolean;
  response_type: string;
  responded_at: Date;
}

interface Convocation {
  id: string;
  month_year: string;
  start_date: string;
  end_date: string;
  deadline_days: number;
  created_at: Date;
}

const ConvocacaoRespostas = () => {
  const [activeConvocation, setActiveConvocation] = useState<Convocation | null>(null);
  const [responses, setResponses] = useState<ConvocationResponse[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConvocationData();
  }, []);

  const loadConvocationData = async () => {
    try {
      // Buscar convocação ativa
      const convocationsRef = collection(db, 'convocations');
      const activeQuery = query(
        convocationsRef,
        where('is_active', '==', true),
        orderBy('created_at', 'desc')
      );

      const convocationsSnapshot = await getDocs(activeQuery);
      
      if (convocationsSnapshot.empty) {
        toast({
          title: "Aviso",
          description: "Não há convocação ativa no momento.",
        });
        setLoading(false);
        return;
      }

      const convocationDoc = convocationsSnapshot.docs[0];
      const convocationData = {
        id: convocationDoc.id,
        ...convocationDoc.data(),
        created_at: convocationDoc.data().created_at?.toDate() || new Date()
      } as Convocation;
      
      setActiveConvocation(convocationData);

      // Buscar todas as respostas da convocação
      const responsesRef = collection(db, 'convocation_responses');
      const responsesQuery = query(
        responsesRef,
        where('convocation_id', '==', convocationDoc.id),
        orderBy('responded_at', 'desc')
      );

      const responsesSnapshot = await getDocs(responsesQuery);
      const responsesData = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        responded_at: doc.data().responded_at?.toDate() || new Date()
      })) as ConvocationResponse[];

      setResponses(responsesData);

      // Buscar todos os usuários para comparar
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAllUsers(usersData);

    } catch (error) {
      console.error('Erro ao carregar dados da convocação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da convocação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineDate = () => {
    if (!activeConvocation) return new Date();
    const deadlineDate = new Date(activeConvocation.created_at);
    deadlineDate.setDate(deadlineDate.getDate() + activeConvocation.deadline_days);
    return deadlineDate;
  };

  const isWithinDeadline = () => {
    const now = new Date();
    const deadline = getDeadlineDate();
    return now <= deadline;
  };

  const getRemainingDays = () => {
    const now = new Date();
    const deadline = getDeadlineDate();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getVolunteers = () => responses.filter(r => r.is_volunteer);
  const getNonVolunteers = () => responses.filter(r => !r.is_volunteer);
  
  const getRespondedEmails = () => responses.map(r => r.user_email);
  const getNonRespondents = () => {
    const respondedEmails = getRespondedEmails();
    return allUsers.filter(user => !respondedEmails.includes(user.email));
  };

  if (loading) {
    return <div className="p-4">Carregando dados da convocação...</div>;
  }

  if (!activeConvocation) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600">Não há convocação ativa no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Convocação: {activeConvocation.month_year}</span>
            <Badge variant={isWithinDeadline() ? "default" : "destructive"}>
              {isWithinDeadline() ? `${getRemainingDays()} dias restantes` : "Prazo encerrado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getVolunteers().length}</div>
              <div className="text-sm text-green-700">Voluntários</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{getNonVolunteers().length}</div>
              <div className="text-sm text-red-700">Não Voluntários</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{getNonRespondents().length}</div>
              <div className="text-sm text-yellow-700">Sem Resposta</div>
            </div>
          </div>

          <Tabs defaultValue="volunteers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="volunteers">Voluntários ({getVolunteers().length})</TabsTrigger>
              <TabsTrigger value="non-volunteers">Não Voluntários ({getNonVolunteers().length})</TabsTrigger>
              <TabsTrigger value="no-response">Sem Resposta ({getNonRespondents().length})</TabsTrigger>
            </TabsList>

            <TabsContent value="volunteers" className="space-y-2">
              {getVolunteers().length === 0 ? (
                <p className="text-gray-600 text-center py-4">Nenhum voluntário ainda.</p>
              ) : (
                getVolunteers().map((response) => (
                  <div key={response.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">{response.user_name}</div>
                      <div className="text-sm text-gray-600">{response.user_email}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {response.responded_at.toLocaleDateString('pt-BR')} às {response.responded_at.toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="non-volunteers" className="space-y-2">
              {getNonVolunteers().length === 0 ? (
                <p className="text-gray-600 text-center py-4">Nenhuma resposta negativa ainda.</p>
              ) : (
                getNonVolunteers().map((response) => (
                  <div key={response.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium">{response.user_name}</div>
                      <div className="text-sm text-gray-600">{response.user_email}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {response.responded_at.toLocaleDateString('pt-BR')} às {response.responded_at.toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="no-response" className="space-y-2">
              {getNonRespondents().length === 0 ? (
                <p className="text-gray-600 text-center py-4">Todos os usuários já responderam.</p>
              ) : (
                getNonRespondents().map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      Pendente
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConvocacaoRespostas;
