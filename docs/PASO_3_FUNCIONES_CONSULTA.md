# Paso 3: Funciones de Consulta y Transparencia

## 📋 Resumen Ejecutivo

Este documento describe la implementación de funciones de consulta y contadores globales en el contrato `CarbonCertifier` para mejorar la transparencia y auditoría. Se añadieron contadores de certificados totales y CO2e acumulado, junto con funciones públicas para consultarlos.

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Completado y probado  
**Tests:** 14/14 pasando (5 nuevos tests)  
**Contrato:** `contracts/carbon-certifier/`

---

## 🎯 Objetivo

Implementar funciones de consulta que permitan:
1. Contar el total de certificados acuñados
2. Acumular y consultar el total de CO2e reducido
3. Proporcionar transparencia y capacidad de auditoría
4. Mantener estado global en Instance Storage eficientemente

---

## 🔧 Cambios Implementados

### 1. Expansión del Enum `DataKey`

**Archivo:** `contract.rs`

```rust
/// Claves para el almacenamiento
/// 
/// Incluye tanto Persistent Storage (para certificados) como Instance Storage (para contadores)
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Almacenamiento persistente de certificados por ID (u32)
    Certificates(u32),
    /// Contador total de certificados en Instance Storage
    TotalCertificates,
    /// Contador total de CO2e acuñado en Instance Storage
    TotalCO2e,
}
```

**Cambios:**
- ✅ `TotalCertificates` - Para contador de certificados en Instance Storage
- ✅ `TotalCO2e` - Para contador de CO2e en Instance Storage
- ✅ Mantiene `Certificates(u32)` para almacenamiento de certificados

### 2. Funciones Privadas de Actualización

#### `increment_certificate_count()`

```rust
/// Incrementa el contador total de certificados acuñados
/// 
/// Función privada que actualiza el contador en Instance Storage
/// Usa Instance Storage porque es un dato pequeño y permanente
fn increment_certificate_count(env: &Env) {
    let key = DataKey::TotalCertificates;
    let current_count: u32 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(current_count + 1));
}
```

**Características:**
- Función privada (solo llamada internamente)
- Lee el valor actual o usa 0 como default
- Incrementa en 1 y guarda
- Usa Instance Storage (dato pequeño y fijo)

#### `add_co2e_to_total()`

```rust
/// Suma CO2e al total acumulado de créditos de carbono acuñados
/// 
/// Función privada que actualiza el contador de CO2e en Instance Storage
/// Usa Instance Storage porque es un dato pequeño y permanente
fn add_co2e_to_total(env: &Env, co2e_tons: u128) {
    let key = DataKey::TotalCO2e;
    let current_total: u128 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(current_total + co2e_tons));
}
```

**Características:**
- Función privada
- Recibe `co2e_tons` como parámetro
- Suma al total acumulado
- Usa `u128` para soportar grandes cantidades
- Usa Instance Storage

### 3. Funciones Públicas de Consulta

#### `get_total_certificates()`

```rust
/// Obtiene el total de certificados de carbono acuñados
/// 
/// # Retorna
/// `u32` - El número total de certificados acuñados
pub fn get_total_certificates(env: Env) -> u32 {
    let key = DataKey::TotalCertificates;
    env.storage().instance().get(&key).unwrap_or(0)
}
```

**Características:**
- Pública (consulta sin costo de gas en Soroban)
- Retorna `u32`
- Si no existe, retorna 0 (nunca falla)

#### `get_total_co2e()`

```rust
/// Obtiene el total de toneladas de CO2e acuñadas
/// 
/// # Retorna
/// `u128` - El total de toneladas de CO2e acuñadas
pub fn get_total_co2e(env: Env) -> u128 {
    let key = DataKey::TotalCO2e;
    env.storage().instance().get(&key).unwrap_or(0)
}
```

**Características:**
- Pública
- Retorna `u128` (soporta ~3.4 x 10^38 toneladas)
- Si no existe, retorna 0

### 4. Actualización de `mint_certificate()`

```rust
// Almacenar el certificado en Persistent Storage
env.storage().persistent().set(&key, &record);

// Actualizar contadores globales
Self::increment_certificate_count(&env);
Self::add_co2e_to_total(&env, record.co2e_tons);

Ok(())
```

**Flujo actualizado:**
1. Autorización
2. Verificación de duplicados
3. Almacenar certificado en Persistent Storage
4. **NUEVO:** Incrementar contador de certificados
5. **NUEVO:** Sumar CO2e al total
6. Retornar éxito

---

## 🧪 Tests Implementados

### Test 1: Contador Inicial en Cero

```rust
#[test]
fn test_get_total_certificates_initial_zero() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CarbonCertifier);
    let client = CarbonCertifierClient::new(&env, &contract_id);
    
    // El contador debe comenzar en cero
    let total = client.get_total_certificates();
    assert_eq!(total, 0);
}
```

