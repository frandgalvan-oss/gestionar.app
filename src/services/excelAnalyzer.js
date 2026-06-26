/**
 * Limpia y prepara los datos del Excel antes del análisis
 */
function cleanExcelData(rawData) {
  if (!rawData || rawData.length === 0) return []

  const nonEmptyRows = rawData.filter(row => {
    const values = Object.values(row)
    return values.some(val => val !== null && val !== undefined && val !== '')
  })

  if (nonEmptyRows.length === 0) return []

  const allColumns = new Set()
  nonEmptyRows.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key && key.trim() && !key.startsWith('__EMPTY')) {
        allColumns.add(key)
      }
    })
  })

  return nonEmptyRows.map(row => {
    const cleanRow = {}
    allColumns.forEach(col => {
      const value = row[col]
      if (value !== null && value !== undefined && value !== '') {
        cleanRow[col] = value
      }
    })
    return cleanRow
  }).filter(row => Object.keys(row).length > 0)
}

/**
 * Obtiene las columnas válidas del Excel
 */
function getValidColumns(data) {
  if (!data || data.length === 0) return []

  const columnSet = new Set()

  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key &&
          key.trim() &&
          !key.startsWith('__EMPTY') &&
          !key.match(/^Column\d+$/i) &&
          key !== 'undefined') {
        columnSet.add(key)
      }
    })
  })

  return Array.from(columnSet)
}

/**
 * Analiza la estructura de un Excel y sugiere el mejor mapeo de columnas
 */
export async function analyzeExcelStructure(columns, sampleData) {
  const cleanedData = cleanExcelData(sampleData)
  const validColumns = getValidColumns(cleanedData)
  const cols = validColumns.length > 0 ? validColumns : columns
  return autoMapColumns(cols)
}

/**
 * Mapeo automático de columnas
 */
function autoMapColumns(columns) {
  const mapping = {}

  console.log('Auto-mapping columns:', columns)

  columns.forEach(col => {
    const colLower = col.toLowerCase().trim()

    if (colLower.includes('producto') || colLower.includes('nombre') || colLower === 'item') {
      if (!mapping.name) {
        mapping.name = col
      }
    }

    if (colLower.includes('categoria') || colLower.includes('categoría') || colLower.includes('category') || colLower.includes('tipo') || colLower.includes('rubro')) {
      if (!mapping.category) {
        mapping.category = col
      }
    }

    if (colLower.includes('cantidad') || colLower.includes('stock') || colLower === 'qty' || colLower.includes('existencia')) {
      if (!mapping.current_stock) {
        mapping.current_stock = col
      }
    }

    if (colLower.includes('costo unitario') || colLower.includes('cost per unit')) {
      mapping.unit_cost = col
    } else if ((colLower.includes('costo') || colLower.includes('cost')) &&
               !colLower.includes('bruto') &&
               !colLower.includes('total') &&
               !mapping.unit_cost) {
      mapping.unit_cost = col
    }

    if ((colLower.includes('precio minorista') || colLower.includes('retail price')) &&
        !colLower.includes('deseado') &&
        !colLower.includes('redondeado')) {
      mapping.sale_price = col
    } else if ((colLower.includes('precio mayorista') || colLower.includes('wholesale')) &&
               !mapping.sale_price) {
      mapping.sale_price = col
    } else if ((colLower.includes('precio') || colLower.includes('price')) &&
               (colLower.includes('venta') || colLower.includes('sale') || colLower === 'precio') &&
               !colLower.includes('costo') &&
               !mapping.sale_price) {
      mapping.sale_price = col
    }

    if (colLower.includes('sku') || colLower.includes('codigo') || colLower.includes('código') || colLower.includes('code')) {
      if (!mapping.sku) {
        mapping.sku = col
      }
    }

    if (colLower.includes('proveedor') || colLower.includes('supplier')) {
      if (!mapping.supplier) {
        mapping.supplier = col
      }
    }
  })

  console.log('Final auto-mapping:', mapping)
  return mapping
}
