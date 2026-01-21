import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función para extraer IP del request
function getClientIP(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticación
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('No autorizado')
    }

    // Obtener datos del request
    const { planType, planPrice, planName } = await req.json()
    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('user-agent')

    // VALIDACIÓN 1: Verificar que el usuario no esté bloqueado
    const { data: isBlocked, error: blockError } = await supabaseClient.rpc('is_user_blocked', {
      p_user_id: user.id
    })

    if (blockError) {
      console.error('Error checking user block status:', blockError)
    }

    if (isBlocked) {
      // Log del intento bloqueado
      await supabaseClient.rpc('log_payment_event', {
        p_user_id: user.id,
        p_event_type: 'preference_creation_blocked',
        p_event_category: 'security',
        p_severity: 'warning',
        p_description: 'Intento de crear preferencia bloqueado por restricción de seguridad',
        p_metadata: { plan_type: planType },
        p_ip_address: clientIP,
        p_user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          error: 'Tu cuenta tiene restricciones de seguridad. Por favor, contacta a soporte.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // VALIDACIÓN 2: Calcular score de riesgo
    const { data: riskScore } = await supabaseClient.rpc('calculate_risk_score', {
      p_user_id: user.id,
      p_ip_address: clientIP,
      p_amount: planPrice
    })

    const isSuspicious = riskScore && riskScore > 70

    // VALIDACIÓN 3: Verificar límite de intentos recientes
    const { count: recentAttempts } = await supabaseClient
      .from('payment_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Última hora

    if (recentAttempts && recentAttempts > 10) {
      await supabaseClient.rpc('log_payment_event', {
        p_user_id: user.id,
        p_event_type: 'rate_limit_exceeded',
        p_event_category: 'security',
        p_severity: 'warning',
        p_description: 'Límite de intentos de pago excedido',
        p_metadata: { attempts: recentAttempts },
        p_ip_address: clientIP,
        p_user_agent: userAgent
      })

      return new Response(
        JSON.stringify({ 
          error: 'Has excedido el límite de intentos. Por favor, espera unos minutos.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      )
    }

    // Obtener Access Token de Mercado Pago
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error('Mercado Pago no configurado')
    }

    // Crear preferencia en Mercado Pago
    const preference = {
      items: [
        {
          title: planName,
          description: `Suscripción ${planType === 'monthly' ? 'Mensual' : 'Anual'} - Sistema de Gestión`,
          quantity: 1,
          unit_price: planPrice,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
      },
      back_urls: {
        success: `${req.headers.get('origin')}/payment/success`,
        failure: `${req.headers.get('origin')}/payment/failure`,
        pending: `${req.headers.get('origin')}/payment/pending`,
      },
      auto_return: 'approved',
      external_reference: `${user.id}_${planType}_${Date.now()}`,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'SISTEMA GESTION',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      metadata: {
        user_id: user.id,
        plan_type: planType,
        email: user.email,
        risk_score: riskScore || 0,
        ip_address: clientIP,
      },
    }

    // Llamar a la API de Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    })

    if (!mpResponse.ok) {
      const error = await mpResponse.text()
      console.error('Error de Mercado Pago:', error)
      
      // Log del error
      await supabaseClient.rpc('log_payment_event', {
        p_user_id: user.id,
        p_event_type: 'mercadopago_api_error',
        p_event_category: 'error',
        p_severity: 'error',
        p_description: 'Error al crear preferencia en Mercado Pago',
        p_metadata: { error: error, status: mpResponse.status },
        p_ip_address: clientIP,
        p_user_agent: userAgent
      })

      throw new Error('Error al crear preferencia de pago')
    }

    const mpData = await mpResponse.json()

    // Guardar en Supabase con información de seguridad
    const { error: insertError } = await supabaseClient.from('payment_preferences').insert({
      user_id: user.id,
      plan_type: planType,
      amount: planPrice,
      preference_id: mpData.id,
      status: 'pending',
      preference_data: {
        ...preference,
        created_at: new Date().toISOString(),
        ip_address: clientIP,
        user_agent: userAgent,
      },
    })

    if (insertError) {
      console.error('Error saving preference:', insertError)
      throw insertError
    }

    // Registrar intento de pago
    await supabaseClient.from('payment_attempts').insert({
      user_id: user.id,
      preference_id: mpData.id,
      amount: planPrice,
      status: 'initiated',
      ip_address: clientIP,
      user_agent: userAgent,
      risk_score: riskScore || 0,
      is_suspicious: isSuspicious,
    })

    // Log de auditoría exitoso
    await supabaseClient.rpc('log_payment_event', {
      p_user_id: user.id,
      p_event_type: 'preference_created',
      p_event_category: 'payment',
      p_severity: 'info',
      p_description: 'Preferencia de pago creada exitosamente',
      p_metadata: { 
        preference_id: mpData.id, 
        amount: planPrice,
        risk_score: riskScore || 0 
      },
      p_ip_address: clientIP,
      p_user_agent: userAgent
    })

    return new Response(
      JSON.stringify({
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
