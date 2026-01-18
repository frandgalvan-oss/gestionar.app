import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Mail } from 'lucide-react';

const PaymentPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-yellow-200 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-yellow-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Pago pendiente
        </h2>
        
        <p className="text-lg text-gray-600 mb-6">
          Tu pago está siendo procesado. Te notificaremos cuando se complete.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3 mb-3">
            <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                Te enviaremos un email
              </p>
              <p className="text-xs text-yellow-700">
                Cuando tu pago sea confirmado, recibirás un correo con los detalles
              </p>
            </div>
          </div>
          
          <div className="border-t border-yellow-200 pt-3 mt-3">
            <p className="text-xs text-yellow-700">
              <strong>Tiempo estimado:</strong> Hasta 48 horas hábiles
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            ¿Qué puedo hacer mientras tanto?
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Puedes seguir usando tu cuenta con las funciones gratuitas</li>
            <li>• Revisa tu email regularmente</li>
            <li>• Si tienes dudas, contacta a soporte</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>
          
          <button
            onClick={() => navigate('/premium')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Ver planes
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Si no recibes confirmación en 48 horas, contacta a soporte
        </p>
      </div>
    </div>
  );
};

export default PaymentPending;
