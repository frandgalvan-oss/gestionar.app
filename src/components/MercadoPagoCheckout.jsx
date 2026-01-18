import React, { useState, useEffect } from 'react'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Inicializar Mercado Pago con la public key
const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY

if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY)
}

const MercadoPagoCheckout = ({ planType, planPrice, planName, onSuccess, onError }) => {
  const [preferenceId, setPreferenceId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    createPreference()
  }, [planType, planPrice])

  const createPreference = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Crear preferencia de pago
      const preference = {
        items: [
          {
            title: planName,
            description: `Suscripción ${planType === 'monthly' ? 'Mensual' : 'Anual'} - Sistema de Gestión`,
            quantity: 1,
            unit_price: planPrice,
            currency_id: 'ARS'
          }
        ],
        payer: {
          email: user.email
        },
        back_urls: {
          success: `${window.location.origin}/checkout/success`,
          failure: `${window.location.origin}/checkout/failure`,
          pending: `${window.location.origin}/checkout/pending`
        },
        auto_return: 'approved',
        external_reference: `${user.id}_${planType}_${Date.now()}`,
        notification_url: `${window.location.origin}/api/mercadopago/webhook`,
        statement_descriptor: 'SISTEMA GESTION',
        metadata: {
          user_id: user.id,
          plan_type: planType,
          email: user.email
        }
      }

      // Guardar la preferencia en Supabase para tracking
      const { data: savedPreference, error: saveError } = await supabase
        .from('payment_preferences')
        .insert({
          user_id: user.id,
          plan_type: planType,
          amount: planPrice,
          preference_data: preference,
          status: 'pending'
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error guardando preferencia:', saveError)
      }

      // En producción, aquí harías una llamada a tu backend para crear la preferencia
      // Por ahora, usaremos un mock para desarrollo
      // TODO: Implementar endpoint backend para crear preferencia de MP
      
      // Mock preference ID para desarrollo
      const mockPreferenceId = `mock-${Date.now()}`
      setPreferenceId(mockPreferenceId)
      
      setLoading(false)
    } catch (err) {
      console.error('Error creando preferencia:', err)
      setError(err.message)
      setLoading(false)
      if (onError) onError(err)
    }
  }

  if (!MP_PUBLIC_KEY) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          ⚠️ Mercado Pago no está configurado. Por favor, agrega tu Public Key en las variables de entorno.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          Error al procesar el pago: {error}
        </p>
        <button
          onClick={createPreference}
          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preferenceId ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm mb-4">
            💡 <strong>Modo de desarrollo:</strong> Para habilitar pagos reales, necesitas:
          </p>
          <ol className="text-blue-700 text-sm space-y-2 ml-4 list-decimal">
            <li>Crear una cuenta en <a href="https://www.mercadopago.com.ar" target="_blank" rel="noopener noreferrer" className="underline font-medium">Mercado Pago</a></li>
            <li>Obtener tus credenciales (Public Key y Access Token) desde el panel de desarrolladores</li>
            <li>Agregar <code className="bg-blue-100 px-1 rounded">VITE_MERCADOPAGO_PUBLIC_KEY</code> en tu archivo .env</li>
            <li>Crear un endpoint backend para generar preferencias de pago de forma segura</li>
            <li>Configurar el webhook para recibir notificaciones de pago</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-xs text-gray-600 mb-2">Preference ID (mock):</p>
            <code className="text-xs text-gray-900 break-all">{preferenceId}</code>
          </div>
        </div>
      ) : (
        <Wallet
          initialization={{ preferenceId }}
          customization={{
            texts: {
              valueProp: 'security_safety'
            }
          }}
        />
      )}
    </div>
  )
}

export default MercadoPagoCheckout
