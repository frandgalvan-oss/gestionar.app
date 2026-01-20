# 🔧 SOLUCIÓN PARA ERROR 500 EN REGISTRO DE USUARIOS

## ❌ **Problema actual:**
```
Database error saving new user
Error 500 en: /auth/v1/signup
```

Este error ocurre porque el trigger `handle_new_user()` que crea automáticamente el perfil del usuario está fallando.

---

## ✅ **SOLUCIÓN (2 minutos)**

### **Paso 1: Abrir SQL Editor**
Ve a: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/sql/new

### **Paso 2: Ejecutar el script de corrección**
Copia y pega el contenido completo del archivo: **`FIX_REGISTRO_USUARIOS.sql`**

### **Paso 3: Click en "RUN"**
Deberías ver varios resultados mostrando:
- Columnas de la tabla `profiles`
- Información del trigger `on_auth_user_created`

---

## 🎯 **¿Qué hace este script?**

1. **Corrige el trigger** `handle_new_user()` agregando:
   - Manejo de conflictos con `ON CONFLICT`
   - Manejo de errores con `EXCEPTION`
   - Logging de errores sin fallar el registro

2. **Verifica columnas** de la tabla `profiles`:
   - `subscription_status`
   - `subscription_end_date`
   - `is_admin`
   - `last_payment_date`
   - `is_premium_permanent`

3. **Corrige políticas RLS** para permitir:
   - INSERT de perfiles propios
   - SELECT de perfiles propios
   - UPDATE de perfiles propios

---

## ✅ **Verificación**

Después de ejecutar el script:

1. Ve a: https://gestionar.app/register
2. Intenta registrar un nuevo usuario
3. El error "Database error saving new user" **desaparecerá**
4. El usuario se creará correctamente

---

## 🔍 **Causa del problema**

El trigger `handle_new_user()` intentaba insertar en la tabla `profiles` pero:
- Podía haber un conflicto si el perfil ya existía
- No manejaba errores, causando que el registro completo fallara
- Las políticas RLS podían estar bloqueando la inserción

La solución agrega manejo robusto de errores y asegura que el registro del usuario nunca falle, incluso si hay problemas al crear el perfil.

---

## 📝 **Notas importantes**

- Este script es **seguro de ejecutar múltiples veces**
- No elimina datos existentes
- Solo corrige la función y las políticas
- Agrega columnas faltantes si es necesario

---

**Tiempo estimado: 2 minutos**
