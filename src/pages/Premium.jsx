import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Shield, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const plan = {
    id: 'monthly',
    name: 'Plan Premium',
    price: 14000,
    period: 'mes',
    features: [
      'Chat con IA especializada en ARCA 2025',
      'Análisis automático de facturas',
      'Cálculo de impuestos (IVA, IIBB, Ganancias)',
      'Dashboard con métricas en tiempo real',
      'Gestión de inventario y stock',
      'Proyecciones financieras con IA',
      'Exportación de reportes',
      'Soporte prioritario 24/7'
    ]
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/register', { 
        state: { 
          from: '/premium',
          message: 'Crea tu cuenta para continuar con la suscripción' 
        } 
      });
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('create-preference', {
        body: {
          planType: plan.id,
          planPrice: plan.price,
          planName: plan.name
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.initPoint) {
        window.location.href = data.initPoint;
      } else if (data?.sandboxInitPoint) {
        window.location.href = data.sandboxInitPoint;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar el pago. Por favor, intenta nuevamente.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Volver</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            ACCESO COMPLETO - TODAS LAS FUNCIONALIDADES
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
            Potencia tu negocio
            <br />
            <span className="text-blue-600">con Inteligencia Artificial</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatiza tu contabilidad, gestiona tu inventario y toma decisiones inteligentes con IA especializada en ARCA 2025
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-900 text-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                  <p className="text-gray-300 text-sm">Acceso completo a todas las funcionalidades</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{formatPrice(plan.price)}</div>
                  <div className="text-gray-300 text-sm">por mes</div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Incluye</h3>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Beneficios</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                        <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <span>Acceso inmediato</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                        <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <span>Actualizaciones incluidas</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                        <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <span>Soporte prioritario</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                        <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <span>Sin permanencia mínima</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-around py-4 border-t border-b border-gray-200">
                    <div className="text-center">
                      <Shield className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Pago seguro</p>
                    </div>
                    <div className="text-center">
                      <Lock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Datos protegidos</p>
                    </div>
                    <div className="text-center">
                      <Check className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Cancela cuando quieras</p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Suscribirme ahora
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    Renovación automática mensual  Cancela cuando quieras
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Procesado por Mercado Pago  Pago 100% seguro
            </p>
            <p className="text-xs text-gray-500">
              Al suscribirte, aceptas nuestros términos y condiciones de servicio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
