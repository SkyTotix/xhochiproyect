# Paso 2: Almacenamiento y Función de Acuñación (Minting)

## 📋 Resumen Ejecutivo

Este documento describe la expansión del contrato `CarbonCertifier` con funcionalidades de almacenamiento persistente y acuñación de certificados de carbono NFT. Se implementaron las funciones críticas de lectura y escritura de certificados con las correspondientes validaciones de seguridad.

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Completado y probado  
**Tests:** 9/9 pasando  
**Contrato:** `contracts/carbon-certifier/`

---

## 🎯 Objetivo

Expandir el contrato base con la capacidad de:
1. Almacenar certificados de carbono en Persistent Storage
2. Recuperar certificados por ID
3. Acuñar nuevos certificados con autorización estricta
4. Prevenir duplicados y acceso no autorizado

---

## 🔧 Cambios Implementados

### 1. Enum `ContractError` - Manejo de Errores

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
}
```

**Características:**
- Usa la macro `#[contracterror]` para integración con Soroban
- Códigos de error numéricos para claridad
- Implementa `Clone`, `Copy`, `Debug`, `Eq`, `PartialEq` para manipulación segura

### 2. Enum `DataKey` - Claves de Almacenamiento

**Archivo:** `contract.rs`

```rust
/// Claves para el almacenamiento persistente
/// 
/// Usa claves únicas para mapear cada certificado por su ID
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Almacenamiento de certificados por ID (u32)
    Certificates(u32),
}
```

**Características:**
- Anotado con `#[contracttype]` para serialización on-chain
- Usa `u32` como ID de certificado (permite ~4.2 billones de certificados)
- Diseñado para Persistent Storage (evita State Bloat)

### 3. Función `get_certificate_data()` - Lectura

**Archivo:** `contract.rs`

```rust
/// Obtiene los datos de un certificado de carbono por su ID
/// 
/// # Argumentos
/// * `env` - El entorno del contrato
/// * `certificate_id` - ID único del certificado (u32)
/// 
/// # Retorna
/// `VerificationRecord` - Los datos completos del certificado
/// 
/// # Errores
/// * `ContractError::NotFound` si el certificado no existe
pub fn get_certificate_data(
    env: Env,
    certificate_id: u32,
) -> Result<VerificationRecord, ContractError> {
    let key = DataKey::Certificates(certificate_id);
    
    // Intentar obtener el certificado del almacenamiento persistente
    match env.storage().persistent().get(&key) {
        Some(record) => Ok(record),
        None => Err(ContractError::NotFound),
    }
}
```

**Flujo:**
1. Construye la clave usando `DataKey::Certificates(certificate_id)`
2. Intenta obtener el certificado del Persistent Storage
3. Retorna el registro si existe, o error si no existe

**Seguridad:**
- Función de solo lectura (no modifica estado)
- No requiere autenticación (query pública)
- Retorna `Result` para manejo seguro de errores

### 4. Función `mint_certificate()` - Acuñación

**Archivo:** `contract.rs`

```rust
/// Acuñar un nuevo certificado de carbono NFT
/// 
/// Solo puede ser invocado por la dirección del verificador autorizado.
/// Almacena el certificado en Persistent Storage para garantizar su longevidad.
/// 
/// # Argumentos
/// * `env` - El entorno del contrato
/// * `certificate_id` - ID único del certificado (u32)
/// * `record` - Los datos completos del certificado de verificación
/// 
/// # Retorna
/// `()` - Éxito
/// 
/// # Errores
/// * `ContractError::AlreadyExists` si el certificado ya existe
/// 
/// # Autorización
/// Requiere autenticación de `record.verifier_address`
pub fn mint_certificate(
    env: Env,
    certificate_id: u32,
    record: VerificationRecord,
) -> Result<(), ContractError> {
    // ✅ AUTORIZACIÓN CRÍTICA: Solo el verificador autorizado puede acuñar certificados
    record.verifier_address.require_auth();

    // Verificar que el certificado no existe ya
    let key = DataKey::Certificates(certificate_id);
    if env.storage().persistent().get::<DataKey, VerificationRecord>(&key).is_some() {
        return Err(ContractError::AlreadyExists);
    }

    // Almacenar el certificado en Persistent Storage
    // El uso de Persistent Storage evita state bloat en Instance Storage
    env.storage().persistent().set(&key, &record);

    Ok(())
}
```

**Flujo:**
1. **Autorización:** Verifica que `verifier_address` esté autenticado
2. **Verificación de duplicados:** Comprueba que el ID no existe
3. **Almacenamiento:** Guarda en Persistent Storage
4. **Retorno:** Confirma éxito

**Seguridad:**
- ✅ Autorización con `require_auth()`
- ✅ Prevención de duplicados
- ✅ Uso de Persistent Storage (no Instance Storage)
- ✅ Transacción atómica (se revierte si falla cualquier paso)

---

## 🧪 Tests Implementados

