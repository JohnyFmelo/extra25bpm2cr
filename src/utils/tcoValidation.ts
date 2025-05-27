
// Função para normalizar o número do TCO (remove zeros à esquerda e converte para string)
export const normalizeTcoNumber = (tcoNumber: string): string => {
  // Remove todos os caracteres não numéricos
  const numbersOnly = tcoNumber.replace(/\D/g, '');
  
  // Se não há números, retorna string vazia
  if (!numbersOnly) return '';
  
  // Remove zeros à esquerda convertendo para número e depois para string
  return parseInt(numbersOnly, 10).toString();
};

// Função para formatar o input do TCO (mantém apenas números)
export const formatTcoNumberInput = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Função para verificar se um TCO já existe
export const checkTcoDuplicate = async (tcoNumber: string, supabase: any) => {
  const normalizedNumber = normalizeTcoNumber(tcoNumber);
  const currentYear = new Date().getFullYear();
  
  if (!normalizedNumber) return null;
  
  try {
    // Busca TCOs que tenham o mesmo número normalizado no ano atual
    const { data, error } = await supabase
      .from('tco_metadata')
      .select('*')
      .ilike('tconumber', `%${normalizedNumber}%`)
      .gte('createdat', `${currentYear}-01-01`)
      .lt('createdat', `${currentYear + 1}-01-01`)
      .limit(10); // Limita para evitar muitos resultados
    
    if (error) {
      console.error('Erro ao verificar duplicatas de TCO:', error);
      return null;
    }
    
    // Verifica se algum dos resultados tem o número normalizado igual
    const duplicate = data?.find(tco => {
      const existingNormalized = normalizeTcoNumber(tco.tconumber || '');
      return existingNormalized === normalizedNumber;
    });
    
    return duplicate || null;
  } catch (error) {
    console.error('Erro na verificação de duplicata:', error);
    return null;
  }
};

// Função para calcular diferença em dias
export const calculateDaysDifference = (date: string): number => {
  const createdDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
