# 🚨 EJECUTAR EN ESTE ORDEN - MUY IMPORTANTE

## ❌ **Problema actual:**
Faltan columnas en la tabla `profiles`, causando errores 406 en toda la aplicación.

---

## ✅ **SOLUCIÓN: Ejecutar 3 scripts SQL en orden**

### **📍 Dónde ejecutar:**
```
https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/sql/new
```

---

## **PASO 1: Corregir tabla profiles** ⭐ **EJECUTAR PRIMERO**

**Archivo:** `database/migrations/00_fix_profiles_columns.sql`

Este script:
- ✅ Agrega columnas faltantes a `profiles`
- ✅ Crea índices necesarios
- ✅ Actualiza usuarios existentes

**Resultado esperado:**
- Verás una tabla mostrando todas las columnas de `profiles`
- Los errores 406 desaparecerán

---

## **PASO 2: Sistema de pagos básico**

**Archivo:** `database/migrations/create_payment_system.sql`

Este script:
- ✅ Crea tabla `payment_receipts`
- ✅ Crea funciones para procesar pagos
- ✅ Crea funciones para generar recibos
- ✅ Configura políticas RLS

**Resultado esperado:**
- Verás mensajes `CREATE TABLE`, `CREATE FUNCTION`, etc.
- Nueva tabla `payment_receipts` visible en el editor

---

## **PASO 3: Sistema de seguridad empresarial**

**Archivo:** `database/migrations/enterprise_payment_security.sql`

Este script:
- ✅ Crea 5 tablas de auditoría y seguridad
- ✅ Crea funciones de detección de fraude
- ✅ Configura sistema de bloqueos
- ✅ Implementa logging completo

**Resultado esperado:**
- Verás muchos mensajes `CREATE TABLE`, `CREATE FUNCTION`
- 5 nuevas tablas de seguridad creadas

---

## 🔍 **Verificar que funcionó:**

### **1. Verificar columnas de profiles:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

Deberías ver:
- ✅ `subscription_status`
- ✅ `subscription_end_date`
- ✅ `last_payment_date`
- ✅ `is_premium_permanent`
- ✅ `is_admin`
- ✅ `trial_ends_at`
- ✅ `is_premium`

### **2. Verificar nuevas tablas:**
Ve a: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/editor

Deberías ver:
- ✅ `payment_receipts`
- ✅ `payment_audit_logs`
- ✅ `payment_attempts`
- ✅ `security_blocks`
- ✅ `mercadopago_webhooks`
- ✅ `subscription_state_history`

---

## 🎯 **Después de ejecutar los 3 scripts:**

1. **Recargar la aplicación** (F5)
2. Los errores 406 desaparecerán
3. El botón **"Mi Suscripción"** funcionará
4. Podrás ver historial de pagos y descargar PDFs

---

## ⚠️ **IMPORTANTE:**

- **EJECUTAR EN ORDEN:** Primero `00_fix_profiles_columns.sql`, luego los otros dos
- **NO SALTAR PASOS:** Cada script depende del anterior
- **USAR SQL EDITOR:** No usar Edge Functions ni otros lugares

---

## 📞 **Si hay errores:**

1. Copia el mensaje de error completo
2. Verifica que estés en el SQL Editor correcto
3. Asegúrate de copiar TODO el contenido del archivo SQL

---

**Tiempo total: ~5 minutos**
