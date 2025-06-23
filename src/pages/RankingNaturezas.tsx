
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, FileText, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NatureRanking {
  nature: string;
  count: number;
  percentage: number;
}

const BUCKET_NAME = 'tco-pdfs';

const extractTcoNatureFromFilename = (fileName: string | undefined | null): string => {
  if (!fileName) return "Não especificada";
  const parts = fileName.split('_');
  if (parts.length < 4) return "Não especificada";
  
  let naturezaParts: string[] = [];
  const lastPart = parts[parts.length - 1];
  const rgpmSegmentPotentially = lastPart.replace(/\.pdf$/i, "");
  
  if (parts.length >= 5 && /^\d/.test(rgpmSegmentPotentially)) {
    naturezaParts = parts.slice(3, parts.length - 1);
  } else {
    const lastNaturePart = parts[parts.length - 1].replace(/\.pdf$/i, "");
    naturezaParts = parts.slice(3, parts.length - 1);
    naturezaParts.push(lastNaturePart);
  }
  
  if (naturezaParts.length === 0) return "Não especificada";
  
  return naturezaParts.join('_')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || "Não especificada";
};

const RankingNaturezas: React.FC = () => {
  const [ranking, setRanking] = useState<NatureRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTcos, setTotalTcos] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNatureStats = async () => {
      try {
        setIsLoading(true);
        
        const { data: userFolders, error: foldersError } = await supabase.storage
          .from(BUCKET_NAME)
          .list('tcos/');

        if (foldersError) {
          console.error("Erro ao buscar pastas de usuários:", foldersError);
          setIsLoading(false);
          return;
        }

        const natureCountMap = new Map<string, number>();
        let total = 0;

        for (const folder of userFolders || []) {
          if (folder.name === '.emptyFolderPlaceholder') continue;
          
          const { data: userFiles, error: filesError } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`tcos/${folder.name}/`);

          if (filesError) {
            console.error(`Erro ao buscar TCOs do usuário ${folder.name}:`, filesError);
            continue;
          }

          userFiles?.forEach(file => {
            const nature = extractTcoNatureFromFilename(file.name);
            const current = natureCountMap.get(nature) || 0;
            natureCountMap.set(nature, current + 1);
            total++;
          });
        }

        const natureRanking: NatureRanking[] = Array.from(natureCountMap.entries())
          .map(([nature, count]) => ({
            nature,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count);

        setRanking(natureRanking);
        setTotalTcos(total);

      } catch (error) {
        console.error("Erro ao processar naturezas dos TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNatureStats();
  }, []);

  const getRankingColor = (index: number) => {
    switch (index) {
      case 0: return 'border-l-yellow-500 bg-yellow-50';
      case 1: return 'border-l-gray-400 bg-gray-50';
      case 2: return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}°`;
    }
  };

  if (isLoading) {
    return (
      <div className="center-container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="center-container py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ranking Completo - Naturezas TCO</h1>
        </div>
        
        <p className="text-gray-600">
          Distribuição completa das naturezas de TCOs registrados no sistema
        </p>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Total: {totalTcos} TCOs</span>
          </div>
          <div>
            <span>Tipos diferentes: {ranking.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {ranking.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum TCO encontrado no sistema.</p>
            </CardContent>
          </Card>
        ) : (
          ranking.map((nature, index) => (
            <Card 
              key={nature.nature} 
              className={`border-l-4 ${getRankingColor(index)} hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-700 min-w-[60px]">
                      {getRankingIcon(index)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {nature.nature}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {nature.count} TCO{nature.count !== 1 ? 's' : ''} registrado{nature.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {nature.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">
                      do total
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${nature.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RankingNaturezas;
