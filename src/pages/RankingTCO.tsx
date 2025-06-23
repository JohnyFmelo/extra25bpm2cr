import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trophy, TrendingUp, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TCOStats {
  total: number;
  averagePerDay: number;
  activeDays: number;
}

interface OfficerRanking {
  rgpm: string;
  officerName: string;
  graduacao: string;
  tcoCount: number;
  totalWeight: number; // Campo para o peso de desempate
}

interface ExtractedRgpms {
  main: string[];
  support: string[];
}

interface OfficerInfo {
  rgpm: string;
  graduacao: string;
  nome: string;
}

interface TcoData {
  id: string;
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  fileName: string;
  userId: string;
  rgpmsExtracted: ExtractedRgpms;
}

const BUCKET_NAME = 'tco-pdfs';

// --- ADICIONADO: Pesos das naturezas para desempate ---
const NATURE_WEIGHTS: { [key: string]: number } = {
  'Lesão Corporal': 10,
  'Omissão De Socorro': 9,
  'Conduzir Veículo Sem Cnh Gerando Perigo De Dano': 9,
  'Resistência': 8,
  'Invasão De Domicílio': 7,
  'Desacato': 7,
  'Rixa': 6,
  'Falsa Identidade': 6,
  'Entregar Veículo A Pessoa Não Habilitada': 6,
  'Ameaça': 5,
  'Dano': 5,
  'Calúnia': 5,
  'Exercício Arbitrário Das Próprias Razões': 4,
  'Fraude Em Comércio': 4,
  'Vias De Fato': 3,
  'Desobediência': 3,
  'Difamação': 2,
  'Injúria': 2,
  'Ato Obsceno': 2,
  'Porte De Drogas Para Consumo': 1,
  'Perturbação Do Sossego': 1,
  'Trafegar Em Velocidade Incompatível Com Segurança': 1
};

// --- ADICIONADO: Função para extrair a natureza do nome do arquivo ---
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

const extractRGPMsFromFilename = (fileName: string | undefined | null): ExtractedRgpms => {
  const emptyResult: ExtractedRgpms = {
    main: [],
    support: []
  };
  if (!fileName) return emptyResult;
  const parts = fileName.split('_');
  if (parts.length < 5) return emptyResult;
  const rgpmSegmentWithExtension = parts[parts.length - 1];
  const rgpmStringWithoutExtension = rgpmSegmentWithExtension.replace(/\.pdf$/i, "");
  if (!rgpmStringWithoutExtension.match(/^\d/)) return emptyResult;
  const [mainRgpmsStr, supportRgpmsStr] = rgpmStringWithoutExtension.split('.');
  const parseRgpmsFromString = (rgpmStr: string | undefined): string[] => {
    if (!rgpmStr) return [];
    const rgpmsList: string[] = [];
    for (let i = 0; i < rgpmStr.length; i += 6) {
      const rgpm = rgpmStr.substring(i, i + 6);
      if (rgpm.length === 6 && /^\d{6}$/.test(rgpm)) rgpmsList.push(rgpm);
    }
    return rgpmsList;
  };
  return {
    main: parseRgpmsFromString(mainRgpmsStr),
    support: parseRgpmsFromString(supportRgpmsStr)
  };
};