### Test 2: CO2e Inicial en Cero

```rust
#[test]
fn test_get_total_co2e_initial_zero() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CarbonCertifier);
    let client = CarbonCertifierClient::new(&env, &contract_id);
    
    // El contador debe comenzar en cero
    let total = client.get_total_co2e();
    assert_eq!(total, 0);
}
```

### Test 3: Incremento en Acuñación

```rust
#[test]
fn test_counters_increment_on_mint() {
    // ... setup ...
    
    // Verificar que comienza en cero
    assert_eq!(client.get_total_certificates(), 0);
    assert_eq!(client.get_total_co2e(), 0);
    
    // Acuñar el primer certificado (100 CO2e)
    client.mint_certificate(&1, &record1);
    assert_eq!(client.get_total_certificates(), 1);
    assert_eq!(client.get_total_co2e(), 100);
    
    // Acuñar el segundo certificado (150 CO2e)
    client.mint_certificate(&2, &record2);
    assert_eq!(client.get_total_certificates(), 2);
    assert_eq!(client.get_total_co2e(), 250); // 100 + 150
}
```

### Test 4: Acumulación Múltiple

```rust
#[test]
fn test_counters_accumulate_multiple_mints() {
    let mut total_co2e_expected: u128 = 0;
    
    // Acuñar 5 certificados
    for i in 1..=5 {
        let co2e_amount = (i * 50) as u128;
        total_co2e_expected += co2e_amount;
        
        client.mint_certificate(&i, &record);
        
        // Verificar que los contadores se actualizan correctamente
        assert_eq!(client.get_total_certificates(), i);
        assert_eq!(client.get_total_co2e(), total_co2e_expected);
    }
    
    // Verificación final
    assert_eq!(client.get_total_certificates(), 5);
    assert_eq!(client.get_total_co2e(), 750); // 50 + 100 + 150 + 200 + 250
}
```

### Test 5: Persistencia de Valores

```rust
#[test]
fn test_counters_persistent_across_queries() {
    // Acuñar un certificado
    client.mint_certificate(&1, &record);
    
    // Hacer múltiples consultas y verificar que el valor persiste
    for _ in 0..10 {
        assert_eq!(client.get_total_certificates(), 1);
        assert_eq!(client.get_total_co2e(), 200);
    }
}
```

---

## ✅ Resultados de Tests

```
running 14 tests
test test::test_verification_record_structure ... ok
test test::test_constructor ... ok
test test::test_get_certificate_data_not_found ... ok
test test::test_get_certificate_data_success ... ok
test test::test_mint_certificate_success ... ok
test test::test_mint_certificate_already_exists ... ok
test test::test_mint_certificate_unauthorized ... ok
test test::test_multiple_certificates ... ok
test test::test_certificate_persistent_storage ... ok
test test::test_get_total_certificates_initial_zero ... ok  ← NUEVO
test test::test_get_total_co2e_initial_zero ... ok         ← NUEVO
test test::test_counters_increment_on_mint ... ok          ← NUEVO
test test::test_counters_accumulate_multiple_mints ... ok  ← NUEVO
test test::test_counters_persistent_across_queries ... ok  ← NUEVO

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**Cobertura:**
- ✅ Valores iniciales en cero
- ✅ Incremento en acuñación simple
- ✅ Acumulación en múltiples acuñaciones
- ✅ Persistencia de valores
- ✅ Integración con función `mint_certificate()`

---

## 🔐 Seguridad y Diseño

### Instance Storage vs Persistent Storage

**Instance Storage (usado para contadores):**
- ✅ Ideal para datos pequeños y fijos
- ✅ Costo base único por contrato
- ✅ No crece con el número de certificados
- ✅ Eficiente para estado global

**Persistent Storage (usado para certificados):**
- ✅ Ideal para colecciones que crecen
- ✅ Cada certificado tiene costo independiente
- ✅ Evita State Bloat
- ✅ Permite escalar indefinidamente

### Decisiones de Diseño

1. **u32 para contador de certificados**
   - Suficiente para ~4.2 billones de certificados
   - Consumo de memoria mínimo

2. **u128 para contador de CO2e**
   - Soporta cantidades astronómicas de CO2e
   - Compatible con `co2e_tons` en VerificationRecord

3. **Default a 0**
   - Nunca falla, siempre retorna un valor
   - Comportamiento predecible

4. **Funciones privadas**
   - Solo el contrato puede modificar contadores
   - Prevención de manipulación externa

---

## 📊 Funciones Disponibles

| Función | Tipo | Autorización | Descripción |
|---------|------|--------------|-------------|
| `__constructor` | Constructor | Ninguna | Inicializa el contrato |
| `get_certificate_data` | Query | Ninguna | Lee un certificado por ID |
| `mint_certificate` | Write | Verificador | Acuña un nuevo certificado |
| `get_total_certificates` | Query | Ninguna | Obtiene total de certificados |
| `get_total_co2e` | Query | Ninguna | Obtiene total de CO2e acuñado |

---

## 💻 Ejemplos de Uso

### Consultar Estadísticas Globales

```rust
// Obtener el número total de certificados
let total_certs = client.get_total_certificates();
println!("Total certificados: {}", total_certs);

