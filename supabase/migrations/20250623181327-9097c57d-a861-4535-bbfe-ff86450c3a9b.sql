
-- Criar tabela para armazenar convocações ativas
CREATE TABLE public.convocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  deadline_days integer DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para armazenar respostas dos militares
CREATE TABLE public.convocation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocation_id uuid REFERENCES public.convocations(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text NOT NULL,
  is_volunteer boolean NOT NULL,
  responded_at timestamp with time zone DEFAULT now(),
  UNIQUE(convocation_id, user_email)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.convocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convocation_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para convocations (todos podem ler convocações ativas)
CREATE POLICY "Anyone can view active convocations" 
  ON public.convocations 
  FOR SELECT 
  USING (is_active = true);

-- Políticas para convocation_responses (usuários podem inserir e ver suas próprias respostas)
CREATE POLICY "Users can insert their own responses" 
  ON public.convocation_responses 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view their own responses" 
  ON public.convocation_responses 
  FOR SELECT 
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_convocations_updated_at 
  BEFORE UPDATE ON public.convocations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
