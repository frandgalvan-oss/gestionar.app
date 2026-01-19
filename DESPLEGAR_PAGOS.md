# 🚀 Guía para Activar el Sistema de Pagos

## ⚠️ Estado Actual

El sistema de pagos con Mercado Pago está **configurado pero NO desplegado**. Necesitas completar estos pasos para que funcione.

---

## 📋 Pasos para Activar los Pagos

### 1️⃣ Configurar Variables de Entorno Locales

Agrega esta línea a tu archivo `.env`:

```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-2ba12f7b-dfb4-4d52-8f19-662b7be99c57
```

### 2️⃣ Ejecutar Migración de Base de Datos

Ve a tu proyecto en Supabase Dashboard:
1. Abre **SQL Editor**
2. Copia y pega el contenido de: `database/migrations/create_payment_preferences.sql`
3. Ejecuta la query

Esto creará la tabla `payment_preferences` necesaria para guardar las preferencias de pago.

### 3️⃣ Desplegar la Edge Function

**Opción A: Usando Supabase CLI (Recomendado)**

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login en Supabase
supabase login

# Vincular tu proyecto
supabase link --project-ref ewotgkdjtgisxprsoddg

# Desplegar la función
supabase functions deploy create-preference
```

**Opción B: Manual desde Supabase Dashboard**

1. Ve a **Edge Functions** en tu proyecto Supabase
2. Click en **Create Function**
3. Nombre: `create-preference`
4. Copia el código de: `supabase/functions/create-preference/index.ts`
5. Guarda y despliega

### 4️⃣ Configurar Secret en Supabase

La Edge Function necesita tu Access Token de Mercado Pago:

**Usando CLI:**
```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039
```

**Desde Dashboard:**
1. Ve a **Settings** > **Edge Functions**
2. En la sección **Secrets**, agrega:
   - Key: `MERCADOPAGO_ACCESS_TOKEN`
   - Value: `APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039`

### 5️⃣ Verificar que Funcione

1. Reinicia tu servidor local: `npm run dev`
2. Ve a `/premium`
3. Click en "Suscribirme ahora"
4. Deberías ser redirigido a Mercado Pago

---

## 🔍 Verificación de Errores

### Error: "El servicio de pagos no está disponible"

**Causa:** La Edge Function no está desplegada o el secret no está configurado.

**Solución:**
1. Verifica que la función esté desplegada en Supabase Dashboard
2. Verifica que el secret `MERCADOPAGO_ACCESS_TOKEN` esté configurado
3. Revisa los logs de la Edge Function en Supabase

### Error: "CORS policy"

**Causa:** La Edge Function no existe o no está respondiendo.

**Solución:** Despliega la Edge Function siguiendo el paso 3.

### Error: "No se recibió URL de pago"

**Causa:** Mercado Pago no devolvió la URL de pago.

**Solución:**
1. Verifica que tu Access Token sea válido
2. Revisa los logs de la Edge Function
3. Verifica que tu cuenta de Mercado Pago esté activa

---

## 📊 Flujo de Pago Completo

1. Usuario hace click en "Suscribirme ahora"
2. Se llama a la Edge Function `create-preference`
3. La función crea una preferencia en Mercado Pago
4. Mercado Pago devuelve una URL de pago
5. Usuario es redirigido a Mercado Pago
6. Usuario completa el pago
7. Mercado Pago redirige a:
   - `/payment/success` si el pago fue exitoso
   - `/payment/failure` si el pago falló
   - `/payment/pending` si el pago está pendiente

---

## 🔐 Credenciales de Mercado Pago

**Public Key (Frontend):**
```
APP_USR-2ba12f7b-dfb4-4d52-8f19-662b7be99c57
```

**Access Token (Backend/Edge Function):**
```
APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039
```

⚠️ **IMPORTANTE:** Estas son credenciales de prueba. Para producción, usa las credenciales reales de tu cuenta de Mercado Pago.

---

## 📝 Archivos Importantes

- `src/pages/Premium.jsx` - Página de suscripción
- `supabase/functions/create-preference/index.ts` - Edge Function
- `database/migrations/create_payment_preferences.sql` - Migración de BD
- `src/pages/PaymentSuccess.jsx` - Página de pago exitoso
- `src/pages/PaymentFailure.jsx` - Página de pago fallido
- `src/pages/PaymentPending.jsx` - Página de pago pendiente

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard > Edge Functions
2. Verifica la consola del navegador
3. Consulta `MERCADOPAGO_SETUP.md` para más detalles
4. Verifica que todas las credenciales estén correctas

---

## ✅ Checklist Final

- [ ] Archivo `.env` con `VITE_MERCADOPAGO_PUBLIC_KEY`
- [ ] Migración SQL ejecutada en Supabase
- [ ] Edge Function desplegada
- [ ] Secret `MERCADOPAGO_ACCESS_TOKEN` configurado
- [ ] Servidor reiniciado
- [ ] Prueba de pago realizada

Una vez completados todos los pasos, el sistema de pagos estará **100% funcional**. 🎉
