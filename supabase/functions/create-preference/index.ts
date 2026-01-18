import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { planType, planPrice, planName } = await req.json()

    // Crear preferencia en Mercado Pago
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error('Mercado Pago no configurado')
    }

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
      metadata: {
        user_id: user.id,
        plan_type: planType,
        email: user.email,
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
      throw new Error('Error al crear preferencia de pago')
    }

    const mpData = await mpResponse.json()

    // Guardar en Supabase
    await supabaseClient.from('payment_preferences').insert({
      user_id: user.id,
      plan_type: planType,
      amount: planPrice,
      preference_id: mpData.id,
      status: 'pending',
      preference_data: preference,
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
