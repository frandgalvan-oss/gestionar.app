import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SubscriptionInfo from '../components/subscription/SubscriptionInfo';
import PaymentHistory from '../components/subscription/PaymentHistory';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Volver al Dashboard</span>
              </button>
            </div>
            <button
              onClick={() => navigate('/premium')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" />
              Renovar Suscripción
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Suscripción
          </h1>
          <p className="text-gray-600">
            Gestiona tu suscripción y consulta tu historial de pagos
          </p>
        </div>

        <div className="space-y-6">
          {/* Información de suscripción */}
          <SubscriptionInfo />

          {/* Historial de pagos */}
          <PaymentHistory />
        </div>
      </div>
    </div>
  );
};

export default Subscription;
