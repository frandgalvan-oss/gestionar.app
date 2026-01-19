# ✅ ACTIVAR SISTEMA DE PAGOS - PASOS FINALES

## 🎯 Estado Actual

✅ **Configurado:**
- ✅ Public Key agregada al archivo `.env`
- ✅ Edge Function creada (`supabase/functions/create-preference/index.ts`)
- ✅ Migración SQL lista (`database/migrations/create_payment_preferences.sql`)
- ✅ Páginas de respuesta creadas (success, failure, pending)
- ✅ Mensajes de error en español

⚠️ **Pendiente (requiere acceso a Supabase Dashboard):**
- ⚠️ Ejecutar migración SQL
- ⚠️ Desplegar Edge Function
- ⚠️ Configurar Access Token

---

## 📝 PASOS PARA COMPLETAR (5 minutos)

### **Paso 1: Ejecutar Migración SQL** ⏱️ 1 min

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New Query**
4. Copia y pega el siguiente SQL:

```sql
-- Tabla para almacenar preferencias de pago de Mercado Pago
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

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_payment_preferences_user_id ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_payment_id ON payment_preferences(payment_id);

-- RLS (Row Level Security)
ALTER TABLE payment_preferences ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias preferencias
CREATE POLICY "Users can view own payment preferences"
  ON payment_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias preferencias
CREATE POLICY "Users can insert own payment preferences"
  ON payment_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias preferencias
CREATE POLICY "Users can update own payment preferences"
  ON payment_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_preferences_updated_at();
```

5. Click en **Run** (o presiona Ctrl+Enter)
6. Deberías ver: "Success. No rows returned"

---

### **Paso 2: Desplegar Edge Function** ⏱️ 2 min

1. En Supabase Dashboard, ve a **Edge Functions** (menú izquierdo)
2. Click en **Create a new function**
3. Nombre: `create-preference`
4. Copia y pega el código de: `supabase/functions/create-preference/index.ts`

**O copia este código directamente:**

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

5. Click en **Deploy**
6. Espera a que se despliegue (verás un check verde)

---

### **Paso 3: Configurar Access Token** ⏱️ 1 min

1. En la misma página de Edge Functions, busca la función `create-preference`
2. Click en **Settings** o **Secrets**
3. Agrega un nuevo secret:
   - **Key:** `MERCADOPAGO_ACCESS_TOKEN`
   - **Value:** `APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039`
4. Click en **Save**

---

### **Paso 4: Reiniciar Servidor** ⏱️ 30 seg

```bash
# Detener el servidor actual (Ctrl+C)
# Reiniciar
npm run dev
```

---

### **Paso 5: Probar el Sistema** ⏱️ 1 min

1. Ve a: http://localhost:5173/premium
2. Click en **"Suscribirme ahora"**
3. Deberías ser redirigido a Mercado Pago
4. Completa el pago de prueba

---

## ✅ Verificación

Si todo está bien configurado:
- ✅ No verás el error "El servicio de pagos no está disponible"
- ✅ Serás redirigido a Mercado Pago
- ✅ Verás el plan de $14,000/mes
- ✅ Después del pago, volverás a `/payment/success`

---

## 🔍 Solución de Problemas

### Error: "El servicio de pagos no está disponible"
- Verifica que la Edge Function esté desplegada
- Verifica que el secret `MERCADOPAGO_ACCESS_TOKEN` esté configurado
- Revisa los logs en Supabase Dashboard > Edge Functions > Logs

### Error: "No autorizado"
- Asegúrate de estar logueado en la aplicación
- Verifica que tu sesión sea válida

### No se crea la preferencia
- Revisa los logs de la Edge Function
- Verifica que el Access Token sea correcto
- Verifica que la tabla `payment_preferences` exista

---

## 📊 Credenciales de Mercado Pago

**Public Key (ya configurada en .env):**
```
APP_USR-2ba12f7b-dfb4-4d52-8f19-662b7be99c57
```

**Access Token (para configurar en Supabase):**
```
APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039
```

---

## 🎉 ¡Listo!

Una vez completados estos 5 pasos, el sistema de pagos estará **100% funcional**.

Los usuarios podrán:
- ✅ Ver el plan Premium
- ✅ Hacer click en "Suscribirme ahora"
- ✅ Ser redirigidos a Mercado Pago
- ✅ Completar el pago
- ✅ Ser redirigidos de vuelta con el estado del pago

---

**Tiempo total estimado:** 5-7 minutos ⏱️
