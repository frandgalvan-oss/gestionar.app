import React, { useState } from 'react'
import { Bot, Clock, TrendingUp, Shield, Zap, Users, X, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'App Móvil',
    description: 'Gestioná tu negocio desde cualquier lugar con nuestra aplicación móvil.',
    details: 'Aplicación móvil nativa para iOS y Android con todas las funcionalidades del sistema.',
    comingSoon: true,
  },
  {
    icon: TrendingUp,
    title: 'Automatización de mensajes',
    description: 'Recordatorios de pago, envío de facturas y seguimiento de clientes automático.',
    details: 'Sistema automatizado de mensajería para recordatorios de pago, envío de facturas por WhatsApp/Email, y seguimiento automático de clientes.',
    comingSoon: true,
  },
  {
    icon: Clock,
    title: 'Recomendaciones de inversión',
    description: 'Sugerencias inteligentes sobre dónde invertir tus ganancias para maximizar rendimientos.',
    details: 'Sistema de análisis que evalúa tus ganancias y te sugiere opciones de inversión personalizadas, proyectando rendimientos potenciales.',
    comingSoon: true,
  },
  {
    icon: Shield,
    title: 'Datos seguros',
    description: 'Tus datos empresariales protegidos con tecnología de seguridad moderna.',
    details: 'Utilizamos Supabase para el almacenamiento seguro de datos con autenticación robusta. Tus datos están protegidos y respaldados automáticamente en la nube.',
  },
  {
    icon: Zap,
    title: 'Fácil de usar',
    description: 'Interfaz intuitiva diseñada para que puedas empezar a usarla de inmediato.',
    details: 'Sistema diseñado para ser simple y directo. Crea tu cuenta, configura tu negocio y comenzá a gestionar en minutos. No requiere conocimientos técnicos.',
  },
  {
    icon: Users,
    title: 'Asistente con IA',
    description: 'Chat especializado en finanzas para consultas y análisis de tu negocio.',
    details: 'Asistente integrado que te ayuda con análisis financiero, proyecciones y recomendaciones personalizadas basadas en tus datos reales.',
  },
]

const Features = () => {
  const [selectedFeature, setSelectedFeature] = useState(null)

  return (
    <section id="features" className="py-24 px-4 sm:px-6 bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="max-w-xl mb-14 animate-slide-up">
          <div className="badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            Características
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight leading-tight mb-4">
            Todo lo que necesitás para hacer crecer tu negocio
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Soluciones completas diseñadas para PyMEs que quieren operar con más eficiencia.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-8 flex flex-col gap-4 hover:bg-neutral-50 transition-colors duration-150 cursor-pointer"
              onClick={() => setSelectedFeature(feature)}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-neutral-950 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-neutral-950">{feature.title}</h3>
                  {feature.comingSoon && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="mt-auto pt-2 flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-700 transition-colors">
                <span>Saber más</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-xl max-w-lg w-full p-6 shadow-vercel animate-slide-up border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-950 flex items-center justify-center flex-shrink-0">
                  <selectedFeature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-950">{selectedFeature.title}</h3>
                    {selectedFeature.comingSoon && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">{selectedFeature.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors ml-2 flex-shrink-0"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-5">
              {selectedFeature.details}
            </p>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedFeature(null)}
                className="btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Features
