# 🚀 ACTIVAR PAGOS EN 3 PASOS (5 minutos)

## ⚠️ IMPORTANTE
Estás viendo el error de CORS porque la Edge Function NO está desplegada en Supabase.
Sigue estos 3 pasos para activar el sistema de pagos:

---

## 📝 PASO 1: Ejecutar SQL (1 minuto)

1. Ve a: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/sql/new
2. Copia y pega el contenido del archivo: **`EJECUTAR_EN_SUPABASE.sql`**
3. Click en **"Run"** (botón verde)
4. Deberías ver: "Success. No rows returned"

✅ Esto crea la tabla `payment_preferences`

---

## 🚀 PASO 2: Desplegar Edge Function (2 minutos)

1. Ve a: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/functions
2. Click en **"Create a new function"**
3. Nombre: `create-preference`
4. Copia y pega el contenido del archivo: **`CODIGO_EDGE_FUNCTION.txt`**
5. Click en **"Deploy function"**
6. Espera a que aparezca el check verde ✅

---

## 🔐 PASO 3: Configurar Access Token (1 minuto)

1. En la misma página de Edge Functions, busca `create-preference`
2. Click en la función
3. Ve a la pestaña **"Secrets"** o **"Settings"**
4. Click en **"Add new secret"**
5. Completa:
   - **Name:** `MERCADOPAGO_ACCESS_TOKEN`
   - **Value:** `APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039`
6. Click en **"Save"**

---

## ✅ VERIFICAR

1. Ve a: https://gestionar.app/premium
2. Click en **"Suscribirme ahora"**
3. Deberías ser redirigido a Mercado Pago ✅

Si aún ves el error, espera 30 segundos y recarga la página (la Edge Function tarda un poco en activarse).

---

## 📁 Archivos de referencia

- **SQL:** `EJECUTAR_EN_SUPABASE.sql`
- **Edge Function:** `CODIGO_EDGE_FUNCTION.txt`
- **Documentación completa:** `ACTIVAR_PAGOS.md`

---

## 🆘 Problemas?

**Error persiste después de desplegar:**
- Espera 30-60 segundos
- Recarga la página
- Verifica que el secret esté guardado

**No encuentras dónde crear la función:**
- Dashboard > Project > Edge Functions (menú izquierdo)
- O usa este link directo: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/functions

**Error al guardar el secret:**
- Asegúrate de copiar el Access Token completo
- No debe tener espacios al inicio o final

---

⏱️ **Tiempo total: 5 minutos**
