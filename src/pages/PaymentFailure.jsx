import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-red-200 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Pago rechazado
        </h2>
        
        <p className="text-lg text-gray-600 mb-6">
          No pudimos procesar tu pago. Por favor, verifica tus datos e intenta nuevamente.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-red-900 mb-2">
            Posibles causas:
          </p>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• Fondos insuficientes en la tarjeta</li>
            <li>• Datos de la tarjeta incorrectos</li>
            <li>• Tarjeta vencida o bloqueada</li>
            <li>• Límite de compra excedido</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/premium')}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar nuevamente
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Si el problema persiste, contacta a tu banco o prueba con otro método de pago
        </p>
      </div>
    </div>
  );
};

export default PaymentFailure;
