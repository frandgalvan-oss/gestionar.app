# 📋 Guía de Configuración Completa

Este documento te guiará paso a paso para configurar todas las funcionalidades de la aplicación.

---

## 🔐 1. Configuración de Supabase - Recuperación de Contraseña

### Paso 1: Configurar Email Templates

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** → **Email Templates**
3. Selecciona **Reset Password** (Recuperar Contraseña)
4. Personaliza el template con el siguiente contenido:

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

5. En **Redirect URLs**, agrega:
   - `http://localhost:5175/reset-password` (para desarrollo)
   - `https://tudominio.com/reset-password` (para producción)

6. Guarda los cambios

### Paso 2: Ejecutar Migraciones SQL

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
2. Agrega la siguiente línea:

```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key-aqui
```

**⚠️ Importante:**
- Para desarrollo, usa las credenciales de **TEST**
- Para producción, usa las credenciales de **APP_USR**
- **NUNCA** compartas tu Access Token en el código del cliente

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
