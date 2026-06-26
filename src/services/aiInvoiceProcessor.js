import { processInvoiceFile } from './invoiceProcessor'

/**
 * Procesa una factura sin IA — usa solo extracción básica de OCR/PDF
 */
export async function processInvoiceWithAI(file, existingInvoices = [], onProgress) {
  try {
    onProgress?.({ status: 'Extrayendo datos de la factura...', progress: 20 })

    const basicData = await processInvoiceFile(file, (progress) => {
      onProgress?.({
        status: progress.status,
        progress: 20 + (progress.progress * 0.8)
      })
    })

    onProgress?.({ status: 'Completado', progress: 100 })

    return {
      ...basicData,
      aiAnalysis: {
        isValid: true,
        isDuplicate: false,
        duplicateReason: null,
        confidence: 0.5,
        warnings: [],
        suggestions: []
      },
      processed: true,
      aiProcessed: false
    }
  } catch (error) {
    console.error('Error en procesamiento de factura:', error)
    throw error
  }
}

/**
 * Procesa múltiples facturas sin IA
 */
export async function processMultipleInvoicesWithAI(files, existingInvoices = [], onProgress) {
  const results = []
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    onProgress?.({
      status: `Procesando ${i + 1} de ${total}: ${file.name}`,
      progress: (i / total) * 100,
      currentFile: i + 1,
      totalFiles: total
    })

    try {
      const result = await processInvoiceWithAI(file, existingInvoices, (fileProgress) => {
        onProgress?.({
          ...fileProgress,
          currentFile: i + 1,
          totalFiles: total
        })
      })
      results.push(result)
    } catch (error) {
      console.error(`Error procesando ${file.name}:`, error)
      results.push({
        id: Date.now() + i,
        fileName: file.name,
        error: error.message,
        processed: false,
        aiProcessed: false
      })
    }
  }

  onProgress?.({
    status: 'Todos los archivos procesados',
    progress: 100,
    currentFile: total,
    totalFiles: total
  })

  return results
}

/**
 * Valida una factura sin IA
 */
export async function validateInvoiceWithAI(invoiceData, existingInvoices = []) {
  return {
    isValid: true,
    isDuplicate: false,
    errors: [],
    warnings: [],
    confidence: 0.5
  }
}

/**
 * Detecta duplicados en un lote de facturas
 */
export function detectDuplicates(invoices) {
  const duplicates = []
  const seen = new Map()

  for (const invoice of invoices) {
    const key = `${invoice.number}-${invoice.date}-${invoice.amount}`

    if (seen.has(key)) {
      duplicates.push({
        original: seen.get(key),
        duplicate: invoice,
        reason: 'Mismo número, fecha y monto'
      })
    } else {
      seen.set(key, invoice)
    }
  }

  return duplicates
}

/**
 * Limpia y normaliza datos de factura
 */
export function normalizeInvoiceData(invoice) {
  return {
    ...invoice,
    number: invoice.number?.trim().toUpperCase() || '',
    amount: parseFloat(invoice.amount) || 0,
    date: invoice.date || new Date().toISOString().split('T')[0],
    description: invoice.description?.trim() || '',
    category: invoice.category?.trim() || 'Sin categoría',
    taxes: Array.isArray(invoice.taxes) ? invoice.taxes : []
  }
}
