-- Script para migrar usuarios de auth.users a profiles
-- Ejecutar DESPUÉS de reset_and_create_subscriptions.sql

-- Ver cuántos usuarios hay en auth.users
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Ver cuántos usuarios hay en profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Ver usuarios que NO tienen perfil
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Migrar usuarios que no tienen perfil
INSERT INTO profiles (id, full_name, created_at, subscription_status, is_admin)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.created_at,
  'inactive',
  false
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar resultado
SELECT COUNT(*) as total_profiles_after FROM profiles;

-- Mostrar todos los perfiles creados
SELECT 
  p.id,
  p.full_name,
  p.subscription_status,
  p.is_admin,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
