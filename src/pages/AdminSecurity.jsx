import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, Activity, Users, 
  TrendingUp, Clock, Ban, CheckCircle, XCircle,
  ArrowLeft, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AdminSecurity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [suspiciousAttempts, setSuspiciousAttempts] = useState([]);
  const [criticalEvents, setCriticalEvents] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas de seguridad
      const { data: securityStats } = await supabase.rpc('get_security_stats');
      setStats(securityStats);

      // Cargar intentos sospechosos
      const { data: suspicious } = await supabase
        .from('payment_attempts')
        .select('*')
        .eq('is_suspicious', true)
        .order('created_at', { ascending: false })
        .limit(10);
      setSuspiciousAttempts(suspicious || []);

      // Cargar eventos críticos
      const { data: critical } = await supabase
        .from('payment_audit_logs')
        .select('*')
        .eq('severity', 'critical')
        .order('created_at', { ascending: false })
        .limit(10);
      setCriticalEvents(critical || []);

      // Cargar usuarios bloqueados
      const { data: blocked } = await supabase
        .from('security_blocks')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      setBlockedUsers(blocked || []);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-AR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'blue',
      warning: 'yellow',
      error: 'orange',
      critical: 'red'
    };
    return colors[severity] || 'gray';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de seguridad...</p>
        </div>
      </div>
    );
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
                <span className="text-sm font-medium">Volver</span>
              </button>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Panel de Seguridad</h1>
              </div>
            </div>
            <button
              onClick={loadSecurityData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-500">30 días</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.total_audit_logs || 0}</p>
            <p className="text-sm text-gray-600">Eventos totales</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-xs text-gray-500">30 días</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats?.critical_events || 0}</p>
            <p className="text-sm text-gray-600">Eventos críticos</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Ban className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-gray-500">Activos</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats?.blocked_users || 0}</p>
            <p className="text-sm text-gray-600">Usuarios bloqueados</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="text-xs text-gray-500">30 días</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats?.suspicious_attempts || 0}</p>
            <p className="text-sm text-gray-600">Intentos sospechosos</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-gray-500">24 horas</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats?.failed_payments_24h || 0}</p>
            <p className="text-sm text-gray-600">Pagos fallidos</p>
          </div>
        </div>

        {/* Intentos sospechosos */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Intentos Sospechosos Recientes
          </h2>
          
          {suspiciousAttempts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">No hay intentos sospechosos recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suspiciousAttempts.map((attempt) => (
                <div key={attempt.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-900">
                          Usuario: {attempt.user_id.substring(0, 8)}...
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.risk_score > 80 ? 'bg-red-100 text-red-700' :
                          attempt.risk_score > 60 ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          Risk Score: {attempt.risk_score}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.status === 'failed' ? 'bg-red-100 text-red-700' :
                          attempt.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {attempt.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Monto:</span> {formatCurrency(attempt.amount)}
                        </div>
                        <div>
                          <span className="font-medium">IP:</span> {attempt.ip_address || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Fecha:</span> {formatDate(attempt.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eventos críticos */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Eventos Críticos
          </h2>
          
          {criticalEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">No hay eventos críticos recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalEvents.map((event) => (
                <div key={event.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getSeverityColor(event.severity)}-100 text-${getSeverityColor(event.severity)}-700`}>
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(event.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                  {event.ip_address && (
                    <p className="text-xs text-gray-500">IP: {event.ip_address}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usuarios bloqueados */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5 text-orange-600" />
            Usuarios Bloqueados
          </h2>
          
          {blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">No hay usuarios bloqueados actualmente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((block) => (
                <div key={block.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {block.user_id.substring(0, 8)}...
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          block.is_permanent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {block.is_permanent ? 'PERMANENTE' : 'TEMPORAL'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Tipo:</span> {block.block_type}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Razón:</span> {block.reason}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Bloqueado: {formatDate(block.created_at)}</p>
                      {block.blocked_until && !block.is_permanent && (
                        <p>Hasta: {formatDate(block.blocked_until)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
