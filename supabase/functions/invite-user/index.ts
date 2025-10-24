// supabase/functions/invite-user/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email) {
        throw new Error('Email is required.')
    }

    // Create a Supabase client with the Auth context of the user making the request.
    const supabaseClient = createClient(
      // FIX: Deno.env is a valid API in Supabase Edge Functions. This error is likely due to a misconfigured TS/linting environment.
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // FIX: Deno.env is a valid API in Supabase Edge Functions. This error is likely due to a misconfigured TS/linting environment.
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Get the user object from the access token.
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
    }
    
    // Get the user's profile to find their account_id.
    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('account_id')
        .eq('id', user.id)
        .single()
        
    if (profileError || !profile) {
        throw new Error('Could not find the user profile or account.')
    }

    // Create a new Supabase admin client to perform the invitation.
    const supabaseAdmin = createClient(
      // FIX: Deno.env is a valid API in Supabase Edge Functions. This error is likely due to a misconfigured TS/linting environment.
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // FIX: Deno.env is a valid API in Supabase Edge Functions. This error is likely due to a misconfigured TS/linting environment.
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          account_id: profile.account_id,
        },
    })

    if (inviteError) {
      throw inviteError
    }

    return new Response(JSON.stringify({ message: 'Invite sent successfully!', data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})