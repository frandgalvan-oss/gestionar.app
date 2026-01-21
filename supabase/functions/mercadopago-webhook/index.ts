import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const payload = await req.json()
    const webhookId = req.headers.get('x-request-id') || crypto.randomUUID()

    // IDEMPOTENCIA: Verificar si este webhook ya fue procesado
    const { data: existingWebhook } = await supabaseClient
      .from('mercadopago_webhooks')
      .select('id, processed')
      .eq('webhook_id', webhookId)
      .single()

    if (existingWebhook?.processed) {
      console.log('Webhook already processed:', webhookId)
      return new Response(JSON.stringify({ status: 'already_processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Guardar webhook
    const { error: webhookError } = await supabaseClient
      .from('mercadopago_webhooks')
      .upsert({
        webhook_id: webhookId,
        event_type: payload.type,
        payment_id: payload.data?.id,
        payload: payload,
        processed: false,
      })

    if (webhookError) {
      console.error('Error saving webhook:', webhookError)
    }

    // Procesar solo eventos de pago
    if (payload.type === 'payment') {
      const paymentId = payload.data?.id

      if (!paymentId) {
        throw new Error('No payment ID in webhook')
      }

      // Obtener detalles del pago de Mercado Pago
      const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
      })

      if (!mpResponse.ok) {
        throw new Error('Error fetching payment from Mercado Pago')
      }

      const paymentData = await mpResponse.json()

      // Solo procesar pagos aprobados
      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata?.user_id
        const preferenceId = paymentData.external_reference

        if (!userId || !preferenceId) {
          throw new Error('Missing user_id or preference_id in payment metadata')
        }

        // Procesar el pago usando la función segura
        const { error: processError } = await supabaseClient.rpc('process_successful_payment_secure', {
          p_user_id: userId,
          p_payment_id: paymentId,
          p_preference_id: preferenceId.split('_')[0], // Extraer solo el preference_id
          p_amount: paymentData.transaction_amount,
          p_payment_method: paymentData.payment_method_id,
          p_mercadopago_data: paymentData,
          p_ip_address: null,
        })

        if (processError) {
          console.error('Error processing payment:', processError)
          throw processError
        }

        // Marcar webhook como procesado
        await supabaseClient
          .from('mercadopago_webhooks')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('webhook_id', webhookId)

        console.log('Payment processed successfully:', paymentId)
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
