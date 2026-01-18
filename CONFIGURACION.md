# 📋 Guía de Configuración Completa

Este documento te guiará paso a paso para configurar todas las funcionalidades de la aplicación.

---

## 🔐 1. Configuración de Supabase - Email Templates

### Paso 1: Configurar Email de Confirmación (Sign Up)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** → **Email Templates**
3. Selecciona **Confirm signup** (Confirmar registro)
4. Personaliza el template con el siguiente contenido:

```html
<h2>¡Bienvenido a Sistema de Gestión! 🎉</h2>

<p>Hola,</p>

<p>¡Gracias por registrarte en nuestro Sistema de Gestión Empresarial con Inteligencia Artificial!</p>

<p>Para activar tu cuenta y comenzar tu <strong>prueba gratuita de 21 días</strong>, confirma tu correo electrónico haciendo clic en el siguiente botón:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background-color: #111827; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
    Confirmar mi cuenta
  </a>
</p>

<p>O copia y pega este enlace en tu navegador:</p>
<p style="word-break: break-all; color: #6B7280; font-size: 14px;">{{ .ConfirmationURL }}</p>

<div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 24px 0; border-radius: 4px;">
  <p style="margin: 0; color: #1E40AF; font-weight: bold;">🎁 Tu prueba gratuita incluye:</p>
  <ul style="color: #1E40AF; margin: 8px 0;">
    <li>Acceso completo a todas las funcionalidades</li>
    <li>Chat con IA para análisis financiero</li>
    <li>Gestión de inventario y movimientos</li>
    <li>Proyecciones automáticas con IA</li>
    <li>Cálculo de impuestos (PyME)</li>
    <li>Simulador de créditos (PyME)</li>
  </ul>
</div>

<p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
  <strong>💡 Consejo:</strong> Una vez confirmada tu cuenta, completa los datos de tu negocio en "Mi Negocio" para personalizar tu experiencia.
</p>

<p style="margin-top: 32px;">Si no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>

<p style="margin-top: 24px;">
  Saludos,<br>
  <strong>El equipo de Sistema de Gestión</strong>
</p>

<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">

<p style="color: #9CA3AF; font-size: 12px; text-align: center;">
  Este enlace expirará en 24 horas por seguridad.
</p>
```

5. Guarda los cambios

### Paso 2: Configurar Email de Recuperación de Contraseña

1. En **Email Templates**, selecciona **Reset Password** (Recuperar Contraseña)
2. Personaliza el template con el siguiente contenido:

```html
<h2>Recupera tu contraseña</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Sistema de Gestión.</p>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer contraseña</a></p>
<p>Este enlace expirará en 60 minutos.</p>
<p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
<p>Saludos,<br>El equipo de Sistema de Gestión</p>
```

3. Guarda los cambios

### Paso 3: Configurar Redirect URLs

1. En **Authentication** → **URL Configuration**
2. Agrega las siguientes URLs en **Redirect URLs**:
   - `http://localhost:5175/reset-password` (para desarrollo)
   - `https://tudominio.com/reset-password` (para producción)
3. Guarda los cambios

### Paso 4: Ejecutar Migraciones SQL

Ejecuta los siguientes archivos SQL en **SQL Editor** de Supabase:

#### a) Crear tabla de preferencias de pago
```sql
-- Ejecutar: database/migrations/create_payment_preferences.sql
```

#### b) Funciones de administración (si aún no lo hiciste)
```sql
-- Ejecutar: database/migrations/create_admin_function.sql
-- Ejecutar: database/migrations/create_admin_update_functions.sql
```

### Paso 5: Desplegar Edge Function para Mercado Pago

Para procesar pagos de forma segura, necesitas desplegar una Edge Function en Supabase:

#### Opción A: Usando Supabase CLI (Recomendado)

1. **Instalar Supabase CLI:**
```bash
npm install -g supabase
```

2. **Iniciar sesión:**
```bash
supabase login
```

