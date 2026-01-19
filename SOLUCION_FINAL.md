# 🎯 SOLUCIÓN DEFINITIVA - 2 PASOS SIMPLES

## ❌ PROBLEMA ACTUAL
El error `Access to fetch... has been blocked by CORS policy` significa que **la Edge Function NO existe en Supabase**.

## ✅ SOLUCIÓN (5 minutos)

---

## PASO 1: Ejecutar SQL (2 minutos)

### 1.1 Abre este link:
```
https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/sql/new
```

### 1.2 Copia y pega este código SQL completo:

```sql
CREATE TABLE IF NOT EXISTS payment_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  preference_data JSONB,
  preference_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  payment_id VARCHAR(255),
  payment_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_preferences_user_id ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_payment_id ON payment_preferences(payment_id);

ALTER TABLE payment_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment preferences" ON payment_preferences;
CREATE POLICY "Users can view own payment preferences"
  ON payment_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment preferences" ON payment_preferences;
CREATE POLICY "Users can insert own payment preferences"
  ON payment_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment preferences" ON payment_preferences;
CREATE POLICY "Users can update own payment preferences"
  ON payment_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_payment_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_preferences_updated_at ON payment_preferences;
CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_preferences_updated_at();
```

### 1.3 Click en el botón verde "RUN"

✅ Deberías ver: "Success. No rows returned"

---

## PASO 2: Desplegar Edge Function (3 minutos)

### 2.1 Abre este link:
```
https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/functions
```

### 2.2 Click en "Create a new function" o "New Edge Function"

### 2.3 Completa:
- **Function name:** `create-preference` (exactamente así, sin espacios)

### 2.4 Copia y pega este código TypeScript completo:

```typescript
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('No autorizado')
    }

    const { planType, planPrice, planName } = await req.json()

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
```

### 2.5 Click en "Deploy" o "Deploy function"

### 2.6 Espera a que aparezca el check verde ✅ (30-60 segundos)

### 2.7 Configurar el Secret:
- En la misma página, busca la pestaña **"Secrets"**
- Click en "Add secret" o "New secret"
- **Name:** `MERCADOPAGO_ACCESS_TOKEN`
- **Value:** `APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039`
- Click en "Save"

---

## ✅ VERIFICACIÓN

1. Ve a: https://gestionar.app/premium
2. Click en "Suscribirme ahora"
3. **El error de CORS desaparecerá**
4. Serás redirigido a Mercado Pago

---

## 🔍 ¿POR QUÉ NO FUNCIONA SIN ESTO?

- El error de CORS significa que la URL `https://ewotgkdjtgisxprsoddg.supabase.co/functions/v1/create-preference` **NO EXISTE**
- No existe porque **no has desplegado la función**
- El secret que configuraste está bien, pero sin la función, no sirve
- **No hay otra forma de hacerlo funcionar** - la función DEBE estar desplegada

---

## 📞 SI SIGUES TENIENDO PROBLEMAS

1. Verifica que la función `create-preference` aparezca en la lista de Edge Functions
2. Verifica que el secret `MERCADOPAGO_ACCESS_TOKEN` esté configurado
3. Espera 30 segundos después de desplegar
4. Recarga la página de premium

---

**Tiempo total: 5 minutos**
**No hay atajos - estos pasos son obligatorios**
