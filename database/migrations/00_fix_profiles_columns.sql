-- ============================================
-- CORREGIR TABLA PROFILES - AGREGAR COLUMNAS FALTANTES
-- ============================================
-- Ejecutar PRIMERO antes de cualquier otra migración

-- Agregar columnas faltantes si no existen
DO $$ 
BEGIN
  -- Agregar subscription_status si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';
  END IF;

  -- Agregar subscription_end_date si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Agregar last_payment_date si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Agregar is_premium_permanent si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_premium_permanent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium_permanent BOOLEAN DEFAULT false;
  END IF;

  -- Agregar is_admin si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;

  -- Agregar trial_ends_at si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Agregar is_premium si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date ON profiles(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Actualizar usuarios existentes con valores por defecto
UPDATE profiles 
SET 
  subscription_status = COALESCE(subscription_status, 'inactive'),
  is_premium_permanent = COALESCE(is_premium_permanent, false),
  is_admin = COALESCE(is_admin, false),
  is_premium = COALESCE(is_premium, false)
WHERE subscription_status IS NULL 
   OR is_premium_permanent IS NULL 
   OR is_admin IS NULL 
   OR is_premium IS NULL;

-- Verificar estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
