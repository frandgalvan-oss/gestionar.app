import { supabase } from '../lib/supabase';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

// Crear preferencia de pago
export async function createPaymentPreference(planType, planPrice, planName) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Guardar la intención de pago en Supabase
    const { data: preference, error: saveError } = await supabase
      .from('payment_preferences')
      .insert({
        user_id: user.id,
        plan_type: planType,
        amount: planPrice,
        status: 'pending',
        preference_data: {
          plan_name: planName,
          user_email: user.email
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error guardando preferencia:', saveError);
      throw new Error('Error al crear la preferencia de pago');
    }

    // En producción, aquí llamarías a tu backend para crear la preferencia en Mercado Pago
    // Por ahora, retornamos la URL de Mercado Pago directamente
    // IMPORTANTE: Esto debe hacerse desde el backend por seguridad
    
    return {
      preferenceId: preference.id,
      // Esta URL debe generarse desde el backend con el Access Token
      initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=MOCK_${preference.id}`,
      message: 'Para habilitar pagos reales, configura el backend con tu Access Token de Mercado Pago'
    };
  } catch (error) {
    console.error('Error creando preferencia:', error);
    throw error;
  }
}

// Verificar estado de pago
export async function checkPaymentStatus(preferenceId) {
  try {
    const { data, error } = await supabase
      .from('payment_preferences')
      .select('*')
      .eq('id', preferenceId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error verificando estado de pago:', error);
    throw error;
  }
}

// Actualizar suscripción después de pago exitoso
export async function activateSubscription(userId, planType) {
  try {
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_end_date: subscriptionEndDate.toISOString(),
        is_premium: true,
        trial_ends_at: null
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error activando suscripción:', error);
    throw error;
  }
}

export { MP_PUBLIC_KEY };
