
-- Remover políticas existentes da tabela convocations
DROP POLICY IF EXISTS "Anyone can view active convocations" ON public.convocations;

-- Criar políticas mais permissivas para convocations
-- Qualquer usuário autenticado pode visualizar convocações
CREATE POLICY "Authenticated users can view convocations" 
  ON public.convocations 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Qualquer usuário autenticado pode inserir convocações (para administradores)
CREATE POLICY "Authenticated users can insert convocations" 
  ON public.convocations 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Qualquer usuário autenticado pode atualizar convocações
CREATE POLICY "Authenticated users can update convocations" 
  ON public.convocations 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Atualizar política de responses para ser mais permissiva
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.convocation_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.convocation_responses;

CREATE POLICY "Authenticated users can insert responses" 
  ON public.convocation_responses 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view responses" 
  ON public.convocation_responses 
  FOR SELECT 
  USING (auth.role() = 'authenticated');
