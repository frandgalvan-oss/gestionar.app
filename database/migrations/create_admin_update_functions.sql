-- Funciones para que el admin pueda modificar suscripciones
-- Estas funciones tienen SECURITY DEFINER para bypassear RLS

-- 1. Función para actualizar o crear perfil con suscripción
CREATE OR REPLACE FUNCTION admin_update_subscription(
  p_user_id UUID,
  p_full_name TEXT,
  p_subscription_status VARCHAR(50),
  p_subscription_end_date TIMESTAMPTZ,
  p_is_premium_permanent BOOLEAN
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Intentar actualizar primero
  UPDATE profiles
  SET 
    subscription_status = p_subscription_status,
    subscription_end_date = p_subscription_end_date,
    is_premium_permanent = p_is_premium_permanent,
    full_name = COALESCE(full_name, p_full_name)
  WHERE id = p_user_id;
  
  -- Si no existe, insertar
  IF NOT FOUND THEN
    INSERT INTO profiles (
      id,
      full_name,
      subscription_status,
      subscription_end_date,
      is_premium_permanent,
      is_admin
    ) VALUES (
      p_user_id,
      p_full_name,
      p_subscription_status,
      p_subscription_end_date,
      p_is_premium_permanent,
      false
    );
  END IF;
  
  -- Retornar el perfil actualizado
  SELECT json_build_object(
    'success', true,
    'message', 'Suscripción actualizada correctamente'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION admin_update_subscription(UUID, TEXT, VARCHAR(50), TIMESTAMPTZ, BOOLEAN) TO authenticated;

-- 2. Función para extender membresía
CREATE OR REPLACE FUNCTION admin_extend_membership(
  p_user_id UUID,
  p_days INTEGER
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_end_date TIMESTAMPTZ;
  v_new_end_date TIMESTAMPTZ;
  v_full_name TEXT;
BEGIN
  -- Obtener fecha actual y nombre
  SELECT subscription_end_date, full_name
  INTO v_current_end_date, v_full_name
  FROM profiles
  WHERE id = p_user_id;
  
  -- Si no existe el perfil, obtener nombre de auth.users
  IF v_full_name IS NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_full_name
    FROM auth.users
    WHERE id = p_user_id;
  END IF;
  
  -- Calcular nueva fecha
  IF v_current_end_date IS NULL OR v_current_end_date < NOW() THEN
    v_new_end_date := NOW() + (p_days || ' days')::INTERVAL;
  ELSE
    v_new_end_date := v_current_end_date + (p_days || ' days')::INTERVAL;
  END IF;
  
  -- Actualizar o crear
  RETURN admin_update_subscription(
    p_user_id,
    v_full_name,
    'active',
    v_new_end_date,
    false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_extend_membership(UUID, INTEGER) TO authenticated;

-- 3. Función para reducir membresía
CREATE OR REPLACE FUNCTION admin_reduce_membership(
  p_user_id UUID,
  p_days INTEGER
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_end_date TIMESTAMPTZ;
  v_new_end_date TIMESTAMPTZ;
  v_full_name TEXT;
BEGIN
  SELECT subscription_end_date, full_name
  INTO v_current_end_date, v_full_name
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_full_name IS NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_full_name
    FROM auth.users
    WHERE id = p_user_id;
  END IF;
  
  IF v_current_end_date IS NULL THEN
    v_new_end_date := NOW() - (p_days || ' days')::INTERVAL;
  ELSE
    v_new_end_date := v_current_end_date - (p_days || ' days')::INTERVAL;
  END IF;
  
  RETURN admin_update_subscription(
    p_user_id,
    v_full_name,
    'active',
    v_new_end_date,
    false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_reduce_membership(UUID, INTEGER) TO authenticated;

-- 4. Función para dar premium permanente
CREATE OR REPLACE FUNCTION admin_grant_permanent_premium(
  p_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  SELECT full_name INTO v_full_name
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_full_name IS NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_full_name
    FROM auth.users
    WHERE id = p_user_id;
  END IF;
  
  RETURN admin_update_subscription(
    p_user_id,
    v_full_name,
    'active',
    NULL,
    true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_grant_permanent_premium(UUID) TO authenticated;

-- 5. Función para cancelar cuenta
CREATE OR REPLACE FUNCTION admin_cancel_account(
  p_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  SELECT full_name INTO v_full_name
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_full_name IS NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_full_name
    FROM auth.users
    WHERE id = p_user_id;
  END IF;
  
  RETURN admin_update_subscription(
    p_user_id,
    v_full_name,
    'cancelled',
    NOW(),
    false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_cancel_account(UUID) TO authenticated;
