import jsPDF from 'jspdf';

export const generateReceiptPDF = async (receiptData) => {
  const {
    receiptNumber,
    userName,
    userEmail,
    paymentDate,
    amount,
    currency,
    paymentMethod,
    subscriptionStartDate,
    subscriptionEndDate,
    daysGranted,
    paymentId
  } = receiptData;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colores
  const primaryColor = [37, 99, 235]; // Blue-600
  const secondaryColor = [75, 85, 99]; // Gray-600
  const lightGray = [243, 244, 246]; // Gray-100

  // Header con fondo azul
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo/Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GESTIONAR.APP', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión Empresarial', pageWidth / 2, 30, { align: 'center' });

  // Título del documento
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, 55, { align: 'center' });

  // Número de recibo
  doc.setFillColor(...lightGray);
  doc.roundedRect(15, 65, pageWidth - 30, 15, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Recibo N°: ${receiptNumber}`, pageWidth / 2, 75, { align: 'center' });

  // Información del cliente
  let yPos = 95;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DATOS DEL CLIENTE', 15, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  
  doc.text('Nombre:', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(userName, 50, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Email:', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(userEmail, 50, yPos);

  // Línea separadora
  yPos += 10;
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // Detalles del pago
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DETALLES DEL PAGO', 15, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, curr) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const details = [
    { label: 'Fecha de Pago:', value: formatDate(paymentDate) },
    { label: 'Método de Pago:', value: paymentMethod || 'Mercado Pago' },
    { label: 'ID de Transacción:', value: paymentId },
    { label: 'Concepto:', value: 'Suscripción Mensual Premium' },
    { label: 'Período de Suscripción:', value: `${daysGranted} días` }
  ];

  details.forEach(detail => {
    doc.text(detail.label, 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(detail.value, 80, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
  });

  // Línea separadora
  yPos += 5;
  doc.line(15, yPos, pageWidth - 15, yPos);

  // Vigencia de la suscripción
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('VIGENCIA DE LA SUSCRIPCIÓN', 15, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);

  doc.text('Inicio:', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(subscriptionStartDate).toLocaleDateString('es-AR'), 50, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Fin:', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(subscriptionEndDate).toLocaleDateString('es-AR'), 50, yPos);

  // Monto total - destacado
  yPos += 15;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 20, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO TOTAL:', 20, yPos + 7);
  doc.setFontSize(20);
  doc.text(formatCurrency(amount, currency), pageWidth - 20, yPos + 7, { align: 'right' });

  // Nota al pie
  yPos = pageHeight - 40;
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, pageWidth - 30, 25, 'F');
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Este comprobante es válido como constancia de pago.', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.text('Para consultas, contacta a soporte@gestionar.app', pageWidth / 2, yPos + 14, { align: 'center' });
  doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`, pageWidth / 2, yPos + 20, { align: 'center' });

  // Guardar PDF
  doc.save(`Comprobante-${receiptNumber}.pdf`);
};
