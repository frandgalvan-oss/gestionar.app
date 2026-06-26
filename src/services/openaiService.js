/**
 * Genera un contexto financiero basado en las facturas del usuario
 */
function generateFinancialContext(companyData, invoices) {
  if (!invoices || invoices.length === 0) {
    return 'El usuario aún no ha cargado facturas.'
  }

  const salesInvoices = invoices.filter(inv => inv.type === 'income')
  const purchaseInvoices = invoices.filter(inv => inv.type === 'expense')

  const compras = invoices.filter(inv => inv.metadata?.movementType === 'compra')
  const ventas = invoices.filter(inv => inv.metadata?.movementType === 'venta')
  const gastos = invoices.filter(inv => inv.metadata?.movementType === 'gasto')
  const aportes = invoices.filter(inv => inv.metadata?.movementType === 'aporte')
  const retiros = invoices.filter(inv => inv.metadata?.movementType === 'retiro')

  const totalIncome = salesInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  const totalExpenses = purchaseInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  const balance = totalIncome - totalExpenses

  const totalCompras = compras.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
  const totalVentas = ventas.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
  const totalGastos = gastos.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
  const totalAportes = aportes.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
  const totalRetiros = retiros.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)

  const clientes = new Set(ventas.map(v => v.metadata?.cliente).filter(Boolean))
  const proveedores = new Set(compras.map(c => c.metadata?.provider).filter(Boolean))

  const incomeByCategory = salesInvoices.reduce((acc, inv) => {
    acc[inv.category] = (acc[inv.category] || 0) + parseFloat(inv.amount)
    return acc
  }, {})

  const expensesByCategory = purchaseInvoices.reduce((acc, inv) => {
    acc[inv.category] = (acc[inv.category] || 0) + parseFloat(inv.amount)
    return acc
  }, {})

  let context = `INFORMACIÓN DE LA EMPRESA:\n`
  if (companyData) {
    context += `- Razón Social: ${companyData.name}\n`
    context += `- CUIT: ${companyData.cuit}\n`
    context += `- Rubro: ${companyData.industry}\n`
    context += `- Ejercicio Fiscal: ${companyData.fiscalYear}\n`
    context += `- Moneda: ${companyData.currency}\n\n`
  }

  context += `RESUMEN FINANCIERO:\n`
  context += `- Total de Facturas: ${invoices.length}\n`
  context += `- Facturas de Venta: ${salesInvoices.length}\n`
  context += `- Facturas de Compra: ${purchaseInvoices.length}\n`
  context += `- Total Ingresos: $${totalIncome.toFixed(2)}\n`
  context += `- Total Gastos: $${totalExpenses.toFixed(2)}\n`
  context += `- Balance: $${balance.toFixed(2)} ${balance >= 0 ? '(Positivo)' : '(Negativo)'}\n`
  context += `- Margen de Ganancia: ${totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : 0}%\n\n`

  context += `ANÁLISIS POR TIPO DE MOVIMIENTO:\n`
  context += `- Compras: ${compras.length} operaciones - Total: $${totalCompras.toFixed(2)}\n`
  context += `- Ventas: ${ventas.length} operaciones - Total: $${totalVentas.toFixed(2)}\n`
  context += `- Gastos: ${gastos.length} operaciones - Total: $${totalGastos.toFixed(2)}\n`
  context += `- Aportes de Capital: ${aportes.length} operaciones - Total: $${totalAportes.toFixed(2)}\n`
  context += `- Retiros: ${retiros.length} operaciones - Total: $${totalRetiros.toFixed(2)}\n\n`

  context += `ANÁLISIS DE CLIENTES Y PROVEEDORES:\n`
  context += `- Clientes Únicos: ${clientes.size}\n`
  context += `- Venta Promedio por Cliente: $${clientes.size > 0 ? (totalVentas / clientes.size).toFixed(2) : 0}\n`
  context += `- Proveedores Únicos: ${proveedores.size}\n`
  context += `- Compra Promedio por Proveedor: $${proveedores.size > 0 ? (totalCompras / proveedores.size).toFixed(2) : 0}\n\n`

  if (Object.keys(incomeByCategory).length > 0) {
    context += `INGRESOS POR CATEGORÍA:\n`
    Object.entries(incomeByCategory).forEach(([cat, amount]) => {
      context += `- ${cat}: $${amount.toFixed(2)}\n`
    })
    context += `\n`
  }

  if (Object.keys(expensesByCategory).length > 0) {
    context += `GASTOS POR CATEGORÍA:\n`
    Object.entries(expensesByCategory).forEach(([cat, amount]) => {
      context += `- ${cat}: $${amount.toFixed(2)}\n`
    })
    context += `\n`
  }

  context += `FACTURAS RECIENTES:\n`
  const recentInvoices = invoices.slice(-10).reverse()
  recentInvoices.forEach(inv => {
    const type = inv.type === 'income' ? 'VENTA' : 'COMPRA'
    context += `- [${type}] ${inv.number} - ${inv.date} - $${parseFloat(inv.amount).toFixed(2)} - ${inv.category} - ${inv.description}\n`
  })

  return context
}

/**
 * Envía un mensaje al asistente (sin IA externa)
 */
export async function sendMessageToGPT(userMessage, companyData, invoices, conversationHistory = []) {
  return {
    success: false,
    error: 'El asistente de IA no está disponible en este momento. Podés consultar tus datos financieros directamente desde el Dashboard.'
  }
}

/**
 * Genera sugerencias de preguntas basadas en el contexto financiero
 */
export function generateSuggestedQuestions(companyData, invoices) {
  if (!invoices || invoices.length === 0) {
    return [
      '🏛️ Obligaciones con ARCA 2025',
      '📊 Cómo estructurar mi contabilidad',
      '💰 Impuestos como PyME',
      '📈 Facturación electrónica'
    ]
  }

  const totalIncome = invoices
    .filter(inv => inv.type === 'income')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)

  const totalExpenses = invoices
    .filter(inv => inv.type === 'expense')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)

  const balance = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

  const suggestions = []
  suggestions.push('🏛️ ¿Cuánto debo pagar de IVA este mes?')
  suggestions.push('📊 Estado de resultados completo')
  suggestions.push('👥 ¿Qué clientes me generan más ingresos?')

  if (balance > 0) {
    suggestions.push('💰 ¿Cómo optimizar fiscalmente mis ganancias?')
    suggestions.push('📈 Proyecta mi crecimiento a 6 meses')
  } else {
    suggestions.push('⚠️ Plan de acción para mejorar mi rentabilidad')
    suggestions.push('💡 ¿Dónde puedo reducir costos?')
  }

  if (profitMargin < 15) {
    suggestions.push('📉 ¿Por qué mi margen es bajo?')
  } else {
    suggestions.push('🎯 ¿Cómo aumentar aún más mi margen?')
  }

  suggestions.push('🔮 Flujo de caja proyectado próximos 3 meses')
  suggestions.push('📅 ¿Cuándo vencen mis obligaciones fiscales?')

  return suggestions.slice(0, 6)
}

/**
 * Genera un resumen financiero automático
 */
export async function generateFinancialSummary(companyData, invoices) {
  return {
    success: false,
    error: 'El análisis con IA no está disponible.'
  }
}

/**
 * Función genérica de análisis (stub sin IA)
 */
export async function analyzeWithOpenAI(prompt, options = {}) {
  throw new Error('Análisis con IA no disponible.')
}