// Obtener el total de CO2e reducido
let total_co2e = client.get_total_co2e();
println!("Total CO2e reducido: {} toneladas", total_co2e);

// Calcular promedio
let avg_co2e = if total_certs > 0 {
    total_co2e / total_certs as u128
} else {
    0
};
println!("Promedio CO2e por certificado: {} toneladas", avg_co2e);
```

### Dashboard de Auditoría

```rust
// Consultas sin costo en Soroban
fn audit_dashboard(client: &CarbonCertifierClient) {
    let total_certificates = client.get_total_certificates();
    let total_co2e = client.get_total_co2e();
    
    println!("=== Dashboard de CarbonCertifier ===");
    println!("Total de Certificados: {}", total_certificates);
    println!("Total de CO2e Reducido: {} toneladas", total_co2e);
    
    if total_certificates > 0 {
        let avg = total_co2e / total_certificates as u128;
        println!("Promedio: {} toneladas/certificado", avg);
    }
}
```

---

## 📈 Beneficios de Implementación

### 1. Transparencia
- ✅ Cualquiera puede consultar estadísticas
- ✅ Datos on-chain verificables
- ✅ Auditoría pública

### 2. Dashboard y UI
- ✅ Fácil de mostrar en frontend
- ✅ Consultas sin costo
- ✅ Actualización en tiempo real

### 3. Auditoría
- ✅ Verificación de integridad
- ✅ Comparación con registros externos
- ✅ Detección de discrepancias

### 4. Reportes
- ✅ Generación automática de reportes
- ✅ APIs para análisis
- ✅ Integración con sistemas externos

---

## 🎓 Conceptos Clave

### Instance Storage

Instance Storage es el almacenamiento de estado del contrato:
- Vive con la instancia del contrato
- Ideal para configuración y contadores globales
- Costo fijo independiente del número de entradas
- No debe usarse para colecciones que crezcan (State Bloat)

### Contadores Globales

Los contadores globales permiten:
- Estadísticas agregadas sin iterar
- Consultas eficientes (O(1))
- Auditoría y verificación
- Análisis y reportes

### Función Privada vs Pública

**Privada:**
- Solo llamada internamente por el contrato
- No visible en la interfaz pública
- Previene manipulación externa

**Pública:**
- Llamable desde fuera del contrato
- Parte de la API del contrato
- Documentada y estable

---

## 🚀 Próximos Pasos Sugeridos

### Paso 4: Listado de Certificados
- [ ] `list_certificates_by_farmer(farmer_address)` - Certificados de un agricultor
- [ ] `list_certificates_by_verifier(verifier_address)` - Certificados de un verificador
- [ ] `get_certificate_ids()` - Lista de todos los IDs

### Paso 5: Integración NFT
- [ ] Integrar `stellar-non-fungible` library
- [ ] Convertir certificados a NFTs
- [ ] Funciones de transferencia

### Paso 6: Eventos y Logging
- [ ] Evento `CertificateMinted`
- [ ] Evento `CO2eUpdated`
- [ ] Logs para auditoría

### Paso 7: Validación de Datos
- [ ] Validar que SQ > 0
- [ ] Validar que CO2e > 0
- [ ] Validar direcciones válidas

---

## 📝 Notas Técnicas

### Limitaciones Actuales

1. ⚠️ **Sin límite de contadores** - Podrían alcanzar los límites de u32/u128
2. ⚠️ **Sin validación de rangos** - No valida que los valores sean razonables
3. ⚠️ **Sin historial** - Solo guarda el total, no el historial
4. ⚠️ **Sin timestamp** - No sabe cuándo se actualizó por última vez

### Optimizaciones Futuras

1. **Gas Efficiency** - Los contadores ya son eficientes (Instance Storage)
2. **Batch Updates** - Considerar actualizaciones en lote
3. **Caching** - Las consultas ya son rápidas (local storage)
4. **Indexing** - Agregar índices si se implementan listados

---

## 🔗 Referencias

- [Soroban Storage Types](https://developers.stellar.org/docs/build/smart-contracts/tutorials/state-management)
- [Instance Storage](https://developers.stellar.org/docs/build/smart-contracts/tutorials/state-management#instance-storage)
- [Paso 1: Contrato Base](./PASO_1_CONTRATO_BASE.md)
- [Paso 2: Almacenamiento y Minting](./PASO_2_ALMACENAMIENTO_MINTING.md)

---

**Documento generado:** 29 de Octubre, 2025  
**Autor:** Auto (AI Assistant)  
**Versión del Contrato:** 0.0.3  
**Estado:** ✅ Completo - Listo para Paso 4

