# Paso 5: Validación de Datos e Invariantes de Seguridad

## 📋 Resumen Ejecutivo

Este documento describe la implementación de validación de datos de negocio y sistema de eventos para mejorar la seguridad y transparencia del contrato `CarbonCertifier`. Se añadió validación estricta de inputs y emisión de eventos para auditoría off-chain.

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Completado y probado  
**Tests:** 22/22 pasando (3 nuevos tests)  
**Contrato:** `contracts/carbon-certifier/`

---

## 🎯 Objetivo

Implementar:
1. Validación estricta de datos de negocio
2. Sistema de eventos para auditoría off-chain
3. Prevención de estados inválidos en el contrato

---

## 🔧 Cambios Implementados

### 1. Nuevo Error: `InvalidInput`

**Archivo:** `contract.rs`

```rust
/// Errores del contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    /// El certificado ya existe en el almacenamiento
    AlreadyExists = 1,
    /// El certificado no se encontró en el almacenamiento
    NotFound = 2,
    /// Datos de entrada inválidos (hectares o CO2e <= 0)
    InvalidInput = 3,
}
```

**Uso:**
- Detecta datos de entrada inválidos antes de almacenar
- Previene estados inconsistentes
- Mensaje de error claro para debugging

### 2. Evento: `CertificateMintedEvent`

```rust
/// Eventos del contrato
#[contractevent]
#[derive(Clone)]
pub struct CertificateMintedEvent {
    /// ID único del certificado acuñado
    pub certificate_id: u32,
    /// Dirección del agricultor beneficiario
    pub farmer: Address,
    /// Dirección del verificador autorizado
    pub verifier: Address,
    /// Toneladas de CO2e acuñadas
    pub tons_minted: u128,
    /// Timestamp de la acuñación
    pub timestamp: u64,
}
```

**Características:**
- Captura los datos clave para auditoría
- Timestamp automático de la acuñación
- Permite ingesta off-chain
- Inmutable en el ledger

### 3. Validación en `mint_certificate()`

```rust
// ✅ VALIDACIÓN DE DATOS: Verificar que los datos de entrada sean válidos
if record.hectares_not_burned == 0 {
    return Err(ContractError::InvalidInput);
}
if record.co2e_tons == 0 {
    return Err(ContractError::InvalidInput);
}
```

**Validaciones implementadas:**
- ✅ `hectares_not_burned` > 0
- ✅ `co2e_tons` > 0
- ✅ Ejecuta ANTES de cualquier escritura
- ✅ Fallo temprano (fail-fast)

### 4. Emisión de Evento

```rust
// Obtener timestamp de la acuñación
let timestamp = env.ledger().timestamp();

// ✅ EMITIR EVENTO: Notificar el acuñamiento del certificado
CertificateMintedEvent {
    certificate_id,
    farmer: record.farmer_address,
    verifier: record.verifier_address,
    tons_minted: record.co2e_tons,
    timestamp,
}
.publish(&env);
```

**Flujo:**
1. Obtener timestamp del ledger
2. Crear el evento con todos los datos
3. Publicar con `.publish(&env)`
4. Disponible para ingesta off-chain

---

## 🧪 Tests Implementados

### Test 1: CO2e Zero Inválido

```rust
#[test]
fn test_mint_certificate_invalid_co2e_zero() {
    // Intentar acuñar con co2e_tons = 0 (inválido)
    let record = VerificationRecord {
        // ...
        co2e_tons: 0, // ❌ Inválido
        // ...
    };
    
    let result = client.try_mint_certificate(&1, &record);
    
    // Debe fallar con InvalidInput
    assert!(result.is_err());
}
```

### Test 2: Hectáreas Zero Inválidas

```rust
#[test]
fn test_mint_certificate_invalid_hectares_zero() {
    // Intentar acuñar con hectares_not_burned = 0 (inválido)
    let record = VerificationRecord {
        // ...
        hectares_not_burned: 0, // ❌ Inválido
        // ...
    };
    
    let result = client.try_mint_certificate(&1, &record);
    
    // Debe fallar con InvalidInput
    assert!(result.is_err());
}
```

### Test 3: Datos Válidos

