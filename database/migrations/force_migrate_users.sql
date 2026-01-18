-- Script para forzar la migración de usuarios
-- Ejecutar este SQL directamente en Supabase

-- 1. Verificar cuántos usuarios hay
DO $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE 'Usuarios en auth.users: %', auth_count;
  RAISE NOTICE 'Usuarios en profiles: %', profile_count;
  RAISE NOTICE 'Usuarios faltantes: %', (auth_count - profile_count);
END $$;

-- 2. Deshabilitar RLS completamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar restricciones que puedan estar bloqueando
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- 4. Insertar usuarios faltantes uno por uno con manejo de errores
DO $$
DECLARE
  user_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
      au.created_at
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO profiles (id, full_name, created_at, subscription_status, is_admin, subscription_end_date, last_payment_date, is_premium_permanent)
      VALUES (
        user_record.id,
        user_record.full_name,
        user_record.created_at,
        'inactive',
        false,
        NULL,
        NULL,
        false
      );
      inserted_count := inserted_count + 1;
      RAISE NOTICE 'Usuario insertado: % (%)', user_record.full_name, user_record.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error insertando usuario %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Total de usuarios insertados: %', inserted_count;
END $$;

-- 5. Rehabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verificar resultado final
SELECT COUNT(*) as total_profiles FROM profiles;

-- 7. Mostrar todos los usuarios
SELECT 
  p.id,
  p.full_name,
  p.subscription_status,
  p.is_admin,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 50;

-- 8. Marcar el admin correcto
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'euge060406@gmail.com'
);

-- 9. Verificar admin
SELECT 
  p.id,
  p.full_name,
  p.is_admin,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_admin = true;
