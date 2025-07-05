-- Criar tabela de profiles para armazenar dados dos usuários
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  war_name text NOT NULL,
  registration text NOT NULL,
  rank text NOT NULL,
  user_type text NOT NULL DEFAULT 'user',
  service text,
  rgpm text,
  is_volunteer boolean DEFAULT false,
  blocked boolean DEFAULT false,
  current_version text,
  last_version_update timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Allow profile creation during signup"
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar profile automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    war_name,
    registration,
    rank,
    user_type,
    service,
    rgpm,
    is_volunteer
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'war_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'registration', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'rank', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'user'),
    NEW.raw_user_meta_data ->> 'service',
    NEW.raw_user_meta_data ->> 'rgpm',
    COALESCE((NEW.raw_user_meta_data ->> 'is_volunteer')::boolean, false)
  );
  RETURN NEW;
END;
$$;

-- Trigger para executar a função quando usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();