```rust
#[test]
fn test_mint_certificate_valid_data() {
    // Datos válidos (ambos > 0)
    let record = VerificationRecord {
        // ...
        hectares_not_burned: 1, // ✅ Válido (mínimo valor válido)
        co2e_tons: 1,          // ✅ Válido (mínimo valor válido)
        // ...
    };
    
    // Debe acuñar exitosamente
    client.mint_certificate(&1, &record);
    
    // Verificar que el certificado existe
    let retrieved = client.get_certificate_data(&1);
    assert_eq!(retrieved.hectares_not_burned, 1);
    assert_eq!(retrieved.co2e_tons, 1);
}
```

---

## ✅ Resultados de Tests

```
running 22 tests
test test::test_verification_record_structure ... ok
test test::test_constructor ... ok
test test::test_get_certificate_data_not_found ... ok
test test::test_get_certificate_data_success ... ok
test test::test_mint_certificate_success ... ok
test test::test_mint_certificate_already_exists ... ok
test test::test_mint_certificate_unauthorized ... ok
test test::test_multiple_certificates ... ok
test test::test_certificate_persistent_storage ... ok
test test::test_get_total_certificates_initial_zero ... ok
test test::test_get_total_co2e_initial_zero ... ok
test test::test_counters_increment_on_mint ... ok
test test::test_counters_accumulate_multiple_mints ... ok
test test::test_counters_persistent_across_queries ... ok
test test::test_list_farmer_certificates_empty ... ok
test test::test_list_verifier_certificates_empty ... ok
test test::test_certificates_indexed_by_actor ... ok
test test::test_multiple_certificates_for_same_actor ... ok
test test::test_certificates_isolated_by_actor ... ok
test test::test_mint_certificate_invalid_co2e_zero ... ok  ← NUEVO
test test::test_mint_certificate_invalid_hectares_zero ... ok  ← NUEVO
test test::test_mint_certificate_valid_data ... ok  ← NUEVO

test result: ok. 22 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**Cobertura:**
- ✅ Validación de CO2e = 0
- ✅ Validación de hectáreas = 0
- ✅ Aceptación de datos válidos (mínimos)
- ✅ Integración con mint_certificate

---

## 🔐 Seguridad y Diseño

### Fail-Fast Principle

**Validación Temprana:**
```rust
// ✅ Ejecuta ANTES de cualquier escritura
if record.hectares_not_burned == 0 {
    return Err(ContractError::InvalidInput);
}

// ❌ No llega a almacenar nada
```

**Beneficios:**
- Evita estados inconsistentes
- Ahorra gas en transacciones inválidas
- Mensajes de error claros

### Invariantes de Negocio

Las validaciones garantizan:
1. **SQ > 0** - Debe haber superficie verificada
2. **CO2e > 0** - Debe haber reducción de emisiones
3. **Consistencia** - Datos siempre válidos on-chain

### Eventos On-Chain

**Características:**
- Inmutables en el ledger
- Indexables por explorers
- Ingestionables off-chain
- Auditoría pública

---

## 📊 Flujo Completo de Acuñación

```rust
pub fn mint_certificate(...) -> Result<(), ContractError> {
    // 1. Autorización
    record.verifier_address.require_auth();
    
    // 2. Validación de datos
    if record.hectares_not_burned == 0 {
        return Err(ContractError::InvalidInput);
    }
    if record.co2e_tons == 0 {
        return Err(ContractError::InvalidInput);
    }
    
    // 3. Verificación de duplicados
    if env.storage().persistent().get::<DataKey, VerificationRecord>(&key).is_some() {
        return Err(ContractError::AlreadyExists);
    }
    
    // 4. Almacenar certificado
    env.storage().persistent().set(&key, &record);
    
    // 5. Actualizar contadores
    Self::increment_certificate_count(&env);
    Self::add_co2e_to_total(&env, record.co2e_tons);
    
    // 6. Indexar
    Self::add_to_index(&env, record.farmer_address.clone(), certificate_id, true);
    Self::add_to_index(&env, record.verifier_address.clone(), certificate_id, false);
    
    // 7. Emitir evento
    let timestamp = env.ledger().timestamp();
    CertificateMintedEvent { /* ... */ }.publish(&env);
    
    Ok(())
}
```

---

## 💻 Ejemplos de Uso

### Validación de Datos

```rust
// ❌ Falla: co2e_tons = 0
let result = client.try_mint_certificate(&1, &VerificationRecord {
    hectares_not_burned: 10,
    co2e_tons: 0, // ❌ Inválido
    // ...
});

