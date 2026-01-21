-- ============================================
-- SISTEMA DE PAGOS NIVEL EMPRESARIAL
-- Seguridad y Robustez tipo Netflix/Spotify
-- ============================================

-- ============================================
-- PARTE 1: TABLAS DE AUDITORÍA Y SEGURIDAD
-- ============================================

-- Tabla de logs de auditoría para todos los eventos de pago
CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL, -- payment, subscription, security, error
  severity VARCHAR(20) NOT NULL, -- info, warning, error, critical
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_audit_logs_user_id ON payment_audit_logs(user_id);
CREATE INDEX idx_payment_audit_logs_event_type ON payment_audit_logs(event_type);
CREATE INDEX idx_payment_audit_logs_event_category ON payment_audit_logs(event_category);
CREATE INDEX idx_payment_audit_logs_severity ON payment_audit_logs(severity);
CREATE INDEX idx_payment_audit_logs_created_at ON payment_audit_logs(created_at DESC);

-- Tabla de intentos de pago (para detectar fraude)
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- initiated, processing, completed, failed, cancelled
  failure_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  fingerprint VARCHAR(255), -- Device fingerprint
  risk_score INTEGER DEFAULT 0, -- 0-100, mayor = más riesgoso
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX idx_payment_attempts_is_suspicious ON payment_attempts(is_suspicious);
CREATE INDEX idx_payment_attempts_created_at ON payment_attempts(created_at DESC);
CREATE INDEX idx_payment_attempts_ip_address ON payment_attempts(ip_address);

-- Tabla de bloqueos de seguridad
CREATE TABLE IF NOT EXISTS security_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL, -- payment_suspended, account_frozen, fraud_detected
  reason TEXT NOT NULL,
  blocked_until TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT false,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_security_blocks_user_id ON security_blocks(user_id);
CREATE INDEX idx_security_blocks_block_type ON security_blocks(block_type);
CREATE INDEX idx_security_blocks_is_permanent ON security_blocks(is_permanent);

-- Tabla de webhooks de Mercado Pago (para idempotencia)
CREATE TABLE IF NOT EXISTS mercadopago_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payment_id VARCHAR(255),
  preference_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mercadopago_webhooks_webhook_id ON mercadopago_webhooks(webhook_id);
CREATE INDEX idx_mercadopago_webhooks_payment_id ON mercadopago_webhooks(payment_id);
CREATE INDEX idx_mercadopago_webhooks_processed ON mercadopago_webhooks(processed);
CREATE INDEX idx_mercadopago_webhooks_created_at ON mercadopago_webhooks(created_at DESC);

-- Tabla de estados de suscripción (para tracking completo)
CREATE TABLE IF NOT EXISTS subscription_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  previous_end_date TIMESTAMP WITH TIME ZONE,
  new_end_date TIMESTAMP WITH TIME ZONE,
  trigger_event VARCHAR(100) NOT NULL, -- payment_success, payment_failed, manual_change, expiration
  payment_receipt_id UUID REFERENCES payment_receipts(id),
  changed_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_state_history_user_id ON subscription_state_history(user_id);
CREATE INDEX idx_subscription_state_history_new_status ON subscription_state_history(new_status);
CREATE INDEX idx_subscription_state_history_created_at ON subscription_state_history(created_at DESC);

-- ============================================
-- PARTE 2: FUNCIONES DE SEGURIDAD
-- ============================================

