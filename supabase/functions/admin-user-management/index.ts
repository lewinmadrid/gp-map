import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the user from the auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('Auth error:', userError)
      throw new Error('Unauthorized')
    }

    console.log('Checking admin status for user:', user.id)

    // Check if user is admin using admin client to bypass RLS
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    console.log('Role check result:', { roles, rolesError })

    if (rolesError || !roles) {
      console.error('Not an admin:', user.id)
      throw new Error('Forbidden: Admin access required')
    }

    console.log('Admin access confirmed for user:', user.id)

    const { action, email, userId, role } = await req.json()

    console.log('Admin action:', action, { email, userId, role })

    switch (action) {
      case 'invite': {
        // Get the app URL from referer header which includes the full URL
        const referer = req.headers.get('referer');
        console.log('Invite - full referer:', referer);
        
        // Extract base URL from referer (e.g., https://xxx.lovableproject.com/admin -> https://xxx.lovableproject.com)
        let baseUrl = 'https://5c98291b-71e3-426d-8d4c-7f43a1b26fc1.lovableproject.com';
        if (referer) {
          try {
            const url = new URL(referer);
            baseUrl = `${url.protocol}//${url.host}`;
          } catch (e) {
            console.error('Failed to parse referer URL:', e);
          }
        }
        
        const redirectUrl = `${baseUrl}/set-password`;
        console.log('Invite - constructed redirectUrl:', redirectUrl);
        
        // Invite a new user
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: redirectUrl,
        })

        if (inviteError) {
          console.error('Invite error:', inviteError)
          throw inviteError
        }

        // Assign default 'user' role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: inviteData.user.id,
            role: role || 'user',
          })

        if (roleError) {
          console.error('Role assignment error:', roleError)
          throw roleError
        }

        console.log('User invited successfully:', inviteData.user.id)

        return new Response(
          JSON.stringify({ success: true, user: inviteData.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        // Delete a user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
          console.error('Delete error:', deleteError)
          throw deleteError
        }

        console.log('User deleted successfully:', userId)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'updateRole': {
        // First, delete existing role
        const { error: deleteRoleError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId)

        if (deleteRoleError) {
          console.error('Delete role error:', deleteRoleError)
          throw deleteRoleError
        }

        // Insert new role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role,
          })

        if (roleError) {
          console.error('Update role error:', roleError)
          throw roleError
        }

        console.log('User role updated successfully:', userId, role)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'listUsers': {
        // List all users with their roles
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

        if (usersError) {
          console.error('List users error:', usersError)
          throw usersError
        }

        // Get roles for all users
        const { data: rolesData } = await supabaseClient
          .from('user_roles')
          .select('*')

        const usersWithRoles = users.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          role: rolesData?.find((r) => r.user_id === u.id)?.role || 'user',
        }))

        console.log('Listed users:', usersWithRoles.length)

        return new Response(
          JSON.stringify({ success: true, users: usersWithRoles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})