3. **Vincular tu proyecto:**
```bash
supabase link --project-ref tu-project-ref
```

4. **Configurar variables de entorno:**
En el dashboard de Supabase, ve a **Edge Functions** → **Settings** y agrega:
- `MERCADOPAGO_ACCESS_TOKEN`: Tu Access Token de Mercado Pago

5. **Desplegar la función:**
```bash
supabase functions deploy create-preference
```

#### Opción B: Sin CLI (Manual)

Si no puedes usar la CLI, puedes crear la función manualmente:

1. Ve a **Edge Functions** en tu dashboard de Supabase
2. Crea una nueva función llamada `create-preference`
3. Copia el contenido de `supabase/functions/create-preference/index.ts`
4. Configura las variables de entorno en Settings
5. Despliega la función

**⚠️ IMPORTANTE:** La Edge Function es necesaria para crear preferencias de pago de forma segura. Sin ella, los pagos no funcionarán.

---

## 💳 2. Configuración de Mercado Pago

### Paso 1: Crear Cuenta en Mercado Pago

1. Ve a [Mercado Pago Argentina](https://www.mercadopago.com.ar)
2. Crea una cuenta o inicia sesión
3. Completa la verificación de identidad (requerido para recibir pagos)

### Paso 2: Obtener Credenciales

1. Ve al [Panel de Desarrolladores](https://www.mercadopago.com.ar/developers)
2. Navega a **Tus integraciones** → **Credenciales**
3. Encontrarás dos tipos de credenciales:

   **Credenciales de Prueba (Testing):**
   - Public Key: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Access Token: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

   **Credenciales de Producción (Real):**
   - Public Key: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Access Token: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

4. Copia la **Public Key** (empieza con `TEST-` o `APP_USR-`)

### Paso 3: Configurar Variables de Entorno

1. Abre tu archivo `.env` en la raíz del proyecto
2. Agrega la siguiente línea con tu Public Key de producción:

```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-2ba12f7b-dfb4-4d52-8f19-662b7be99c57
```

3. **Reinicia el servidor de desarrollo:**
```bash
npm run dev
```

**⚠️ IMPORTANTE - Seguridad:**
- ✅ La **Public Key** (`APP_USR-...`) es segura para usar en el cliente
- ❌ El **Access Token** NUNCA debe estar en el código del cliente
- ❌ El **Client Secret** NUNCA debe estar en el código del cliente
- 🔒 Access Token y Client Secret solo deben usarse en el backend
- 📝 Revisa el archivo `CREDENCIALES_MERCADOPAGO.txt` para más detalles

### Paso 4: Configurar Webhooks (Opcional pero Recomendado)

Los webhooks te permiten recibir notificaciones cuando un pago es procesado.

1. En el Panel de Desarrolladores, ve a **Webhooks**
2. Crea un nuevo webhook con la URL:
   - Desarrollo: `https://tu-dominio-ngrok.ngrok.io/api/mercadopago/webhook`
   - Producción: `https://tudominio.com/api/mercadopago/webhook`
3. Selecciona los eventos:
   - `payment` (pagos)
   - `subscription` (suscripciones)

**Nota:** Para desarrollo local, necesitarás usar [ngrok](https://ngrok.com/) para exponer tu servidor local.

### Paso 5: Crear Endpoint Backend (Recomendado para Producción)

Para producción, es recomendable crear un endpoint backend que genere las preferencias de pago de forma segura:

```javascript
// Ejemplo: api/mercadopago/create-preference.js
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { planType, planPrice, planName, userId, userEmail } = req.body;

  const preference = {
    items: [
      {
        title: planName,
        quantity: 1,
        unit_price: planPrice,
        currency_id: 'ARS'
      }
    ],
    payer: {
      email: userEmail
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL}/checkout/success`,
      failure: `${process.env.FRONTEND_URL}/checkout/failure`,
      pending: `${process.env.FRONTEND_URL}/checkout/pending`
    },
    auto_return: 'approved',
    external_reference: `${userId}_${planType}_${Date.now()}`,
    notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ preferenceId: response.body.id });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error creating payment preference' });
  }
}
```

---

## 🧪 3. Probar la Integración

### Recuperación de Contraseña

1. Ve a la landing page (`http://localhost:5175`)
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email registrado
4. Revisa tu bandeja de entrada
5. Haz clic en el enlace del email
6. Ingresa tu nueva contraseña
7. Deberías ser redirigido a la landing para iniciar sesión

