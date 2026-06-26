import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
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
    <section id="home" className="min-h-screen grid lg:grid-cols-2">

      {/* ── Lado izquierdo — propuesta de valor ── */}
      <div className="bg-neutral-950 flex flex-col justify-center px-8 sm:px-14 lg:px-16 pt-28 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 w-fit">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-neutral-400 tracking-wide font-medium">Disponible para PyMEs</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] tracking-tight mb-6">
          Gestiona tu empresa{' '}
          <span className="text-gradient-blue">con IA</span>
        </h1>

        <p className="text-neutral-400 text-lg leading-relaxed max-w-md mb-10">
          Finanzas, inventario y reportes en tiempo real. Todo en un solo lugar, sin complejidad.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            { value: '10x', label: 'más rápido' },
            { value: '100%', label: 'en la nube' },
            { value: 'PyME', label: 'enfocado' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-neutral-950 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Empezar gratis <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/premium"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-neutral-400 border border-neutral-800 rounded-lg hover:border-neutral-600 hover:text-neutral-300 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>

      {/* ── Lado derecho — formulario de login ── */}
      <div className="bg-white flex items-center justify-center px-8 sm:px-14 lg:px-16 pt-28 pb-16 border-l border-neutral-200">
        <div className="w-full max-w-sm animate-fade-in">
          <h2 className="text-2xl font-bold text-neutral-950 mb-1 tracking-tight">
            Iniciar sesión
          </h2>
          <p className="text-sm text-neutral-500 mb-8">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-neutral-950 font-medium hover:underline underline-offset-2">
              Registrate gratis
            </Link>
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <span className="mt-px">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-vercel"
                placeholder="tu@empresa.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-700">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-vercel pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <Link
              to="/register"
              className="btn-secondary w-full py-2.5 rounded-lg"
            >
              Crear cuenta gratis
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-neutral-400">
            100% online · Sin tarjeta de crédito
          </p>
        </div>
      </div>
    </section>
  )
}

export default Hero
