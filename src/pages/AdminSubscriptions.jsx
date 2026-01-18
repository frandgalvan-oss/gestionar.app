import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Shield, 
  X, 
  Check,
  Loader2,
  Crown,
  AlertCircle,
  Plus,
  Minus,
  Ban,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const AdminSubscriptions = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Verificar que el usuario es administrador
  useEffect(() => {
    const checkAccess = async () => {
      console.log('=== VERIFICACIÓN DE ACCESO ADMIN ===')
      console.log('Usuario completo:', user)
      
      if (!user) {
        console.log('No hay usuario, redirigiendo a login')
        navigate('/login')
        return
      }

      console.log('Email del usuario:', user.email)
      console.log('Email requerido: euge060406@gmail.com')
      console.log('¿Coinciden?', user.email === 'euge060406@gmail.com')
      
      // Verificar directamente por email
      if (user.email !== 'euge060406@gmail.com') {
        console.error('❌ ACCESO DENEGADO - Email no autorizado')
        alert(`No tienes permisos de administrador.\n\nTu email: ${user.email}\nEmail requerido: euge060406@gmail.com`)
        navigate('/dashboard')
        return
      }

      console.log('✅ ACCESO PERMITIDO - Cargando usuarios...')
      await loadUsers()
    }

    checkAccess()
  }, [user, navigate])

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('🔄 Iniciando carga de usuarios...')
      
      // Obtener todos los usuarios de auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error obteniendo usuarios de auth:', authError)
        console.log('🔍 Usando función RPC get_all_users_for_admin...')
        
        // Usar función RPC que tiene permisos para acceder a auth.users
        const { data: usersData, error: rpcError } = await supabase
          .rpc('get_all_users_for_admin')

        console.log('Respuesta de la función:', { data: usersData, error: rpcError })

        if (rpcError) {
          console.error('❌ Error obteniendo usuarios:', rpcError)
          console.error('Detalles del error:', JSON.stringify(rpcError, null, 2))
          throw rpcError
        }
        
        console.log(`✅ Usuarios encontrados: ${usersData?.length || 0}`)
        console.log('Primeros 3 usuarios:', usersData?.slice(0, 3))

        // Obtener datos de empresa para cada usuario
        const usersWithCompanies = await Promise.all(
          (usersData || []).map(async (user) => {
            const { data: company } = await supabase
              .from('companies')
              .select('*')
              .eq('user_id', user.id)
              .single()

            return {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              created_at: user.created_at,
              company,
              subscription: {
                status: user.subscription_status,
                endDate: user.subscription_end_date,
                lastPayment: user.last_payment_date,
                isPermanent: user.is_premium_permanent
              }
            }
          })
        )

        console.log('✅ Usuarios procesados:', usersWithCompanies.length)
        console.log('Ejemplo de usuario:', usersWithCompanies[0])
        setUsers(usersWithCompanies)
        setFilteredUsers(usersWithCompanies)
      } else {
        console.log(`📊 Usuarios encontrados en auth: ${authUsers?.users?.length || 0}`)
        
        // Obtener profiles y companies para cada usuario
        const usersWithData = await Promise.all(
          (authUsers.users || []).map(async (authUser) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single()

            const { data: company } = await supabase
              .from('companies')
              .select('*')
              .eq('user_id', authUser.id)
              .single()

            return {
              id: authUser.id,
              email: authUser.email,
              full_name: profile?.full_name || authUser.user_metadata?.full_name || 'Sin nombre',
              created_at: authUser.created_at,
              company,
              subscription: {
                status: profile?.subscription_status || 'inactive',
                endDate: profile?.subscription_end_date,
                lastPayment: profile?.last_payment_date,
                isPermanent: profile?.is_premium_permanent || false
              }
            }
          })
        )

        console.log('✅ Usuarios procesados:', usersWithData.length)
        setUsers(usersWithData)
        setFilteredUsers(usersWithData)
      }
    } catch (err) {
      console.error('❌ Error loading users:', err)
      setError('Error al cargar usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  // Extender membresía
  const extendMembership = async (userId, days) => {
    try {
      setProcessing(true)
      setError(null)
      console.log(`🔄 Extendiendo membresía ${days} días para usuario:`, userId)

      const { data, error } = await supabase
        .rpc('admin_extend_membership', {
          p_user_id: userId,
          p_days: days
        })

      if (error) throw error

      console.log('✅ Membresía extendida:', data)
      setSuccess(`Membresía extendida ${days} días`)
      await loadUsers()
      setSelectedUser(null)
    } catch (err) {
      console.error('❌ Error:', err)
      setError('Error al extender membresía: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  // Reducir días de membresía
  const reduceMembership = async (userId, days) => {
    try {
      setProcessing(true)
      setError(null)
      console.log(`🔄 Reduciendo membresía ${days} días para usuario:`, userId)

      const { data, error } = await supabase
        .rpc('admin_reduce_membership', {
          p_user_id: userId,
          p_days: days
        })

      if (error) throw error

      console.log('✅ Membresía reducida:', data)
      setSuccess(`Membresía reducida ${days} días`)
      await loadUsers()
      setSelectedUser(null)
    } catch (err) {
      console.error('❌ Error:', err)
      setError('Error al reducir membresía: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  // Dar premium permanente
  const grantPermanentPremium = async (userId) => {
    try {
      setProcessing(true)
      setError(null)
      console.log(`🔄 Otorgando premium permanente a usuario:`, userId)

      const { data, error } = await supabase
        .rpc('admin_grant_permanent_premium', {
          p_user_id: userId
        })

      if (error) throw error

      console.log('✅ Premium permanente otorgado:', data)
      setSuccess('Premium permanente otorgado')
      await loadUsers()
      setSelectedUser(null)
    } catch (err) {
      console.error('❌ Error:', err)
      setError('Error al otorgar premium: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  // Cancelar cuenta
  const cancelAccount = async (userId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta cuenta? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setProcessing(true)
      setError(null)
      console.log(`🔄 Cancelando cuenta de usuario:`, userId)

      const { data, error } = await supabase
        .rpc('admin_cancel_account', {
          p_user_id: userId
        })

      if (error) throw error

      console.log('✅ Cuenta cancelada:', data)
      setSuccess('Cuenta cancelada')
      await loadUsers()
      setSelectedUser(null)
    } catch (err) {
      console.error('❌ Error:', err)
      setError('Error al cancelar cuenta: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calcular días restantes
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0
    const now = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Volver al Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
                <p className="text-sm text-gray-600">Gestión de suscripciones y usuarios</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total de usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">Éxito</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Último Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => {
                  const daysRemaining = getDaysRemaining(u.subscription.endDate)
                  const isExpired = daysRemaining < 0
                  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7

                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-gray-600">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{u.company?.name || 'Sin empresa'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {u.subscription.isPermanent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                            <Crown className="w-3 h-3" />
                            Premium ∞
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                            u.subscription.status === 'active' && !isExpired
                              ? 'bg-green-100 text-green-800'
                              : u.subscription.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {u.subscription.status === 'active' && !isExpired ? 'Activa' : 
                             u.subscription.status === 'cancelled' ? 'Cancelada' : 'Inactiva'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.subscription.isPermanent ? (
                          <span className="text-sm text-gray-600">Permanente</span>
                        ) : (
                          <div>
                            <p className={`text-sm font-medium ${
                              isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              {formatDate(u.subscription.endDate)}
                            </p>
                            {!isExpired && (
                              <p className="text-xs text-gray-600">
                                {daysRemaining} días restantes
                              </p>
                            )}
                            {isExpired && (
                              <p className="text-xs text-red-600">
                                Expiró hace {Math.abs(daysRemaining)} días
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{formatDate(u.subscription.lastPayment)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de gestión */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedUser.full_name}</h2>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Extender membresía */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Plus className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Extender Membresía</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => extendMembership(selectedUser.id, 7)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    +7 días
                  </button>
                  <button
                    onClick={() => extendMembership(selectedUser.id, 30)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    +30 días
                  </button>
                  <button
                    onClick={() => extendMembership(selectedUser.id, 90)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    +90 días
                  </button>
                </div>
              </div>

              {/* Reducir membresía */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Minus className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Reducir Membresía</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => reduceMembership(selectedUser.id, 7)}
                    disabled={processing}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                  >
                    -7 días
                  </button>
                  <button
                    onClick={() => reduceMembership(selectedUser.id, 30)}
                    disabled={processing}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                  >
                    -30 días
                  </button>
                  <button
                    onClick={() => reduceMembership(selectedUser.id, 90)}
                    disabled={processing}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                  >
                    -90 días
                  </button>
                </div>
              </div>

              {/* Premium permanente */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Premium Permanente</h3>
                </div>
                <button
                  onClick={() => grantPermanentPremium(selectedUser.id)}
                  disabled={processing || selectedUser.subscription.isPermanent}
                  className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 font-semibold"
                >
                  {selectedUser.subscription.isPermanent ? 'Ya tiene Premium Permanente' : 'Otorgar Premium Permanente'}
                </button>
              </div>

              {/* Cancelar cuenta */}
              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <div className="flex items-center gap-3 mb-4">
                  <Ban className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Cancelar Cuenta</h3>
                </div>
                <button
                  onClick={() => cancelAccount(selectedUser.id)}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                >
                  Cancelar Cuenta
                </button>
              </div>
            </div>

            {processing && (
              <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Procesando...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSubscriptions
