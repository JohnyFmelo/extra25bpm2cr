import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Trophy, TrendingUp, ChevronDown, ChevronUp, Info, X } from "lucide-react"; // Adicionado Info e X
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Adicionado DialogClose

interface TCOStats {
  total: number;
  averagePerDay: number;
  activeDays: number;
  lastUpdate: string;
}

interface OfficerRanking {
  rgpm: string;
  officerName: string;
  graduacao: string;
  tcoCount: number;
  totalWeight: number;
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

// --- ESTRUTURA DE DADOS ALTERADA para incluir peso e pena ---
interface NatureDetail {
  weight: number;
  pena: string;
}

const NATURE_DETAILS: { [key: string]: NatureDetail } = {
  'Lesão Corporal': { weight: 10, pena: 'Pena: 3 meses a 1 ano' },
  'Omissão De Socorro': { weight: 9, pena: 'Pena: 1 a 6 meses ou multa' },
  'Conduzir Veículo Sem Cnh Gerando Perigo De Dano': { weight: 9, pena: 'Pena: 6 meses a 1 ano ou multa' },
  'Resistência': { weight: 8, pena: 'Pena: 2 meses a 2 anos' },
  'Invasão De Domicílio': { weight: 7, pena: 'Pena: 1 a 3 meses ou multa' },
  'Desacato': { weight: 7, pena: 'Pena: 6 meses a 2 anos ou multa' },
  'Rixa': { weight: 6, pena: 'Pena: 15 dias a 2 meses ou multa' },
  'Falsa Identidade': { weight: 6, pena: 'Pena: 3 meses a 1 ano ou multa' },
  'Entregar Veículo A Pessoa Não Habilitada': { weight: 6, pena: 'Pena: 6 meses a 1 ano ou multa' },
  'Porte De Drogas Para Consumo': { weight: 6, pena: 'Pena: Advertência, prestação de serviços' },
  'Ameaça': { weight: 5, pena: 'Pena: 1 a 6 meses ou multa' },
  'Dano': { weight: 5, pena: 'Pena: 1 a 6 meses ou multa' },
  'Calúnia': { weight: 5, pena: 'Pena: 6 meses a 2 anos e multa' },
  'Exercício Arbitrário Das Próprias Razões': { weight: 4, pena: 'Pena: 15 dias a 1 mês ou multa' },
  'Fraude Em Comércio': { weight: 4, pena: 'Pena: 6 meses a 2 anos ou multa' },
  'Vias De Fato': { weight: 3, pena: 'Pena: 15 dias a 3 meses ou multa' },
  'Desobediência': { weight: 3, pena: 'Pena: 15 dias a 6 meses e multa' },
  'Difamação': { weight: 2, pena: 'Pena: 3 meses a 1 ano e multa' },
  'Injúria': { weight: 2, pena: 'Pena: 1 a 6 meses ou multa' },
  'Ato Obsceno': { weight: 2, pena: 'Pena: 3 meses a 1 ano ou multa' },
  'Perturbação Do Sossego': { weight: 1, pena: 'Pena: 15 dias a 3 meses ou multa' },
  'Trafegar Em Velocidade Incompatível Com Segurança': { weight: 1, pena: 'Pena: 6 meses a 2 anos' },
};

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

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

const TCOProductivityRanking: React.FC = () => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0,
    lastUpdate: ""
  });
  const [ranking, setRanking] = useState<OfficerRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullRanking, setShowFullRanking] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchAllTcos = async () => {
      try {
        setIsLoading(true);

        const normalizedDetailsMap = new Map<string, NatureDetail>();
        for (const key in NATURE_DETAILS) {
            normalizedDetailsMap.set(normalizeString(key), NATURE_DETAILS[key]);
        }
        
        const { data: userFolders, error: foldersError } = await supabase.storage
          .from(BUCKET_NAME)
          .list('tcos/');

        if (foldersError) {
          console.error("Erro ao buscar pastas de usuários:", foldersError);
          setIsLoading(false);
          return;
        }

        let allTcos: TcoData[] = [];
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
            const natureza = extractTcoNatureFromFilename(fileName);
            
            return {
              id: file.id || fileName,
              tcoNumber: finalTcoNumber,
              createdAt: new Date(file.created_at || Date.now()),
              natureza: natureza,
              fileName: fileName,
              userId: folder.name,
              rgpmsExtracted: rgpmsExtracted
            };
          }) || [];

          allTcos = [...allTcos, ...userTcos];

          userTcos.forEach(tco => {
            const allRgpmsInvolved = [...tco.rgpmsExtracted.main, ...tco.rgpmsExtracted.support];
            const uniqueRgpms = [...new Set(allRgpmsInvolved)];
            
            const normalizedNature = normalizeString(tco.natureza);
            const details = normalizedDetailsMap.get(normalizedNature);
            const weight = details ? details.weight : 0;

            uniqueRgpms.forEach(rgpm => {
              const current = officerTcoCountMap.get(rgpm) || { count: 0, totalWeight: 0 };
              officerTcoCountMap.set(rgpm, {
                count: current.count + 1,
                totalWeight: current.totalWeight + weight,
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
          setStats({ total: 0, averagePerDay: 0, activeDays: 0, lastUpdate: new Date().toLocaleDateString('pt-BR') });
          setRanking([]);
          setIsLoading(false);
          return;
        }

        const uniqueDates = new Set(allTcos.map(tco => tco.createdAt.toISOString().split('T')[0]).filter(Boolean));
        const activeDays = uniqueDates.size;
        const averagePerDay = activeDays > 0 ? total / activeDays : 0;
        const lastUpdate = allTcos.length > 0 ? new Date(Math.max(...allTcos.map(tco => tco.createdAt.getTime()))).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

        setStats({ total, averagePerDay: Math.round(averagePerDay * 10) / 10, activeDays, lastUpdate });

        const officerRanking: OfficerRanking[] = Array.from(officerTcoCountMap.entries())
          .filter(([_, data]) => data.count > 0)
          .map(([rgpm, data]) => ({
            rgpm,
            officerName: data.officerInfo?.nome || 'Militar não identificado',
            graduacao: data.officerInfo?.graduacao || '',
            tcoCount: data.count,
            totalWeight: data.totalWeight
          }))
          .sort((a, b) => {
            if (a.tcoCount !== b.tcoCount) {
              return b.tcoCount - a.tcoCount;
            }
            return b.totalWeight - a.totalWeight;
          });

        setRanking(officerRanking);

      } catch (error) {
        console.error("Erro ao processar TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTcos();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-6 bg-white/20 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-8 bg-white/20 rounded w-16"></div>
              <div className="h-8 bg-white/20 rounded w-16"></div>
              <div className="h-8 bg-white/20 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentUserRgpm = user.rgpm;
  const currentUserRank = currentUserRgpm ? ranking.findIndex(r => r.rgpm === currentUserRgpm) + 1 : 0;
  const currentUserData = currentUserRgpm ? ranking.find(r => r.rgpm === currentUserRgpm) : null;
  
  const itemsToDisplay = showFullRanking ? ranking : ranking.slice(0, 3);

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-300" />
              Ranking TCO - Militares
            </h3>
            <p className="text-sm text-white/80">Produtividade por militar</p>
          </div>
          <TrendingUp className="h-8 w-8 text-white/60" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex justify-between items-center my-4 bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/80">Total TCOs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.averagePerDay}</div>
            <div className="text-xs text-white/80">Média/dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{ranking.length}</div>
            <div className="text-xs text-white/80">Militares</div>
          </div>
        </div>
        
        {ranking.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <div className="inline-flex items-center bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
              🏆 {showFullRanking ? 'RANKING COMPLETO' : 'PÓDIO - TOP 3'}
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Info className="h-5 w-5 text-yellow-300 cursor-pointer hover:text-yellow-100 transition-colors" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-yellow-300">Sistema de Pontuação</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    A pontuação serve apenas como critério de desempate. A classificação principal é por quantidade de TCOs.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-80 overflow-y-auto pr-2">
                  <ul className="space-y-2">
                    {Object.entries(NATURE_DETAILS)
                      .sort(([, detailsA], [, detailsB]) => detailsB.weight - detailsA.weight)
                      .map(([nature, details]) => (
                        <li key={nature} className="flex justify-between items-start text-sm p-3 rounded-md bg-white/5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{nature}</span>
                            <span className="text-xs text-slate-400 mt-1">{details.pena}</span>
                          </div>
                          <span className="font-bold text-blue-400 flex-shrink-0 ml-4">{details.weight} Pontos</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {currentUserData && (
          <div className="bg-white/10 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {currentUserRank}º
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm break-words">
                    {currentUserData.graduacao} {currentUserData.officerName}
                  </div>
                  <div className="text-xs text-white/80">{currentUserData.tcoCount} TCOs / {currentUserData.totalWeight} Pontos</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">SUA POSIÇÃO</div>
              </div>
            </div>
          </div>
        )}

        {ranking.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="space-y-3">
              {itemsToDisplay.map((officer, index) => (
                <div
                  key={officer.rgpm}
                  className="flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-400 text-blue-600' :
                    index === 1 ? 'bg-gray-300 text-gray-600' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-white/20 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-xs text-white/80 font-medium break-words">
                      {officer.graduacao}
                    </span>
                    <span className="text-sm font-semibold break-words whitespace-pre-line leading-tight">
                      {officer.officerName}
                    </span>
                    <div className="text-xs text-white/80 mt-1 flex items-center gap-2">
                      <span>{officer.tcoCount} TCOs</span>
                      <span className="text-green-300 font-semibold">{officer.totalWeight} Pontos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {ranking.length > 3 && (
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <button
                  onClick={() => setShowFullRanking(!showFullRanking)}
                  className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  {showFullRanking ? (
                    <>
                      Mostrar menos <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Ver ranking completo <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TCOProductivityRanking;
