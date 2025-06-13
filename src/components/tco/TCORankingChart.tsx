
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, User, Calendar, Activity } from 'lucide-react';

interface TCOStats {
  nome: string;
  totalTcos: number;
  mediaPorDia: number;
  diasAtivos: number;
  porcentagem: number;
  posicao: number;
}

interface TCORankingChartProps {
  tcoData?: any[];
}

export const TCORankingChart: React.FC<TCORankingChartProps> = ({ tcoData = [] }) => {
  // Simular dados de ranking baseados nos TCOs (você pode conectar com dados reais)
  const generateRankingData = (): TCOStats[] => {
    // Se não houver dados de TCO, usar dados simulados para demonstração
    if (!tcoData || tcoData.length === 0) {
      return [
        {
          nome: "MATHEUS",
          totalTcos: 6,
          mediaPorDia: 0.5,
          diasAtivos: 13,
          porcentagem: 83.3,
          posicao: 1
        },
        {
          nome: "RAIMUNDO ALVES",
          totalTcos: 3,
          mediaPorDia: 0.3,
          diasAtivos: 10,
          porcentagem: 16.7,
          posicao: 2
        }
      ];
    }

    // Aqui você pode processar os dados reais dos TCOs
    // Agrupar por condutor, calcular estatísticas, etc.
    const condutorStats = new Map<string, { total: number, dias: Set<string> }>();
    
    tcoData.forEach(tco => {
      const condutor = tco.componentesGuarnicao?.[0]?.nome || "Não informado";
      const data = tco.dataOcorrencia || new Date().toISOString().split('T')[0];
      
      if (!condutorStats.has(condutor)) {
        condutorStats.set(condutor, { total: 0, dias: new Set() });
      }
      
      const stats = condutorStats.get(condutor)!;
      stats.total += 1;
      stats.dias.add(data);
    });

    const ranking: TCOStats[] = Array.from(condutorStats.entries()).map(([nome, stats]) => ({
      nome,
      totalTcos: stats.total,
      mediaPorDia: stats.total / stats.dias.size,
      diasAtivos: stats.dias.size,
      porcentagem: 0,
      posicao: 0
    }));

    // Calcular porcentagens e posições
    const totalTcos = ranking.reduce((sum, item) => sum + item.totalTcos, 0);
    ranking.forEach(item => {
      item.porcentagem = totalTcos > 0 ? (item.totalTcos / totalTcos) * 100 : 0;
    });

    // Ordenar por total de TCOs
    ranking.sort((a, b) => b.totalTcos - a.totalTcos);
    ranking.forEach((item, index) => {
      item.posicao = index + 1;
    });

    return ranking;
  };

  const rankingData = generateRankingData();
  const topCondutor = rankingData[0];

  const getPosicaoColor = (posicao: number) => {
    switch (posicao) {
      case 1: return "bg-yellow-500";
      case 2: return "bg-gray-400";
      case 3: return "bg-amber-600";
      default: return "bg-blue-500";
    }
  };

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return posicao.toString();
    }
  };

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white">
              Ranking Produtividade
            </CardTitle>
            <CardDescription className="text-blue-100">
              Condutores - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </div>
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estatísticas gerais */}
        <div className="flex justify-between items-center bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{topCondutor?.totalTcos || 0}</div>
            <div className="text-xs text-blue-100">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{topCondutor?.mediaPorDia?.toFixed(1) || '0.0'}</div>
            <div className="text-xs text-blue-100">Média/dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{topCondutor?.diasAtivos || 0}</div>
            <div className="text-xs text-blue-100">Dias</div>
          </div>
        </div>

        {/* Ranking dos condutores */}
        <div className="space-y-2">
          {rankingData.slice(0, 3).map((condutor) => (
            <div key={condutor.nome} className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${getPosicaoColor(condutor.posicao)} flex items-center justify-center text-xs font-bold text-white`}>
                    {condutor.posicao <= 3 ? getPosicaoIcon(condutor.posicao) : condutor.posicao}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{condutor.nome}</div>
                    <div className="text-xs text-blue-100 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {condutor.totalTcos} atividades
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  {condutor.porcentagem.toFixed(1)}%
                </Badge>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(condutor.porcentagem, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Última atualização */}
        <div className="text-xs text-blue-100 text-center flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3" />
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};
