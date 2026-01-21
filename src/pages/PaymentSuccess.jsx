import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        const preferenceId = searchParams.get('preference_id');
        const status = searchParams.get('status');
        const paymentType = searchParams.get('payment_type');

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        if (status !== 'approved') {
          throw new Error('El pago no fue aprobado');
        }

        // Obtener datos de la preferencia de pago
        const { data: preference } = await supabase
          .from('payment_preferences')
          .select('*')
          .eq('preference_id', preferenceId)
          .single();

        if (!preference) {
          throw new Error('No se encontró la preferencia de pago');
        }

        // Procesar el pago exitoso usando la función de Supabase
        const { data: result, error: processError } = await supabase.rpc('process_successful_payment', {
          p_user_id: user.id,
          p_payment_id: paymentId,
          p_preference_id: preferenceId,
          p_amount: preference.amount,
          p_payment_method: paymentType || 'Mercado Pago',
          p_mercadopago_data: {
            payment_id: paymentId,
            status: status,
            payment_type: paymentType,
            processed_at: new Date().toISOString()
          }
        });

        if (processError) {
          throw processError;
        }

        console.log('Pago procesado exitosamente:', result);
        setProcessing(false);

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err) {
        console.error('Error activando suscripción:', err);
        setError(err.message);
        setProcessing(false);
      }
    };

    activateSubscription();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-red-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al activar suscripción
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/premium')}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Pago exitoso! 🎉
        </h2>
        
        <p className="text-lg text-gray-600 mb-6">
          Tu suscripción ha sido activada correctamente
        </p>

        {processing ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              <p className="text-sm font-semibold text-green-900">
                Activando tu cuenta Premium...
              </p>
            </div>
            <p className="text-xs text-green-700">
              Esto solo tomará unos segundos
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-green-900 mb-2">
              ✨ ¡Todo listo!
            </p>
            <p className="text-xs text-green-700">
              Redirigiendo al dashboard...
            </p>
          </div>
        )}

        <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Acceso completo</p>
              <p className="text-xs text-gray-600">A todas las funcionalidades Premium</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Soporte prioritario</p>
              <p className="text-xs text-gray-600">Respuesta en menos de 24 horas</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Actualizaciones gratis</p>
              <p className="text-xs text-gray-600">Nuevas funciones automáticamente</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          Ir al Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
