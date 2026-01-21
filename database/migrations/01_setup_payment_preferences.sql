-- ============================================
-- SETUP COMPLETO: payment_preferences
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- Tabla para almacenar preferencias de pago de Mercado Pago
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

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_payment_preferences_user_id ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_payment_id ON payment_preferences(payment_id);

-- RLS (Row Level Security)
ALTER TABLE payment_preferences ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own payment preferences" ON payment_preferences;
DROP POLICY IF EXISTS "Users can insert own payment preferences" ON payment_preferences;
DROP POLICY IF EXISTS "Users can update own payment preferences" ON payment_preferences;

-- Política: Los usuarios solo pueden ver sus propias preferencias
CREATE POLICY "Users can view own payment preferences"
  ON payment_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias preferencias
CREATE POLICY "Users can insert own payment preferences"
  ON payment_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias preferencias
CREATE POLICY "Users can update own payment preferences"
  ON payment_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS update_payment_preferences_updated_at ON payment_preferences;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_preferences_updated_at();

-- Verificación
SELECT 
  'payment_preferences table created successfully' as status,
  COUNT(*) as row_count 
FROM payment_preferences;
