import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { users } = await req.json()
      console.log(`Migrando ${users.length} usuários do Firebase`)

      const migratedUsers = []
      const errors = []

      for (const user of users) {
        try {
          // Criar usuário no Supabase Auth
          const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: user.email,
            password: user.password, // Senha original do Firebase
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
              war_name: user.warName,
              registration: user.registration,
              rank: user.rank,
              user_type: user.userType,
              service: user.service,
              rgpm: user.rgpm,
              is_volunteer: user.isVolunteer || false
            }
          })

          if (authError) {
            console.error(`Erro ao criar usuário ${user.email}:`, authError)
            errors.push({ user: user.email, error: authError.message })
            continue
          }

          console.log(`Usuário ${user.email} criado com sucesso`)
          migratedUsers.push({
            email: user.email,
            supabase_id: authUser.user?.id
          })

        } catch (error) {
          console.error(`Erro ao processar usuário ${user.email}:`, error)
          errors.push({ user: user.email, error: error.message })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          migrated: migratedUsers.length,
          errors: errors.length,
          details: { migratedUsers, errors }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('Erro na edge function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})