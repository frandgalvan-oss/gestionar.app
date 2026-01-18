-- Crear una vista que combine auth.users con profiles
-- Esta vista será accesible desde el cliente

-- Eliminar vista si existe
DROP VIEW IF EXISTS admin_users_view;

-- Crear vista que combina auth.users con profiles
CREATE VIEW admin_users_view AS
SELECT 
  au.id,
  au.email,
  COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.created_at,
  COALESCE(p.subscription_status, 'inactive') as subscription_status,
  p.subscription_end_date,
  p.last_payment_date,
  COALESCE(p.is_premium_permanent, false) as is_premium_permanent,
  COALESCE(p.is_admin, false) as is_admin
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;

-- Dar permisos para que los admins puedan leer esta vista
GRANT SELECT ON admin_users_view TO authenticated;

-- Crear política RLS para que solo admins puedan ver la vista
ALTER VIEW admin_users_view SET (security_invoker = true);

-- Verificar que funciona
SELECT COUNT(*) as total_users FROM admin_users_view;

-- Mostrar primeros 10 usuarios
SELECT * FROM admin_users_view LIMIT 10;