const RankingTCO: React.FC = () => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0
  });
  const [ranking, setRanking] = useState<OfficerRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // --- ADICIONADO: Estado para controlar a exibição do ranking ---
  const [showFullRanking, setShowFullRanking] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchAllTcos = async () => {
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

        let allTcos: TcoData[] = [];
        // --- ALTERADO: Mapa agora armazena contagem e peso total ---
        const officerTcoCountMap = new Map<string, { count: number; totalWeight: number; officerInfo?: OfficerInfo }>();

        for (const folder of userFolders || []) {
          if (folder.name === '.emptyFolderPlaceholder') continue;
          
          const { data: userFiles, error: filesError } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`tcos/${folder.name}/`);

          if (filesError) {
            console.error(`Erro ao buscar TCOs do usuário ${folder.name}:`, filesError);
            continue;
          }

          const userTcos: TcoData[] = userFiles?.map(file => {
            const fileName = file.name;
            const tcoMatch = fileName.match(/TCO[-_]([^_-]+)/i);
            let tcoIdentifierPart = tcoMatch ? tcoMatch[1] : fileName.replace(/\.pdf$/i, "");
            let finalTcoNumber = tcoIdentifierPart.toUpperCase().startsWith("TCO-") 
              ? tcoIdentifierPart 
              : `TCO-${tcoIdentifierPart}`;
            
            const rgpmsExtracted = extractRGPMsFromFilename(fileName);
            // --- ALTERADO: Extrai a natureza para cada TCO ---
            const natureza = extractTcoNatureFromFilename(fileName);
            
            return {
              id: file.id || fileName,
              tcoNumber: finalTcoNumber,
              createdAt: new Date(file.created_at || Date.now()),
              natureza: natureza, // Popula o campo natureza
              fileName: fileName,
              userId: folder.name,
              rgpmsExtracted: rgpmsExtracted
            };
          }) || [];

          allTcos = [...allTcos, ...userTcos];

          userTcos.forEach(tco => {
            const allRgpmsInvolved = [...tco.rgpmsExtracted.main, ...tco.rgpmsExtracted.support];
            const uniqueRgpms = [...new Set(allRgpmsInvolved)];
            const weight = NATURE_WEIGHTS[tco.natureza] || 0; // Pega o peso da natureza, 0 se não encontrar

            uniqueRgpms.forEach(rgpm => {
              const current = officerTcoCountMap.get(rgpm) || { count: 0, totalWeight: 0 };
              officerTcoCountMap.set(rgpm, {
                count: current.count + 1,
                totalWeight: current.totalWeight + weight, // Soma o peso
                officerInfo: current.officerInfo
              });
            });
          });
        }

        const allRgpms = Array.from(officerTcoCountMap.keys());
        if (allRgpms.length > 0) {
          const { data: officersData, error: officersError } = await supabase
            .from('police_officers')
            .select('rgpm, graduacao, nome')
            .in('rgpm', allRgpms);

          if (!officersError && officersData) {
            officersData.forEach(officer => {
              const current = officerTcoCountMap.get(officer.rgpm);
              if (current) {
                officerTcoCountMap.set(officer.rgpm, {
                  ...current,
                  officerInfo: officer as OfficerInfo
                });
              }
            });
          }
        }

        const total = allTcos.length;
        
        if (total === 0) {
          setStats({
            total: 0,
            averagePerDay: 0,
            activeDays: 0
          });
          setRanking([]);
          setIsLoading(false);
          return;
        }

        const uniqueDates = new Set(
          allTcos.map(tco => tco.createdAt.toISOString().split('T')[0]).filter(Boolean)
        );
        
        const activeDays = uniqueDates.size;
        const averagePerDay = activeDays > 0 ? total / activeDays : 0;

        setStats({
          total,
          averagePerDay: Math.round(averagePerDay * 10) / 10,
          activeDays
        });

        const officerRanking: OfficerRanking[] = Array.from(officerTcoCountMap.entries())
          .filter(([_, data]) => data.count > 0)
          .map(([rgpm, data]) => ({
            rgpm,
            officerName: data.officerInfo?.nome || 'Militar não identificado',
            graduacao: data.officerInfo?.graduacao || '',
            tcoCount: data.count,
            totalWeight: data.totalWeight // Adiciona o peso total
          }))
          // --- ALTERADO: Lógica de sort para incluir o desempate por peso ---
          .sort((a, b) => {
            if (b.tcoCount !== a.tcoCount) {
              return b.tcoCount - a.tcoCount; // 1. Ordena por contagem
            }
            return b.totalWeight - a.totalWeight; // 2. Desempata por peso
          });

        setRanking(officerRanking);

      } catch (error) {
        console.error("Erro ao processar TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTcos();
  }, [user.rgpm]);

  const handleBack = () => {
    window.close();
  };

  const currentUserRgpm = user.rgpm;
  const currentUserRank = currentUserRgpm ? ranking.findIndex(r => r.rgpm === currentUserRgpm) + 1 : 0;
  const currentUserData = currentUserRgpm ? ranking.find(r => r.rgpm === currentUserRgpm) : null;
  
  // --- ADICIONADO: Itens a serem exibidos na tabela (pódio ou completo) ---
  const itemsToDisplay = showFullRanking ? ranking : ranking.slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Ranking Completo TCO - Militares
                </h1>
                <p className="text-gray-600 mt-1">Participação de militares nos TCOs</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6 bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total TCOs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.averagePerDay}</div>
                <div className="text-sm text-gray-600">Média/dia</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{ranking.length}</div>
                <div className="text-sm text-gray-600">Militares</div>
              </div>
            </div>

            {currentUserData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {currentUserRank}º
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {currentUserData.graduacao} {currentUserData.officerName}
                      </div>
                      <div className="text-sm text-gray-600">{currentUserData.tcoCount} TCOs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-yellow-700">SUA POSIÇÃO</div>
                    <div className="text-sm text-gray-600">no ranking</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* --- ADICIONADO: Badge dinâmico para Pódio/Ranking Completo --- */}
            {ranking.length > 0 && (
              <div className="mb-4">
                <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  🏆 {showFullRanking ? 'RANKING COMPLETO' : 'PÓDIO - TOP 3'}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-center">Posição</TableHead>
                    <TableHead>Militar</TableHead>
                    <TableHead className="text-center w-32">TCOs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* --- ALTERADO: Mapeia sobre 'itemsToDisplay' --- */}
                  {itemsToDisplay.map((officer, index) => (
                    <TableRow 
                      key={officer.rgpm}
                      className={`
                        ${currentUserRgpm === officer.rgpm ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}
                        ${!showFullRanking && index < 3 ? 'bg-blue-50' : ''}
                      `}
                    >
                      <TableCell className="text-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto
                          ${index === 0 ? 'bg-yellow-400 text-blue-600' :
                            index === 1 ? 'bg-gray-300 text-gray-600' :
                            index === 2 ? 'bg-orange-400 text-white' :
                            'bg-gray-100 text-gray-600'}
                        `}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {officer.graduacao} {officer.officerName}
                          </span>
                          <span className="text-xs text-gray-500">RGPM: {officer.rgpm}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {officer.tcoCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {ranking.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum militar encontrado no ranking
                </div>
              )}
            </div>

            {/* --- ADICIONADO: Botão para expandir/recolher a tabela --- */}
            {ranking.length > 3 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowFullRanking(!showFullRanking)}
                >
                  {showFullRanking ? 'Mostrar menos' : 'Ver ranking completo'}
                  {showFullRanking 
                    ? <ChevronUp className="w-4 h-4 ml-2" /> 
                    : <ChevronDown className="w-4 h-4 ml-2" />
                  }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RankingTCO;