// ✅ Éxito: valores válidos
client.mint_certificate(&1, &VerificationRecord {
    hectares_not_burned: 10,
    co2e_tons: 100, // ✅ Válido
    // ...
});
```

### Ingesta de Eventos Off-Chain

```typescript
// Ejemplo en TypeScript
async function listenToCertificates() {
    const events = await stellarNetwork.getContractEvents({
        contractId: CONTRACT_ID,
        topics: [['CertificateMinted']],
    });

    for (const event of events) {
        const data = event.data as CertificateMintedEvent;
        
        console.log('Certificado acuñado:', {
            id: data.certificate_id,
            farmer: data.farmer,
            tons: data.tons_minted,
            timestamp: new Date(data.timestamp * 1000),
        });
        
        // Guardar en base de datos off-chain
        await db.certificates.create({
            id: data.certificate_id,
            farmer_address: data.farmer,
            co2e_tons: data.tons_minted,
            minted_at: new Date(data.timestamp * 1000),
        });
    }
}
```

---

## 📈 Beneficios de Implementación

### 1. Seguridad
- ✅ Prevención de estados inválidos
- ✅ Validación estricta de inputs
- ✅ Fail-fast en errores

### 2. Transparencia
- ✅ Eventos inmutables en ledger
- ✅ Auditoría pública
- ✅ Trazabilidad completa

### 3. Integración Off-Chain
- ✅ Eventos para databases
- ✅ Notificaciones en tiempo real
- ✅ Sincronización automática

### 4. Debugging
- ✅ Errores claros y específicos
- ✅ Trace de eventos
- ✅ Análisis histórico

---

## 🎓 Conceptos Clave

### Invariantes de Negocio

Son reglas que SIEMPRE deben cumplirse:
- SQ debe ser > 0 (hay superficie verificada)
- CO2e debe ser > 0 (hay reducción de emisiones)
- Certificados no se duplican

### Validación Early

Validar antes de escribir:
- Evita rollbacks costosos
- Mensajes de error claros
- Mejor UX

### Eventos On-Chain

Los eventos son:
- Inmutables en el ledger
- Indexables por explorers
- Ingestionables off-chain
- Para auditoría y notificaciones

---

## 🚀 Próximos Pasos Sugeridos

### Paso 6: Paginación
- [ ] Implementar paginación en listados
- [ ] Limitar tamaño de respuestas
- [ ] Offset y limit para consultas

### Paso 7: Funciones de Verificación
- [ ] `verify_certificate_hash()` - Verificar hash del MRV
- [ ] `is_valid_certificate()` - Validar certificado completo
- [ ] `check_integrity()` - Verificar integridad de datos

### Paso 8: Integración NFT
- [ ] Integrar con `stellar-non-fungible`
- [ ] Convertir certificados a NFTs
- [ ] Funciones de transferencia

---

## 📝 Notas Técnicas

### Limitaciones Actuales

1. ⚠️ **Validación mínima** - Solo valida > 0, no rangos realistas
2. ⚠️ **Sin validación de Address** - No verifica que las direcciones sean válidas
3. ⚠️ **Sin validación de hash** - No verifica el formato del metadata_hash
4. ⚠️ **Sin límite superior** - No valida máximos razonables

### Optimizaciones Futuras

1. **Validación de Rangos** - Verificar rangos realistas
2. **Validación de Address** - Verificar formato de direcciones
3. **Validación de Hash** - Verificar formato SHA-256
4. **Límites** - Añadir límites superiores razonables

---

## 🔗 Referencias

- [Soroban Error Handling](https://developers.stellar.org/docs/build/smart-contracts)
- [Contract Events](https://developers.stellar.org/docs/build/smart-contracts)
- [Paso 1: Contrato Base](./PASO_1_CONTRATO_BASE.md)
- [Paso 2: Almacenamiento y Minting](./PASO_2_ALMACENAMIENTO_MINTING.md)
- [Paso 3: Funciones de Consulta](./PASO_3_FUNCIONES_CONSULTA.md)
- [Paso 4: Funciones de Indexación](./PASO_4_FUNCIONES_INDEXACION.md)

---

**Documento generado:** 29 de Octubre, 2025  
**Autor:** Auto (AI Assistant)  
**Versión del Contrato:** 0.0.5  
**Estado:** ✅ Completo - Listo para Paso 6

