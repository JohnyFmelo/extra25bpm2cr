-- Configurar confirmação automática de email para novos usuários
-- Isso resolve o problema de "Email not confirmed" 
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;