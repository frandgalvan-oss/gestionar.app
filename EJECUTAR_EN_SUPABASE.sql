-- ============================================
-- SCRIPT COMPLETO PARA ACTIVAR SISTEMA DE PAGOS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Crear tabla payment_preferences
CREATE TABLE IF NOT EXISTS payment_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  preference_data JSONB,
  preference_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  payment_id VARCHAR(255),
  payment_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_payment_preferences_user_id ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_payment_id ON payment_preferences(payment_id);

-- 3. Habilitar RLS
ALTER TABLE payment_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad
DROP POLICY IF EXISTS "Users can view own payment preferences" ON payment_preferences;
CREATE POLICY "Users can view own payment preferences"
  ON payment_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment preferences" ON payment_preferences;
CREATE POLICY "Users can insert own payment preferences"
  ON payment_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment preferences" ON payment_preferences;
CREATE POLICY "Users can update own payment preferences"
  ON payment_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Crear función para updated_at
CREATE OR REPLACE FUNCTION update_payment_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger
DROP TRIGGER IF EXISTS update_payment_preferences_updated_at ON payment_preferences;
CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_preferences_updated_at();

-- ============================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================
-- Siguiente paso: Desplegar Edge Function
-- Ve a: Edge Functions > Create Function
-- Nombre: create-preference
-- Código: Ver archivo CODIGO_EDGE_FUNCTION.txt
-- ============================================
