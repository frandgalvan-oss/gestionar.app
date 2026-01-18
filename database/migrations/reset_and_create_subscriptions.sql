-- ============================================
-- RESET COMPLETO Y CREACIÓN DE SISTEMA DE SUSCRIPCIONES
-- ============================================
-- Este script elimina todo lo anterior y lo recrea desde cero
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PASO 1: ELIMINAR TODO LO EXISTENTE
-- ============================================

-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_log_subscription_change ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar funciones
DROP FUNCTION IF EXISTS log_subscription_change();
DROP FUNCTION IF EXISTS is_subscription_active(UUID);
DROP FUNCTION IF EXISTS update_expired_subscriptions();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_email(UUID);

-- Eliminar vista
DROP VIEW IF EXISTS subscription_stats;

-- Eliminar políticas
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
DROP POLICY IF EXISTS "Admins can view all payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can view own subscription changes" ON subscription_changes;
DROP POLICY IF EXISTS "Admins can view all subscription changes" ON subscription_changes;
DROP POLICY IF EXISTS "Only admins can insert subscription changes" ON subscription_changes;

-- Eliminar tablas
DROP TABLE IF EXISTS subscription_changes CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;

-- Eliminar columnas de profiles si existen
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_status CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_end_date CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_payment_date CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_premium_permanent CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin CASCADE;

-- ============================================
-- PASO 2: CREAR ESTRUCTURA NUEVA
-- ============================================

-- Agregar campos de suscripción a profiles
ALTER TABLE profiles 
ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_premium_permanent BOOLEAN DEFAULT false,
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Crear índices
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX idx_profiles_subscription_end_date ON profiles(subscription_end_date);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- Crear tabla de historial de pagos
CREATE TABLE payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_payment_date ON payment_history(payment_date);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- Crear tabla de cambios de suscripción
CREATE TABLE subscription_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  change_type VARCHAR(50) NOT NULL,
  previous_end_date TIMESTAMP WITH TIME ZONE,
  new_end_date TIMESTAMP WITH TIME ZONE,
  days_changed INTEGER,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_changes_user_id ON subscription_changes(user_id);
CREATE INDEX idx_subscription_changes_admin_id ON subscription_changes(admin_id);
CREATE INDEX idx_subscription_changes_created_at ON subscription_changes(created_at);

-- ============================================
-- PASO 3: MARCAR ADMINISTRADOR
-- ============================================

-- Marcar como admin usando el email directamente
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'euge060406@gmail.com'
);

-- Verificar que se marcó correctamente
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE is_admin = true;
  
  IF admin_count = 0 THEN
    RAISE NOTICE 'ADVERTENCIA: No se encontró ningún administrador. Verifica que el email euge060406@gmail.com existe en auth.users';
  ELSE
    RAISE NOTICE 'Éxito: % administrador(es) configurado(s)', admin_count;
  END IF;
END $$;

-- ============================================
-- PASO 4: FUNCIONES Y TRIGGERS
-- ============================================

-- Función para registrar cambios
CREATE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) OR 
     (OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date) THEN
    
    INSERT INTO subscription_changes (
      user_id,
      change_type,
      previous_end_date,
      new_end_date,
      days_changed
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.is_premium_permanent AND NOT OLD.is_premium_permanent THEN 'grant_permanent'
        WHEN NEW.subscription_status = 'cancelled' THEN 'cancel'
        WHEN NEW.subscription_end_date > OLD.subscription_end_date THEN 'extend'
        WHEN NEW.subscription_end_date < OLD.subscription_end_date THEN 'reduce'
        ELSE 'update'
      END,
      OLD.subscription_end_date,
      NEW.subscription_end_date,
      CASE 
        WHEN NEW.subscription_end_date IS NOT NULL AND OLD.subscription_end_date IS NOT NULL 
        THEN EXTRACT(DAY FROM (NEW.subscription_end_date - OLD.subscription_end_date))
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar cambios
CREATE TRIGGER trigger_log_subscription_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_subscription_change();

-- Función para verificar suscripción activa
CREATE FUNCTION is_subscription_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT 
    subscription_status,
    subscription_end_date,
    is_premium_permanent
  INTO profile_record
  FROM profiles
  WHERE id = user_id;
  
  IF profile_record.is_premium_permanent THEN
    RETURN TRUE;
  END IF;
  
  IF profile_record.subscription_status = 'active' AND 
     (profile_record.subscription_end_date IS NULL OR 
      profile_record.subscription_end_date > NOW()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Vista de estadísticas
CREATE VIEW subscription_stats AS
SELECT 
  COUNT(*) FILTER (WHERE subscription_status = 'active' AND 
                         (subscription_end_date > NOW() OR is_premium_permanent)) as active_subscriptions,
  COUNT(*) FILTER (WHERE subscription_status = 'active' AND 
                         subscription_end_date <= NOW() AND 
                         NOT is_premium_permanent) as expired_subscriptions,
  COUNT(*) FILTER (WHERE subscription_status = 'cancelled') as cancelled_subscriptions,
  COUNT(*) FILTER (WHERE is_premium_permanent) as permanent_premium,
  COUNT(*) FILTER (WHERE subscription_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_soon,
  SUM(CASE WHEN last_payment_date >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as payments_last_month
FROM profiles;

-- Función para actualizar suscripciones expiradas
CREATE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET subscription_status = 'inactive'
  WHERE subscription_status = 'active'
    AND subscription_end_date < NOW()
    AND NOT is_premium_permanent;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 5: SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_history
CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment history" ON payment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Políticas para subscription_changes
CREATE POLICY "Users can view own subscription changes" ON subscription_changes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription changes" ON subscription_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can insert subscription changes" ON subscription_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- PASO 6: MIGRAR USUARIOS EXISTENTES Y CREAR TRIGGER
-- ============================================

-- Deshabilitar RLS temporalmente para la migración
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Crear perfiles para todos los usuarios de auth.users que no tienen perfil
INSERT INTO profiles (id, full_name, created_at, subscription_status, is_admin)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.created_at,
  'inactive',
  false
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Crear función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, created_at, subscription_status, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.created_at,
    'inactive',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Rehabilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 7: FUNCIÓN PARA OBTENER EMAIL
-- ============================================

-- Crear función para obtener el email de un usuario
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;

-- ============================================
-- PASO 7: COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE payment_history IS 'Historial de todos los pagos realizados por los usuarios';
COMMENT ON TABLE subscription_changes IS 'Registro de auditoría de todos los cambios en las suscripciones';
COMMENT ON COLUMN profiles.subscription_status IS 'Estado de la suscripción: active, inactive, cancelled, trial';
COMMENT ON COLUMN profiles.subscription_end_date IS 'Fecha de finalización de la suscripción actual';
COMMENT ON COLUMN profiles.last_payment_date IS 'Fecha del último pago realizado';
COMMENT ON COLUMN profiles.is_premium_permanent IS 'Indica si el usuario tiene premium permanente';
COMMENT ON COLUMN profiles.is_admin IS 'Indica si el usuario tiene permisos de administrador';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar información del administrador
SELECT 
  p.id,
  au.email,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_admin = true;

-- Fin del script
