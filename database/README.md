# Migración de Base de Datos - Sistema de Suscripciones

## Descripción
Esta migración agrega funcionalidad completa de gestión de suscripciones y panel de administrador al sistema.

## Características Agregadas

### 1. Campos de Suscripción en Profiles
- `subscription_status`: Estado de la suscripción (active, inactive, cancelled, trial)
- `subscription_end_date`: Fecha de finalización de la suscripción
- `last_payment_date`: Fecha del último pago
- `is_premium_permanent`: Premium permanente sin fecha de expiración
- `is_admin`: Permisos de administrador

### 2. Tabla de Historial de Pagos
Registra todos los pagos realizados por los usuarios con:
- Monto y moneda
- Método de pago
- Estado del pago
- Fecha y descripción

### 3. Tabla de Auditoría de Cambios
Registra automáticamente todos los cambios en las suscripciones:
- Extensiones de membresía
- Reducciones de días
- Cancelaciones
- Otorgamiento de premium permanente
- Quién realizó el cambio (admin)

### 4. Funciones y Triggers
- Verificación automática de suscripciones activas
- Registro automático de cambios (trigger)
- Actualización de suscripciones expiradas
- Vista de estadísticas de suscripciones

### 5. Seguridad (RLS)
- Políticas de acceso para usuarios y administradores
- Los usuarios solo ven sus propios datos
- Los administradores tienen acceso completo

## Instrucciones de Instalación

### Paso 1: Acceder a Supabase
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar la Migración
1. Abre el archivo `migrations/add_subscription_fields.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run** o presiona `Ctrl + Enter`

### Paso 3: Verificar la Instalación
Ejecuta esta consulta para verificar que todo se instaló correctamente:

```sql
-- Verificar que las columnas se agregaron
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('subscription_status', 'subscription_end_date', 'is_premium_permanent', 'is_admin');

-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('payment_history', 'subscription_changes');

-- Verificar que el admin fue marcado
SELECT email, is_admin 
FROM profiles 
WHERE email = 'eug060406@gmail.com';
```

### Paso 4: Configurar Cron Job (Opcional)
Para actualizar automáticamente las suscripciones expiradas cada día:

1. Ve a **Database** → **Cron Jobs** en Supabase
2. Crea un nuevo cron job con:
   - **Name**: `update-expired-subscriptions`
   - **Schedule**: `0 0 * * *` (diariamente a medianoche)
   - **Command**: `SELECT update_expired_subscriptions()`

O ejecuta manualmente:
```sql
SELECT cron.schedule(
  'update-expired-subscriptions', 
  '0 0 * * *', 
  'SELECT update_expired_subscriptions()'
);
```

## Uso del Panel de Administrador

### Acceso
Solo la cuenta `eug060406@gmail.com` tiene acceso al panel de administrador.

### URL
`/admin/suscripciones`

### Funcionalidades Disponibles

1. **Ver Todos los Usuarios**
   - Lista completa de usuarios registrados
   - Estado de suscripción
   - Fecha de vencimiento
   - Último pago

2. **Buscar Usuarios**
   - Por nombre
   - Por email
   - Por nombre de empresa

3. **Gestionar Suscripciones**
   - Extender membresía (+7, +30, +90 días)
   - Reducir membresía (-7, -30, -90 días)
   - Otorgar premium permanente
   - Cancelar cuenta

4. **Auditoría**
   - Todos los cambios quedan registrados en `subscription_changes`
   - Se puede ver quién hizo qué cambio y cuándo

## Consultas Útiles

### Ver estadísticas generales
```sql
SELECT * FROM subscription_stats;
```

### Ver usuarios con suscripción activa
```sql
SELECT 
  email, 
  full_name, 
  subscription_status, 
  subscription_end_date,
  is_premium_permanent
FROM profiles
WHERE is_subscription_active(id) = true;
```

### Ver usuarios que expiran pronto (próximos 7 días)
```sql
SELECT 
  email, 
  full_name, 
  subscription_end_date,
  EXTRACT(DAY FROM (subscription_end_date - NOW())) as days_remaining
FROM profiles
WHERE subscription_status = 'active'
  AND subscription_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND NOT is_premium_permanent
ORDER BY subscription_end_date;
```

### Ver historial de cambios de un usuario
```sql
SELECT 
  change_type,
  previous_end_date,
  new_end_date,
  days_changed,
  created_at
FROM subscription_changes
WHERE user_id = 'USER_ID_AQUI'
ORDER BY created_at DESC;
```

### Ver pagos del último mes
```sql
SELECT 
  p.email,
  p.full_name,
  ph.amount,
  ph.payment_date,
  ph.status
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.payment_date >= NOW() - INTERVAL '30 days'
ORDER BY ph.payment_date DESC;
```

## Rollback (Deshacer Migración)

Si necesitas deshacer la migración:

```sql
-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_log_subscription_change ON profiles;

-- Eliminar funciones
DROP FUNCTION IF EXISTS log_subscription_change();
DROP FUNCTION IF EXISTS is_subscription_active(UUID);
DROP FUNCTION IF EXISTS update_expired_subscriptions();

-- Eliminar vista
DROP VIEW IF EXISTS subscription_stats;

-- Eliminar tablas
DROP TABLE IF EXISTS subscription_changes;
DROP TABLE IF EXISTS payment_history;

-- Eliminar columnas de profiles
ALTER TABLE profiles 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_end_date,
DROP COLUMN IF EXISTS last_payment_date,
DROP COLUMN IF EXISTS is_premium_permanent,
DROP COLUMN IF EXISTS is_admin;
```

## Notas Importantes

1. **Backup**: Siempre haz un backup de tu base de datos antes de ejecutar migraciones
2. **Testing**: Prueba primero en un entorno de desarrollo
3. **Permisos**: Solo `eug060406@gmail.com` tiene acceso de administrador
4. **Seguridad**: Las políticas RLS protegen los datos de los usuarios
5. **Auditoría**: Todos los cambios quedan registrados automáticamente

## Soporte

Si encuentras algún problema durante la migración, verifica:
- Que tienes permisos de administrador en Supabase
- Que no hay conflictos con tablas o columnas existentes
- Los logs de error en el SQL Editor

## Próximos Pasos

Después de ejecutar la migración:
1. Accede al panel de administrador en `/admin/suscripciones`
2. Verifica que puedes ver la lista de usuarios
3. Prueba las funcionalidades de gestión de suscripciones
4. Configura el cron job para actualización automática