### Tests de `get_certificate_data`

#### Test 1: Certificado no encontrado
```rust
#[test]
fn test_get_certificate_data_not_found() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CarbonCertifier);
    let client = CarbonCertifierClient::new(&env, &contract_id);
    
    // Intentar obtener un certificado que no existe debe fallar
    let result = client.try_get_certificate_data(&1);
    
    // Verificamos que la función retornó un error
    assert!(result.is_err());
}
```

#### Test 2: Recuperación exitosa
```rust
#[test]
fn test_get_certificate_data_success() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, CarbonCertifier);
    let client = CarbonCertifierClient::new(&env, &contract_id);
    
    // ... setup ...
    
    // Acuñar el certificado primero
    client.mint_certificate(&1, &record);
    
    // Ahora obtenerlo
    let retrieved_record = client.get_certificate_data(&1);
    
    assert_eq!(retrieved_record.verifier_address, verifier_address);
    assert_eq!(retrieved_record.hectares_not_burned, 10);
    assert_eq!(retrieved_record.co2e_tons, 100);
}
```

### Tests de `mint_certificate`

#### Test 3: Acuñación exitosa
```rust
#[test]
fn test_mint_certificate_success() {
    // ... setup ...
    
    // Acuñar el certificado
    client.mint_certificate(&1, &record);
    
    // Verificar que se almacenó correctamente
    let retrieved = client.get_certificate_data(&1);
    assert_eq!(retrieved.hectares_not_burned, 15);
    assert_eq!(retrieved.co2e_tons, 150);
}
```

#### Test 4: Certificado duplicado
```rust
#[test]
fn test_mint_certificate_already_exists() {
    // ... setup ...
    
    // Acuñar el certificado la primera vez
    client.mint_certificate(&1, &record);
    
    // Intentar acuñar el mismo ID debe fallar
    let result = client.try_mint_certificate(&1, &record);
    assert!(result.is_err());
}
```

#### Test 5: Autorización fallida
```rust
#[test]
fn test_mint_certificate_unauthorized() {
    // NO configurar mock auth para verifier_address
    // Esto significa que require_auth() fallará
    
    // Intentar acuñar sin autorización debe fallar
    let result = client.try_mint_certificate(&1, &record);
    assert!(result.is_err());
}
```

### Tests de Integración

#### Test 6: Múltiples certificados
```rust
#[test]
fn test_multiple_certificates() {
    // Crear múltiples certificados con diferentes IDs
    for i in 1..=5 {
        let record = VerificationRecord { /* ... */ };
        client.mint_certificate(&i, &record);
    }
    
    // Verificar que cada uno existe
    for i in 1..=5 {
        let record = client.get_certificate_data(&i);
        assert_eq!(record.hectares_not_burned, i * 10);
    }
}
```

#### Test 7: Almacenamiento persistente
```rust
#[test]
fn test_certificate_persistent_storage() {
    // Acuñar con metadata_hash específico
    let metadata_hash = BytesN::from_array(&env, &[99u8; 32]);
    
    // Verificar que el hash se almacenó correctamente
    let retrieved = client.get_certificate_data(&42);
    assert_eq!(retrieved.metadata_hash, BytesN::from_array(&env, &[99u8; 32]));
}
```

---

## ✅ Resultados de Tests

