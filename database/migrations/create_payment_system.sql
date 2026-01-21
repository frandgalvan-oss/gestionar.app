-- ============================================
-- SISTEMA COMPLETO DE PAGOS Y SUSCRIPCIONES
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de recibos/comprobantes de pago
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_id VARCHAR(255) NOT NULL,
  preference_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(100),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  days_granted INTEGER NOT NULL,
  mercadopago_data JSONB,
  receipt_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payment_receipts
CREATE INDEX IF NOT EXISTS idx_payment_receipts_user_id ON payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment_id ON payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment_date ON payment_receipts(payment_date);

-- 2. Función para generar número de recibo único
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  receipt_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    receipt_num := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT COUNT(*) INTO exists_check
    FROM payment_receipts
    WHERE receipt_number = receipt_num;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para generar número de recibo automáticamente
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_receipt_number ON payment_receipts;
CREATE TRIGGER trigger_set_receipt_number
  BEFORE INSERT ON payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION set_receipt_number();

-- 4. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_receipts_updated_at ON payment_receipts;
CREATE TRIGGER trigger_update_payment_receipts_updated_at
  BEFORE UPDATE ON payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_receipts_updated_at();

-- 5. Función para actualizar suscripción después de pago exitoso
CREATE OR REPLACE FUNCTION process_successful_payment(
  p_user_id UUID,
  p_payment_id VARCHAR,
  p_preference_id VARCHAR,
  p_amount DECIMAL,
  p_payment_method VARCHAR,
  p_mercadopago_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_current_end_date TIMESTAMP WITH TIME ZONE;
  v_new_start_date TIMESTAMP WITH TIME ZONE;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
  v_days_granted INTEGER := 30;
  v_receipt_id UUID;
  v_receipt_number TEXT;
BEGIN
  -- Obtener fecha de fin actual de suscripción
  SELECT subscription_end_date INTO v_current_end_date
  FROM profiles
  WHERE id = p_user_id;

  -- Calcular nuevas fechas
  IF v_current_end_date IS NULL OR v_current_end_date < NOW() THEN
    -- Si no tiene suscripción activa, empezar desde ahora
    v_new_start_date := NOW();
  ELSE
    -- Si tiene suscripción activa, extender desde la fecha actual de fin
    v_new_start_date := v_current_end_date;
  END IF;

  v_new_end_date := v_new_start_date + INTERVAL '30 days';

  -- Actualizar perfil del usuario
  UPDATE profiles
  SET 
    subscription_status = 'active',
    subscription_end_date = v_new_end_date,
    last_payment_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Crear recibo de pago
  INSERT INTO payment_receipts (
    user_id,
    payment_id,
    preference_id,
    amount,
    status,
    payment_method,
    payment_date,
    subscription_start_date,
    subscription_end_date,
    days_granted,
    mercadopago_data
  )
  VALUES (
    p_user_id,
    p_payment_id,
    p_preference_id,
    p_amount,
    'approved',
    p_payment_method,
    NOW(),
    v_new_start_date,
    v_new_end_date,
    v_days_granted,
    p_mercadopago_data
  )
  RETURNING id, receipt_number INTO v_receipt_id, v_receipt_number;

  -- Actualizar estado de la preferencia de pago
  UPDATE payment_preferences
  SET 
    status = 'completed',
    payment_id = p_payment_id,
    payment_status = 'approved',
    updated_at = NOW()
  WHERE preference_id = p_preference_id;

  -- Retornar información del recibo
  RETURN jsonb_build_object(
    'success', true,
    'receipt_id', v_receipt_id,
    'receipt_number', v_receipt_number,
    'subscription_start_date', v_new_start_date,
    'subscription_end_date', v_new_end_date,
    'days_granted', v_days_granted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para obtener información de suscripción del usuario
CREATE OR REPLACE FUNCTION get_subscription_info(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_days_remaining INTEGER;
  v_is_active BOOLEAN;
  v_total_payments INTEGER;
  v_total_spent DECIMAL;
BEGIN
  -- Obtener información del perfil
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  -- Calcular días restantes
  IF v_profile.subscription_end_date IS NOT NULL AND v_profile.subscription_end_date > NOW() THEN
    v_days_remaining := EXTRACT(DAY FROM (v_profile.subscription_end_date - NOW()));
    v_is_active := true;
  ELSE
    v_days_remaining := 0;
    v_is_active := false;
  END IF;

  -- Obtener estadísticas de pagos
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount), 0)
  INTO v_total_payments, v_total_spent
  FROM payment_receipts
  WHERE user_id = p_user_id AND status = 'approved';

  -- Retornar información completa
  RETURN jsonb_build_object(
    'subscription_status', v_profile.subscription_status,
    'subscription_end_date', v_profile.subscription_end_date,
    'last_payment_date', v_profile.last_payment_date,
    'is_active', v_is_active,
    'days_remaining', v_days_remaining,
    'is_premium_permanent', v_profile.is_premium_permanent,
    'total_payments', v_total_payments,
    'total_spent', v_total_spent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Habilitar RLS en payment_receipts
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para payment_receipts
DROP POLICY IF EXISTS "Users can view own receipts" ON payment_receipts;
CREATE POLICY "Users can view own receipts"
  ON payment_receipts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own receipts" ON payment_receipts;
CREATE POLICY "Users can insert own receipts"
  ON payment_receipts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. Dar permisos para ejecutar las funciones
GRANT EXECUTE ON FUNCTION process_successful_payment(UUID, VARCHAR, VARCHAR, DECIMAL, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO authenticated;

-- 10. Comentarios
COMMENT ON TABLE payment_receipts IS 'Almacena todos los comprobantes de pago con información detallada';
COMMENT ON COLUMN payment_receipts.receipt_number IS 'Número único de recibo generado automáticamente';
COMMENT ON COLUMN payment_receipts.days_granted IS 'Días de suscripción otorgados por este pago';
COMMENT ON FUNCTION process_successful_payment IS 'Procesa un pago exitoso y actualiza la suscripción del usuario';
COMMENT ON FUNCTION get_subscription_info IS 'Obtiene información completa de la suscripción de un usuario';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar estructura de payment_receipts
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_receipts'
ORDER BY ordinal_position;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
