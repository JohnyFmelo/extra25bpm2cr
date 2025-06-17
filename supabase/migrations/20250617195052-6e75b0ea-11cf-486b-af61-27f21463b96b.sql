
-- Criar tabela para armazenar faltas dos militares
CREATE TABLE public.military_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot_id TEXT NOT NULL,
  volunteer_name TEXT NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  marked_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.military_absences ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que todos vejam as faltas (já que é informação administrativa)
CREATE POLICY "Everyone can view military absences" 
  ON public.military_absences 
  FOR SELECT 
  USING (true);

-- Criar política para permitir inserção (apenas admins podem marcar faltas - será controlado no código)
CREATE POLICY "Allow insert military absences" 
  ON public.military_absences 
  FOR INSERT 
  WITH CHECK (true);

-- Criar política para permitir update
CREATE POLICY "Allow update military absences" 
  ON public.military_absences 
  FOR UPDATE 
  USING (true);

-- Criar política para permitir delete
CREATE POLICY "Allow delete military absences" 
  ON public.military_absences 
  FOR DELETE 
  USING (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_military_absences_updated_at
  BEFORE UPDATE ON public.military_absences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