### Mercado Pago (Modo Test)

1. Ve a `/premium` y selecciona un plan
2. Serás redirigido a `/checkout`
3. Verás el componente de Mercado Pago (en modo desarrollo mostrará instrucciones)
4. Para probar pagos reales en modo test:
   - Usa las [tarjetas de prueba de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing)
   - Tarjeta aprobada: `5031 7557 3453 0604` (Mastercard)
   - CVV: cualquier 3 dígitos
   - Fecha: cualquier fecha futura

---

## 📊 4. Verificar Configuración en Supabase

### Verificar Tabla de Preferencias de Pago

```sql
-- Ejecutar en SQL Editor
SELECT * FROM payment_preferences ORDER BY created_at DESC LIMIT 10;
```

### Verificar Usuarios con Premium Permanente

```sql
-- Ejecutar en SQL Editor
SELECT 
  id,
  email,
  is_premium_permanent,
  subscription_status,
  subscription_end_date
FROM profiles
WHERE is_premium_permanent = true;
```

### Otorgar Premium Permanente a un Usuario (Admin)

1. Ve a `/admin/suscripciones` (solo accesible con email `euge060406@gmail.com`)
2. Busca el usuario
3. Haz clic en "Otorgar Premium Permanente"
4. El usuario debería poder acceder al dashboard sin restricciones

---

## ✅ Checklist de Configuración

- [ ] Email templates configurados en Supabase
- [ ] Redirect URLs agregadas en Supabase Auth
- [ ] Tabla `payment_preferences` creada
- [ ] Funciones de admin ejecutadas (`create_admin_function.sql`, `create_admin_update_functions.sql`)
- [ ] Cuenta de Mercado Pago creada y verificada
- [ ] Public Key de Mercado Pago agregada en `.env`
- [ ] Probada recuperación de contraseña
- [ ] Probado premium permanente en TrialCheck
- [ ] (Opcional) Webhooks configurados
- [ ] (Opcional) Endpoint backend para preferencias creado

---

## 🐛 Solución de Problemas

### No recibo emails de recuperación de contraseña

1. Verifica que el email template esté configurado
2. Revisa la carpeta de spam
3. Verifica que las Redirect URLs estén correctas
4. Revisa los logs en Supabase Dashboard → Logs

### Mercado Pago no se muestra

1. Verifica que `VITE_MERCADOPAGO_PUBLIC_KEY` esté en `.env`
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Verifica que la Public Key sea correcta (debe empezar con `TEST-` o `APP_USR-`)

### Usuario con premium permanente sigue viendo bloqueo

1. Verifica en Supabase que `is_premium_permanent = true`
2. Cierra sesión y vuelve a iniciar sesión
3. Verifica que no haya errores en la consola del navegador

### Error al crear preferencia de pago

1. Verifica que la tabla `payment_preferences` exista
2. Verifica los permisos RLS en Supabase
3. Revisa la consola del navegador para más detalles

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs en Supabase Dashboard
3. Verifica que todas las variables de entorno estén configuradas
4. Asegúrate de haber ejecutado todas las migraciones SQL

---

## 🚀 Próximos Pasos

Una vez configurado todo:

1. **Desarrollo:** Usa credenciales de TEST de Mercado Pago
2. **Producción:** 
   - Cambia a credenciales de producción
   - Configura un dominio real
   - Implementa el endpoint backend para preferencias
   - Configura webhooks en producción
   - Habilita HTTPS
