
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface TCOStats {
  total: number;
  averagePerDay: number;
  activeDays: number;
  lastUpdate: string;
}

interface TcoData {
  id: string;
  tcoNumber: string;
  createdAt: Date;
  natureza: string;
  fileName: string;
  userId: string;
}

const BUCKET_NAME = 'tco-pdfs';

const extractTcoDisplayNumber = (fullTcoNumber: string | undefined | null): string => {
  if (!fullTcoNumber) return "-";
  let numberPart = "";
  const match = fullTcoNumber.match(/^TCO[-_]([^_-]+)/i);
  if (match && match[1]) numberPart = match[1];
  else if (fullTcoNumber.toUpperCase().startsWith("TCO-")) numberPart = fullTcoNumber.substring(4);
  else return fullTcoNumber;
  
  if (numberPart) {
    const num = parseInt(numberPart, 10);
    if (!isNaN(num)) return String(num).padStart(2, '0');
    return numberPart;
  }
  return "-";
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

const TCOProductivityRanking: React.FC = () => {
  const [stats, setStats] = useState<TCOStats>({
    total: 0,
    averagePerDay: 0,
    activeDays: 0,
    lastUpdate: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchMyTcos = async () => {
      if (!user.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Buscar TCOs do usuário atual no Supabase Storage
        const { data: userFiles, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list(`tcos/${user.id}/`);

        if (error) {
          console.error("Erro ao buscar TCOs do usuário:", error);
          setIsLoading(false);
          return;
        }

        const myTcos: TcoData[] = userFiles?.map(file => {
          const fileName = file.name;
          const tcoMatch = fileName.match(/TCO[-_]([^_-]+)/i);
          let tcoIdentifierPart = tcoMatch ? tcoMatch[1] : fileName.replace(/\.pdf$/i, "");
          let finalTcoNumber = tcoIdentifierPart.toUpperCase().startsWith("TCO-") 
            ? tcoIdentifierPart 
            : `TCO-${tcoIdentifierPart}`;
          
          const natureza = extractTcoNatureFromFilename(fileName);
          
          return {
            id: file.id || fileName,
            tcoNumber: finalTcoNumber,
            createdAt: new Date(file.created_at || Date.now()),
            natureza: natureza,
            fileName: fileName,
            userId: user.id
          };
        }) || [];

        // Calcular estatísticas
        const total = myTcos.length;
        
        if (total === 0) {
          setStats({
            total: 0,
            averagePerDay: 0,
            activeDays: 0,
            lastUpdate: new Date().toLocaleDateString('pt-BR')
          });
          setIsLoading(false);
          return;
        }

        // Calcular dias únicos com TCOs
        const uniqueDates = new Set(
          myTcos.map(tco => tco.createdAt.toISOString().split('T')[0]).filter(Boolean)
        );
        
        const activeDays = uniqueDates.size;
        const averagePerDay = activeDays > 0 ? total / activeDays : 0;
        
        // Encontrar a última atualização
        const sortedTcos = myTcos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const lastUpdate = sortedTcos.length > 0 
          ? sortedTcos[0].createdAt.toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR');

        setStats({
          total,
          averagePerDay: Math.round(averagePerDay * 10) / 10,
          activeDays,
          lastUpdate
        });

      } catch (error) {
        console.error("Erro ao processar TCOs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTcos();
  }, [user.id]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
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

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-300" />
              Produtividade TCO
            </h3>
            <p className="text-sm text-white/80">Suas estatísticas de TCOs</p>
          </div>
          <TrendingUp className="h-8 w-8 text-white/60" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex justify-between items-center mb-4 bg-white/10 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/80">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.averagePerDay}</div>
            <div className="text-xs text-white/80">Média/dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.activeDays}</div>
            <div className="text-xs text-white/80">Dias</div>
          </div>
        </div>

        {/* User Ranking */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-blue-600 font-bold">
                1
              </div>
              <div>
                <div className="font-semibold text-sm">{user.warName || user.nome || "CONDUTOR"}</div>
                <div className="text-xs text-white/80">{stats.total} atividades</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">TOP 1</div>
              <div className="text-xs text-white/80">Seus TCOs</div>
            </div>
          </div>
        </div>
        
        {/* Last Update */}
        <div className="text-center mt-3">
          <p className="text-xs text-white/70">
            ⏰ Última atualização: {stats.lastUpdate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TCOProductivityRanking;
