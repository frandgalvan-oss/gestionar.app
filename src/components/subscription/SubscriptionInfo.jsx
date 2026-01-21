import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SubscriptionInfo = () => {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionInfo();
    }
  }, [user]);

  const loadSubscriptionInfo = async () => {
    try {
      const { data, error } = await supabase.rpc('get_subscription_info', {
        p_user_id: user.id
      });

      if (error) throw error;
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error loading subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return null;
  }

  const isActive = subscriptionInfo.is_active || subscriptionInfo.is_premium_permanent;
  const statusColor = isActive ? 'green' : 'gray';
  const statusText = subscriptionInfo.is_premium_permanent 
    ? 'Premium Permanente' 
    : subscriptionInfo.is_active 
      ? 'Activa' 
      : 'Inactiva';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Estado de Suscripción</h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${statusColor}-100`}>
          {isActive ? (
            <CheckCircle className={`w-4 h-4 text-${statusColor}-600`} />
          ) : (
            <AlertCircle className={`w-4 h-4 text-${statusColor}-600`} />
          )}
          <span className={`text-sm font-medium text-${statusColor}-700`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Días restantes */}
        {!subscriptionInfo.is_premium_permanent && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Días Restantes</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {subscriptionInfo.days_remaining}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {subscriptionInfo.days_remaining > 0 ? 'días de acceso' : 'Suscripción vencida'}
            </p>
          </div>
        )}

        {/* Fecha de vencimiento */}
        {!subscriptionInfo.is_premium_permanent && (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Vence el</span>
            </div>
            <p className="text-sm font-bold text-purple-600">
              {formatDate(subscriptionInfo.subscription_end_date)}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Renovación mensual
            </p>
          </div>
        )}

        {/* Último pago */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Último Pago</span>
          </div>
          <p className="text-sm font-bold text-green-600">
            {formatDate(subscriptionInfo.last_payment_date)}
          </p>
          <p className="text-xs text-green-700 mt-1">
            {subscriptionInfo.total_payments} pagos realizados
          </p>
        </div>

        {/* Total gastado */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Total Gastado</span>
          </div>
          <p className="text-lg font-bold text-orange-600">
            {formatCurrency(subscriptionInfo.total_spent)}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Historial completo
          </p>
        </div>
      </div>

      {/* Mensaje de renovación */}
      {isActive && !subscriptionInfo.is_premium_permanent && subscriptionInfo.days_remaining <= 7 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Tu suscripción vence pronto
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Renueva antes del {formatDate(subscriptionInfo.subscription_end_date)} para mantener el acceso sin interrupciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de suscripción inactiva */}
      {!isActive && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Suscripción inactiva
              </p>
              <p className="text-xs text-red-700 mt-1">
                Renueva tu suscripción para acceder a todas las funcionalidades premium.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionInfo;