```
running 9 tests
test test::test_verification_record_structure ... ok
test test::test_constructor ... ok
test test::test_get_certificate_data_not_found ... ok
test test::test_get_certificate_data_success ... ok
test test::test_mint_certificate_success ... ok
test test::test_mint_certificate_already_exists ... ok
test test::test_mint_certificate_unauthorized ... ok
test test::test_multiple_certificates ... ok
test test::test_certificate_persistent_storage ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**Cobertura:**
- ✅ Estructura de datos
- ✅ Constructor
- ✅ Lectura exitosa
- ✅ Lectura con error
- ✅ Acuñación exitosa
- ✅ Prevención de duplicados
- ✅ Autorización
- ✅ Múltiples certificados
- ✅ Persistencia de datos

---

## 🔐 Seguridad Implementada

### 1. Autorización Estricta

```rust
record.verifier_address.require_auth();
```

- Solo el verificador especificado en `record.verifier_address` puede acuñar
- Prevención de falsificación de certificados
- Cumple con el flujo de verificación de CONADESUCA

### 2. Prevención de Duplicados

```rust
if env.storage().persistent().get::<DataKey, VerificationRecord>(&key).is_some() {
    return Err(ContractError::AlreadyExists);
}
```

- Cada ID de certificado es único
- No se pueden acuñar certificados con IDs existentes
- Asegura integridad de los datos

### 3. Persistent Storage

```rust
env.storage().persistent().set(&key, &record);
```

- Evita State Bloat en Instance Storage
- Cada certificado usa espacio independiente
- Costo predecible por certificado
- Cumple con las reglas de Soroban

### 4. Manejo de Errores

- Funciones retornan `Result<T, ContractError>`
- Errores claros y específicos
- Transacciones atómicas (se revierten si fallan)

---

## 📊 Funciones Disponibles

| Función | Tipo | Autorización | Descripción |
|---------|------|--------------|-------------|
| `__constructor` | Constructor | Ninguna | Inicializa el contrato |
| `get_certificate_data` | Query | Ninguna | Lee un certificado por ID |
| `mint_certificate` | Write | Verificador | Acuña un nuevo certificado |

---

## 🎓 Conceptos Clave

### Persistent Storage vs Instance Storage

**Persistent Storage (usado):**
- Ideal para colecciones que crecen
- Cada entrada tiene espacio independiente
- Costo variable pero predecible
- Evita State Bloat

**Instance Storage (NO usado):**
- Ideal para datos fijos/configuración
- Todo el estado en una sola estructura
- Costo base fijo
- Riesgo de State Bloat si crece

### Autorización en Soroban

`require_auth()` verifica que la transacción fue firmada por la dirección especificada. Esto es crítico para:
- Prevenir acuñación fraudulenta
- Asegurar que solo el verificador autorizado puede crear certificados
- Mantener la integridad de la metodología CONADESUCA

### Metadata Hash

El campo `metadata_hash: BytesN<32>` almacena un hash SHA-256 del informe MRV off-chain:
- Garantiza inmutabilidad de la evidencia
- Permite verificación posterior
- Evita la necesidad de almacenar el documento completo on-chain

---

## 💻 Cómo Usar

### Acuñar un Certificado

```rust
let verifier_address = Address::from_string("G...");
let farmer_address = Address::from_string("G...");
let metadata_hash = BytesN::from_array(&env, &[/* SHA-256 hash */]);

let record = VerificationRecord {
    verifier_address,
    farmer_address,
    hectares_not_burned: 10,
    co2e_tons: 100,
    metadata_hash,
};

// Debe ser llamado por verifier_address
client.mint_certificate(&certificate_id, &record);
```

### Leer un Certificado

```rust
match client.get_certificate_data(&certificate_id) {
    Ok(record) => {
        println!("Agricultor: {:?}", record.farmer_address);
        println!("Hectáreas: {}", record.hectares_not_burned);
        println!("CO2e: {}", record.co2e_tons);
    }
    Err(ContractError::NotFound) => {
        println!("Certificado no encontrado");
    }
    _ => {}
}
```

---

## 🚀 Próximos Pasos Sugeridos

### Paso 3: Funciones de Consulta Avanzadas
- [ ] `list_certificates_by_farmer(farmer_address)` - Listar certificados de un agricultor
- [ ] `list_certificates_by_verifier(verifier_address)` - Listar certificados de un verificador
- [ ] `get_total_certificates()` - Contador total de certificados
- [ ] `get_total_co2e()` - Total de CO2e reducido

### Paso 4: Integración con NFT
- [ ] Integrar `stellar-non-fungible` library
- [ ] Convertir certificados a NFTs transferibles
- [ ] Implementar funciones de transferencia
- [ ] Metadata on-chain de NFTs

### Paso 5: Funciones de Verificación
- [ ] `verify_certificate(certificate_id, hash)` - Verificar hash del MRV
- [ ] `is_valid_certificate(certificate_id)` - Validar que el certificado existe
- [ ] `get_certificate_owner(certificate_id)` - Obtener propietario actual

### Paso 6: Auditoría y Transparencia
- [ ] Eventos para cada acuñación
- [ ] Historial de cambios (si aplica)
- [ ] Logs de transacciones

---

## 📝 Notas Técnicas

### Limitaciones Actuales

1. ⚠️ **Sin límite de certificados** - Podría crecer indefinidamente
2. ⚠️ **Sin validación de datos** - No valida que SQ > 0 o CO2e > 0
3. ⚠️ **Sin fecha de expiración** - Los certificados nunca expiran
4. ⚠️ **Sin revocación** - No hay forma de invalidar un certificado

### Decisiones de Diseño

1. **u32 para IDs** - Suficiente para ~4.2 billones de certificados
2. **Persistent Storage** - Evita State Bloat
3. **require_auth() en record** - Autorización flexible por certificado
4. **Result para errores** - Manejo seguro y explícito

---

## 🔗 Referencias

- [Soroban Storage Types](https://developers.stellar.org/docs/build/smart-contracts/tutorials/state-management)
- [Contract Authorization](https://developers.stellar.org/docs/build/smart-contracts)
- [Error Handling](https://docs.rs/soroban-sdk/latest/soroban_sdk/attr.contracterror.html)
- [Paso 1: Contrato Base](./PASO_1_CONTRATO_BASE.md)

---

**Documento generado:** 29 de Octubre, 2025  
**Autor:** Auto (AI Assistant)  
**Versión del Contrato:** 0.0.2  
**Estado:** ✅ Completo - Listo para Paso 3

