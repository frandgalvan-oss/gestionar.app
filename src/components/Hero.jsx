import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center border-b border-gray-900 border-t border-gray-900">
      <div className="w-full">
        <div className="grid lg:grid-cols-2 gap-0 min-h-screen">
          {/* Lado izquierdo - Texto con fondo gris */}
          <div className="bg-gray-100 px-6 sm:px-12 lg:px-16 py-32 sm:py-36 lg:py-40 flex items-center">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight mb-6 animate-slide-up">
                Gestiona tu empresa con{' '}
                <span className="block mt-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Inteligencia Artificial
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Sistema completo de gestión empresarial con análisis financiero automático, inventario inteligente y reportes en tiempo real.
              </p>
            </div>
          </div>

          {/* Lado derecho - Botones/Formulario */}
          <div className="bg-white px-6 sm:px-12 lg:px-16 py-32 sm:py-36 lg:py-40 flex items-center justify-center">
            <div className="w-full max-w-md space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link
                to="/register"
                className="group w-full px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 hover:-translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
              >
                <span>Comenzar Gratis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:-translate-y-0.5 transition-all shadow-md text-center text-base block"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
