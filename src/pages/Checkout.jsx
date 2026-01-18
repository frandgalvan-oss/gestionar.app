import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  Check, 
  Loader2,
  Crown,
  Zap,
  Lock,
  AlertCircle,
  Mail,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MercadoPagoCheckout from '../components/MercadoPagoCheckout';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  const planType = searchParams.get('plan');
  
  // Plan details
  const planDetails = {
    monthly: {
      name: 'Premium Mensual',
      price: 12000,
      period: 'mes',
      icon: Zap,
      features: [
        'Acceso ilimitado al chat con IA',
        'Análisis avanzado de documentos',
        'Exportación de datos',
        'Soporte prioritario 24/7',
        'Historial ilimitado',
        'Actualizaciones primero'
      ]
    },
    annual: {
      name: 'Premium Anual',
      price: 120000,
      period: 'año',
      icon: Crown,
      savings: 24000,
      features: [
        'Todo lo del plan mensual',
        'Ahorro de $24,000 al año',
        'Integraciones personalizadas',
        'Dashboard con métricas avanzadas',
        'Soporte VIP',
        'Acceso anticipado a nuevas funciones'
      ]
    }
  };

  const plan = planDetails[planType];

  useEffect(() => {
    // Require user to be logged in - they need to register first for 7-day trial
    if (!user) {
      navigate('/register', { state: { from: `/checkout?plan=${planType}`, message: 'Crea tu cuenta para comenzar tu prueba gratuita de 7 días' } });
      return;
    }
    
    if (!planType || !plan) {
      navigate('/premium');
    }
  }, [user, planType, plan, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handlePaymentSuccess = () => {
    // Redirigir al dashboard después de un pago exitoso
    navigate('/dashboard');
  };

  const handlePaymentError = (err) => {
    setError(err.message || 'Error al procesar el pago');
  };

  if (!plan) {
    return null;
  }

  const Icon = plan.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/premium')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver a planes</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Confirmar</span> <span className="text-gray-900">Suscripción</span>
              </h1>
              <p className="text-gray-600 text-sm">
                Revisa los detalles de tu plan antes de continuar
              </p>
            </div>

            {/* Plan Card */}
            <div className="bg-white border-2 border-cyan-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Renovación automática cada {plan.period}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-gray-600 text-sm">Precio</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/ {plan.period}</span>
                  </div>
                </div>
                
                {plan.savings && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-green-700 text-sm font-semibold text-center">
                      💰 Ahorras {formatPrice(plan.savings)} al año
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-gray-900 font-semibold text-sm mb-2">
                  Incluye:
                </p>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-gray-900 font-semibold text-sm mb-1">
                    Pago 100% Seguro
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Protegido con encriptación bancaria. Procesado por Mercado Pago.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Confirmation */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Resumen</span> <span className="text-gray-900">del Pedido</span>
              </h2>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                <p className="text-gray-600 text-xs mb-0.5">Cuenta</p>
                <p className="text-gray-900 font-semibold text-sm">{user?.email}</p>
              </div>
              
              {/* Trial Info */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-4">
                <p className="text-cyan-700 text-sm font-semibold text-center">
                  🎉 Incluye 7 días de prueba gratuita
                </p>
              </div>

              {/* Price Summary */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Subtotal</span>
                  <span className="text-gray-900 font-semibold text-sm">
                    {formatPrice(plan.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Impuestos</span>
                  <span className="text-gray-900 font-semibold text-sm">
                    Incluidos
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-bold text-base">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 text-right">
                    por {plan.period}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Mercado Pago Checkout */}
              <div className="mb-4">
                <MercadoPagoCheckout
                  planType={planType}
                  planPrice={plan.price}
                  planName={plan.name}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>

              {/* Mercado Pago Logo */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-gray-500 text-xs">Procesado por</span>
                <span className="text-sm font-semibold text-cyan-600">Mercado Pago</span>
              </div>

              {/* Payment Methods */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-600 text-xs mb-2 text-center">
                  Métodos de pago aceptados
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 text-xs font-medium">Crédito</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 text-xs font-medium">Débito</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-gray-500 text-xs text-center mt-4 leading-relaxed">
                Comienza con 7 días gratis. Después se cobrará automáticamente. Cancela cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
