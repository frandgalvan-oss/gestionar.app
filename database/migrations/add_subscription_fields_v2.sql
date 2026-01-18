-- Migración para agregar campos de suscripción y administrador (Versión 2)
-- Ejecutar en Supabase SQL Editor
-- Esta versión elimina políticas existentes antes de crearlas

-- 1. Agregar campos de suscripción a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_premium_permanent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date ON profiles(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- 3. Crear tabla de historial de pagos
CREATE TABLE IF NOT EXISTS payment_history (
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

-- 4. Crear índices para payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date ON payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- 5. Crear tabla de cambios de suscripción (auditoría)
CREATE TABLE IF NOT EXISTS subscription_changes (
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

-- 6. Crear índices para subscription_changes
CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON subscription_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_admin_id ON subscription_changes(admin_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_created_at ON subscription_changes(created_at);

-- 7. Marcar al administrador principal
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'eug060406@gmail.com'
);

-- 8. Crear función para registrar cambios de suscripción
CREATE OR REPLACE FUNCTION log_subscription_change()
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

-- 9. Crear trigger para registrar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_log_subscription_change ON profiles;
CREATE TRIGGER trigger_log_subscription_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_subscription_change();

-- 10. Crear función para verificar si la suscripción está activa
CREATE OR REPLACE FUNCTION is_subscription_active(user_id UUID)
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

-- 11. Crear vista para estadísticas de suscripciones
CREATE OR REPLACE VIEW subscription_stats AS
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

-- 12. Habilitar RLS en las nuevas tablas
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;

-- 13. ELIMINAR políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
DROP POLICY IF EXISTS "Admins can view all payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can view own subscription changes" ON subscription_changes;
DROP POLICY IF EXISTS "Admins can view all subscription changes" ON subscription_changes;
DROP POLICY IF EXISTS "Only admins can insert subscription changes" ON subscription_changes;

-- 14. Crear políticas de seguridad RLS

-- Política para payment_history: usuarios pueden ver solo sus propios pagos
CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para payment_history: admins pueden ver todo
CREATE POLICY "Admins can view all payment history" ON payment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Política para subscription_changes: usuarios pueden ver sus propios cambios
CREATE POLICY "Users can view own subscription changes" ON subscription_changes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para subscription_changes: admins pueden ver todo
CREATE POLICY "Admins can view all subscription changes" ON subscription_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Política para subscription_changes: solo admins pueden insertar
CREATE POLICY "Only admins can insert subscription changes" ON subscription_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 15. Comentarios en las tablas para documentación
COMMENT ON TABLE payment_history IS 'Historial de todos los pagos realizados por los usuarios';
COMMENT ON TABLE subscription_changes IS 'Registro de auditoría de todos los cambios en las suscripciones';
COMMENT ON COLUMN profiles.subscription_status IS 'Estado de la suscripción: active, inactive, cancelled, trial';
COMMENT ON COLUMN profiles.subscription_end_date IS 'Fecha de finalización de la suscripción actual';
COMMENT ON COLUMN profiles.last_payment_date IS 'Fecha del último pago realizado';
COMMENT ON COLUMN profiles.is_premium_permanent IS 'Indica si el usuario tiene premium permanente (sin fecha de expiración)';
COMMENT ON COLUMN profiles.is_admin IS 'Indica si el usuario tiene permisos de administrador';

-- 16. Función para actualizar automáticamente el estado de suscripciones expiradas
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET subscription_status = 'inactive'
  WHERE subscription_status = 'active'
    AND subscription_end_date < NOW()
    AND NOT is_premium_permanent;
END;
$$ LANGUAGE plpgsql;

-- Fin de la migración
