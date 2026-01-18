# 💳 Configuración de Mercado Pago - Guía Rápida

## 🚀 Resumen

Has integrado Mercado Pago Checkout Pro en tu aplicación. Aquí está todo lo que necesitas saber para ponerlo en funcionamiento.

---

## ✅ Lo que ya está hecho

- ✅ Página Premium con diseño profesional y selector de planes
- ✅ Integración con Mercado Pago Checkout Pro
- ✅ Páginas de respuesta (Success, Failure, Pending)
- ✅ Tabla de preferencias de pago en Supabase
- ✅ Edge Function para crear preferencias de forma segura
- ✅ Servicio de Mercado Pago configurado
- ✅ Rutas configuradas en App.jsx

---

## 🔧 Configuración requerida

### 1. Variables de entorno (.env)

Agrega tu Public Key de Mercado Pago en `.env`:

```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-2ba12f7b-dfb4-4d52-8f19-662b7be99c57
```

### 2. Ejecutar migración SQL

En Supabase SQL Editor, ejecuta:

```sql
-- Archivo: database/migrations/create_payment_preferences.sql
```

Esto creará la tabla `payment_preferences` para tracking de pagos.

### 3. Desplegar Edge Function

**Opción A: Con Supabase CLI (Recomendado)**

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Vincular proyecto
supabase link --project-ref TU_PROJECT_REF

# Desplegar función
supabase functions deploy create-preference
```

**Opción B: Manual en Dashboard**

1. Ve a **Edge Functions** en Supabase Dashboard
2. Crea nueva función: `create-preference`
3. Copia contenido de `supabase/functions/create-preference/index.ts`
4. Despliega

### 4. Configurar variables de entorno en Supabase

En **Edge Functions → Settings**, agrega:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039
```

⚠️ **IMPORTANTE:** El Access Token NUNCA debe estar en el código del cliente.

---

## 🎯 Flujo de pago

1. **Usuario va a `/premium`**
   - Ve el plan Premium ($14,000/mes)
   - Click en "Suscribirme ahora"

2. **Sistema crea preferencia**
   - Llama a Edge Function `create-preference`
   - Edge Function crea preferencia en Mercado Pago
   - Guarda en tabla `payment_preferences`

3. **Redirección a Mercado Pago**
   - Usuario es redirigido a Checkout Pro de Mercado Pago
   - Completa el pago con tarjeta, efectivo, etc.

4. **Retorno a la app**
   - **Success:** `/payment/success` - Activa suscripción y redirige a dashboard
   - **Failure:** `/payment/failure` - Muestra error y opción de reintentar
   - **Pending:** `/payment/pending` - Informa que el pago está en proceso

---

## 🧪 Probar la integración

### Modo Test (Desarrollo)

1. Usa las credenciales de TEST de Mercado Pago
2. Tarjetas de prueba:
   - **Aprobada:** 5031 7557 3453 0604 (Mastercard)
   - **Rechazada:** 5031 4332 1540 6351
   - CVV: cualquier 3 dígitos
   - Fecha: cualquier fecha futura

### Modo Producción

1. Cambia a credenciales de producción (APP_USR-...)
2. Verifica que la Edge Function esté desplegada
3. Configura webhooks para notificaciones automáticas

---

## 📊 Gestión de suscripciones

### Ver suscripciones activas

```sql
SELECT 
  p.email,
  pr.subscription_status,
  pr.subscription_end_date,
  pr.is_premium
FROM profiles pr
JOIN auth.users p ON p.id = pr.id
WHERE pr.subscription_status = 'active';
```

### Ver pagos realizados

```sql
SELECT 
  pp.user_id,
  pp.plan_type,
  pp.amount,
  pp.payment_status,
  pp.created_at
FROM payment_preferences pp
WHERE pp.payment_status = 'approved'
ORDER BY pp.created_at DESC;
```

---

## 🔔 Webhooks (Opcional pero recomendado)

Para recibir notificaciones automáticas de pagos:

1. En Mercado Pago Dashboard → Webhooks
2. Agrega URL: `https://TU_PROYECTO.supabase.co/functions/v1/mercadopago-webhook`
3. Selecciona eventos: `payment`, `subscription`

Necesitarás crear otra Edge Function para manejar webhooks.

---

## 🎨 Personalización

### Cambiar precio

En `src/pages/Premium.jsx`:

```javascript
const plan = {
  price: 14000, // Precio actual: $14,000/mes
  // ...
};
```

### Cambiar features

Edita el array `features` en cada plan.

---

## 🐛 Solución de problemas

### Error: "No se recibió URL de pago"

- Verifica que la Edge Function esté desplegada
- Revisa que `MERCADOPAGO_ACCESS_TOKEN` esté configurado
- Chequea los logs en Supabase Edge Functions

### Error: "Usuario no autenticado"

- El usuario debe estar logueado para suscribirse
- Si no está logueado, será redirigido a `/register`

### Pago aprobado pero suscripción no activa

- Verifica que la tabla `profiles` tenga los campos correctos
- Revisa los logs en `payment_preferences`
- Asegúrate que `/payment/success` esté funcionando

---

## 📞 Soporte

- **Mercado Pago:** https://www.mercadopago.com.ar/developers/es/support
- **Supabase:** https://supabase.com/docs
- **Documentación completa:** Ver `CONFIGURACION.md`

---

## ✨ Próximos pasos sugeridos

1. ✅ Configurar webhooks para automatizar activación de suscripciones
2. ✅ Agregar panel de gestión de suscripción en `/perfil`
3. ✅ Implementar cancelación de suscripción
4. ✅ Agregar recordatorios de renovación por email
5. ✅ Implementar cupones de descuento

---

**¡Tu sistema de pagos está listo! 🎉**

Solo necesitas:
1. Agregar `VITE_MERCADOPAGO_PUBLIC_KEY` en `.env`
2. Ejecutar la migración SQL
3. Desplegar la Edge Function
4. ¡Probar!
