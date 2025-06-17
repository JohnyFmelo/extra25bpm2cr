
-- Adicionar campo maxSlots na coleção users do Firebase
-- Como estamos usando Firebase, vou adicionar o campo maxSlots nos tipos TypeScript
-- e o Firebase permitirá que este campo seja adicionado dinamicamente

-- Para o Supabase (caso precisemos de backup), vamos criar uma tabela de configurações de usuário
CREATE TABLE IF NOT EXISTS public.user_slot_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  max_slots INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar Row Level Security
ALTER TABLE public.user_slot_limits ENABLE ROW LEVEL SECURITY;

-- Política para permitir que admins vejam e modifiquem todos os limites
CREATE POLICY "Admins can manage all slot limits"
ON public.user_slot_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_slot_limits_updated_at
    BEFORE UPDATE ON public.user_slot_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