-- Función para registrar eventos de auditoría
CREATE OR REPLACE FUNCTION log_payment_event(
  p_user_id UUID,
  p_event_type VARCHAR,
  p_event_category VARCHAR,
  p_severity VARCHAR,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO payment_audit_logs (
    user_id,
    event_type,
    event_category,
    severity,
    description,
    metadata,
    ip_address,
    user_agent,
    request_id
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_event_category,
    p_severity,
    p_description,
    p_metadata,
    p_ip_address,
    p_user_agent,
    gen_random_uuid()::TEXT
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario está bloqueado
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_blocked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM security_blocks
    WHERE user_id = p_user_id
      AND (
        is_permanent = true
        OR (blocked_until IS NOT NULL AND blocked_until > NOW())
      )
      AND resolved_at IS NULL
  ) INTO v_is_blocked;
  
  RETURN v_is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular score de riesgo
CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_user_id UUID,
  p_ip_address INET,
  p_amount DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_recent_attempts INTEGER;
  v_failed_attempts INTEGER;
  v_different_ips INTEGER;
  v_account_age_days INTEGER;
BEGIN
  -- Factor 1: Intentos recientes (últimas 24 horas)
  SELECT COUNT(*) INTO v_recent_attempts
  FROM payment_attempts
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '24 hours';
  
  IF v_recent_attempts > 5 THEN
    v_risk_score := v_risk_score + 30;
  ELSIF v_recent_attempts > 3 THEN
    v_risk_score := v_risk_score + 15;
  END IF;
  
  -- Factor 2: Intentos fallidos recientes
  SELECT COUNT(*) INTO v_failed_attempts
  FROM payment_attempts
  WHERE user_id = p_user_id
    AND status = 'failed'
    AND created_at > NOW() - INTERVAL '7 days';
  
  IF v_failed_attempts > 3 THEN
    v_risk_score := v_risk_score + 25;
  ELSIF v_failed_attempts > 1 THEN
    v_risk_score := v_risk_score + 10;
  END IF;
  
  -- Factor 3: Múltiples IPs diferentes
  SELECT COUNT(DISTINCT ip_address) INTO v_different_ips
  FROM payment_attempts
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '7 days';
  
  IF v_different_ips > 5 THEN
    v_risk_score := v_risk_score + 20;
  ELSIF v_different_ips > 3 THEN
    v_risk_score := v_risk_score + 10;
  END IF;
  
  -- Factor 4: Edad de la cuenta
  SELECT EXTRACT(DAY FROM (NOW() - created_at))::INTEGER INTO v_account_age_days
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_account_age_days < 1 THEN
    v_risk_score := v_risk_score + 15;
  ELSIF v_account_age_days < 7 THEN
    v_risk_score := v_risk_score + 5;
  END IF;
  
  -- Factor 5: Monto inusualmente alto (más de 50,000 ARS)
  IF p_amount > 50000 THEN
    v_risk_score := v_risk_score + 10;
  END IF;
  
  -- Limitar score entre 0 y 100
  v_risk_score := LEAST(v_risk_score, 100);
  
  RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función mejorada para procesar pagos con seguridad empresarial
CREATE OR REPLACE FUNCTION process_successful_payment_secure(
  p_user_id UUID,
  p_payment_id VARCHAR,
  p_preference_id VARCHAR,
  p_amount DECIMAL,
  p_payment_method VARCHAR,
  p_mercadopago_data JSONB,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_end_date TIMESTAMP WITH TIME ZONE;
  v_new_start_date TIMESTAMP WITH TIME ZONE;
  v_new_end_date TIMESTAMP WITH TIME ZONE;
  v_days_granted INTEGER := 30;
  v_receipt_id UUID;
  v_receipt_number TEXT;
  v_is_blocked BOOLEAN;
  v_previous_status VARCHAR;
  v_payment_exists BOOLEAN;
BEGIN
  -- VALIDACIÓN 1: Verificar que el usuario no esté bloqueado
  v_is_blocked := is_user_blocked(p_user_id);
  
  IF v_is_blocked THEN
    PERFORM log_payment_event(
      p_user_id,
      'payment_blocked',
      'security',
      'warning',
      'Intento de pago bloqueado por restricción de seguridad',
      jsonb_build_object('payment_id', p_payment_id),
      p_ip_address,
      NULL
    );
    
    RAISE EXCEPTION 'Tu cuenta tiene restricciones de seguridad. Contacta a soporte.';
  END IF;
  
  -- VALIDACIÓN 2: Verificar que el pago no haya sido procesado antes (idempotencia)
  SELECT EXISTS(
    SELECT 1
    FROM payment_receipts
    WHERE payment_id = p_payment_id
  ) INTO v_payment_exists;
  
  IF v_payment_exists THEN
    PERFORM log_payment_event(
      p_user_id,
      'duplicate_payment_attempt',
      'security',
      'warning',
      'Intento de procesar un pago ya existente',
      jsonb_build_object('payment_id', p_payment_id),
      p_ip_address,
      NULL
    );
    
    RAISE EXCEPTION 'Este pago ya fue procesado anteriormente.';
  END IF;
  
  -- VALIDACIÓN 3: Verificar que la preferencia exista y pertenezca al usuario
  IF NOT EXISTS(
    SELECT 1
    FROM payment_preferences
    WHERE preference_id = p_preference_id
      AND user_id = p_user_id
  ) THEN
    PERFORM log_payment_event(
      p_user_id,
      'invalid_preference',
      'security',
      'error',
      'Intento de usar preferencia inválida o de otro usuario',
      jsonb_build_object('preference_id', p_preference_id),
      p_ip_address,
      NULL
    );
    
    RAISE EXCEPTION 'Preferencia de pago inválida.';
  END IF;
  
  -- VALIDACIÓN 4: Verificar que el monto coincida
  IF NOT EXISTS(
    SELECT 1
    FROM payment_preferences
    WHERE preference_id = p_preference_id
      AND ABS(amount - p_amount) < 0.01 -- Tolerancia de centavos
  ) THEN
    PERFORM log_payment_event(
      p_user_id,
      'amount_mismatch',
      'security',
      'critical',
      'El monto del pago no coincide con la preferencia',
      jsonb_build_object(
        'expected_amount', (SELECT amount FROM payment_preferences WHERE preference_id = p_preference_id),
        'received_amount', p_amount
      ),
      p_ip_address,
      NULL
    );
    
    RAISE EXCEPTION 'El monto del pago no coincide con lo esperado.';
  END IF;
  
  -- Obtener estado actual
  SELECT subscription_status, subscription_end_date 
  INTO v_previous_status, v_current_end_date
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calcular nuevas fechas
  IF v_current_end_date IS NULL OR v_current_end_date < NOW() THEN
    v_new_start_date := NOW();
  ELSE
    v_new_start_date := v_current_end_date;
  END IF;
  
  v_new_end_date := v_new_start_date + INTERVAL '30 days';
  
  -- TRANSACCIÓN ATÓMICA: Actualizar todo o nada
  BEGIN
    -- Actualizar perfil
    UPDATE profiles
    SET 
      subscription_status = 'active',
      subscription_end_date = v_new_end_date,
      last_payment_date = NOW(),
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Crear recibo
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
    
    -- Actualizar preferencia
    UPDATE payment_preferences
    SET 
      status = 'completed',
      payment_id = p_payment_id,
      payment_status = 'approved',
      updated_at = NOW()
    WHERE preference_id = p_preference_id;
    
    -- Registrar cambio de estado
    INSERT INTO subscription_state_history (
      user_id,
      previous_status,
      new_status,
      previous_end_date,
      new_end_date,
      trigger_event,
      payment_receipt_id,
      metadata
    )
    VALUES (
      p_user_id,
      v_previous_status,
      'active',
      v_current_end_date,
      v_new_end_date,
      'payment_success',
      v_receipt_id,
      jsonb_build_object('payment_id', p_payment_id, 'amount', p_amount)
    );
    
    -- Log de auditoría exitoso
    PERFORM log_payment_event(
      p_user_id,
      'payment_success',
      'payment',
      'info',
      'Pago procesado exitosamente',
      jsonb_build_object(
        'payment_id', p_payment_id,
        'amount', p_amount,
        'receipt_number', v_receipt_number
      ),
      p_ip_address,
      NULL
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log de error
      PERFORM log_payment_event(
        p_user_id,
        'payment_processing_error',
        'error',
        'critical',
        'Error al procesar pago: ' || SQLERRM,
        jsonb_build_object('payment_id', p_payment_id, 'error', SQLERRM),
        p_ip_address,
        NULL
      );
      
      RAISE;
  END;
  
  -- Retornar resultado
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

-- ============================================
-- PARTE 3: TRIGGERS DE SEGURIDAD
-- ============================================

-- Trigger para detectar cambios sospechosos en profiles
CREATE OR REPLACE FUNCTION detect_suspicious_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Detectar cambio manual de subscription_status sin pago
  IF NEW.subscription_status != OLD.subscription_status 
     AND NEW.subscription_status = 'active'
     AND NEW.last_payment_date = OLD.last_payment_date THEN
    
    INSERT INTO payment_audit_logs (
      user_id,
      event_type,
      event_category,
      severity,
      description,
      metadata
    )
    VALUES (
      NEW.id,
      'suspicious_status_change',
      'security',
      'warning',
      'Cambio de estado de suscripción sin pago asociado',
      jsonb_build_object(
        'old_status', OLD.subscription_status,
        'new_status', NEW.subscription_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_detect_suspicious_profile_changes ON profiles;
CREATE TRIGGER trigger_detect_suspicious_profile_changes
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_profile_changes();

-- ============================================
-- PARTE 4: POLÍTICAS RLS MEJORADAS
-- ============================================

-- RLS para payment_audit_logs (solo admins pueden ver)
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON payment_audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON payment_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- RLS para payment_attempts
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment attempts" ON payment_attempts;
CREATE POLICY "Users can view own payment attempts"
  ON payment_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS para security_blocks
ALTER TABLE security_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security blocks" ON security_blocks;
CREATE POLICY "Users can view own security blocks"
  ON security_blocks
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can manage security blocks" ON security_blocks;
CREATE POLICY "Only admins can manage security blocks"
  ON security_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- RLS para subscription_state_history
ALTER TABLE subscription_state_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_state_history;
CREATE POLICY "Users can view own subscription history"
  ON subscription_state_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- PARTE 5: FUNCIONES DE UTILIDAD
-- ============================================

-- Función para obtener estadísticas de seguridad
CREATE OR REPLACE FUNCTION get_security_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_audit_logs', (SELECT COUNT(*) FROM payment_audit_logs WHERE created_at > NOW() - INTERVAL '30 days'),
    'critical_events', (SELECT COUNT(*) FROM payment_audit_logs WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '30 days'),
    'blocked_users', (SELECT COUNT(DISTINCT user_id) FROM security_blocks WHERE resolved_at IS NULL),
    'suspicious_attempts', (SELECT COUNT(*) FROM payment_attempts WHERE is_suspicious = true AND created_at > NOW() - INTERVAL '30 days'),
    'failed_payments_24h', (SELECT COUNT(*) FROM payment_attempts WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours')
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos
GRANT EXECUTE ON FUNCTION log_payment_event TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_risk_score TO authenticated;
GRANT EXECUTE ON FUNCTION process_successful_payment_secure TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_stats TO authenticated;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE payment_audit_logs IS 'Registro completo de auditoría de todos los eventos relacionados con pagos';
COMMENT ON TABLE payment_attempts IS 'Tracking de todos los intentos de pago para detección de fraude';
COMMENT ON TABLE security_blocks IS 'Bloqueos de seguridad aplicados a usuarios';
COMMENT ON TABLE mercadopago_webhooks IS 'Registro de webhooks de Mercado Pago para idempotencia';
COMMENT ON TABLE subscription_state_history IS 'Historial completo de cambios de estado de suscripciones';

COMMENT ON FUNCTION process_successful_payment_secure IS 'Función segura para procesar pagos con validaciones múltiples y auditoría completa';
COMMENT ON FUNCTION calculate_risk_score IS 'Calcula score de riesgo basado en múltiples factores para detectar fraude';
COMMENT ON FUNCTION is_user_blocked IS 'Verifica si un usuario tiene bloqueos de seguridad activos';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
