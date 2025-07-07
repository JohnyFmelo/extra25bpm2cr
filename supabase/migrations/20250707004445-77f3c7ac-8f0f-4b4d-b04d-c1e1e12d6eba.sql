-- Criar função para confirmar email automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Confirmar email automaticamente
  UPDATE auth.users 
  SET email_confirmed_at = now() 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para confirmar email automaticamente
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();