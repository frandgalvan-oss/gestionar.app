import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { generateReceiptPDF } from '../../utils/pdfGenerator';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (user) {
      loadPaymentHistory();
    }
  }, [user]);

  const loadPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      setDownloadingId(payment.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await generateReceiptPDF({
        receiptNumber: payment.receipt_number,
        userName: profile?.full_name || user.email,
        userEmail: user.email,
        paymentDate: payment.payment_date,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        subscriptionStartDate: payment.subscription_start_date,
        subscriptionEndDate: payment.subscription_end_date,
        daysGranted: payment.days_granted,
        paymentId: payment.payment_id
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el comprobante. Por favor, intenta nuevamente.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'green', text: 'Aprobado', icon: CheckCircle },
      pending: { color: 'yellow', text: 'Pendiente', icon: Calendar },
      rejected: { color: 'red', text: 'Rechazado', icon: FileText }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Historial de Pagos</h2>
        <span className="text-sm text-gray-600">
          {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
        </span>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No hay pagos registrados</p>
          <p className="text-sm text-gray-500">
            Tus pagos aparecerán aquí una vez que realices tu primera suscripción
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {payment.receipt_number}
                    </span>
                    {getStatusBadge(payment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Fecha: {formatDate(payment.payment_date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="w-4 h-4" />
                      <span>Método: {payment.payment_method || 'Mercado Pago'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>Período: {payment.days_granted} días</span>
                    </div>

                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <span>Monto: {formatCurrency(payment.amount, payment.currency)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Suscripción válida desde {new Date(payment.subscription_start_date).toLocaleDateString('es-AR')} 
                      {' '}hasta {new Date(payment.subscription_end_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadReceipt(payment)}
                  disabled={downloadingId === payment.id}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  {downloadingId === payment.id ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
