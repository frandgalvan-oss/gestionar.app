import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Hero = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

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

          {/* Lado derecho - Formulario de Login */}
          <div className="bg-white px-6 sm:px-12 lg:px-16 py-32 sm:py-36 lg:py-40 flex items-center justify-center">
            <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Inicia sesión</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5 outline-none transition-all"
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3.5 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <span>Iniciar sesión</span>
                  )}
                </button>

                {/* Forgot Password */}
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500">¿Todavía no tenés una cuenta?</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Register Link */}
              <Link
                to="/register"
                className="w-full px-8 py-3.5 border-2 border-gray-900 text-gray-900 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all text-center block"
              >
                Abrí tu cuenta empresa en minutos
              </Link>

              {/* Footer Text */}
              <p className="mt-6 text-center text-sm text-gray-500">
                100% online • Soporte personalizado
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
