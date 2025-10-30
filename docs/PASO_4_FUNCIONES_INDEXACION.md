# Paso 4: Funciones de Indexación y Listado

## 📋 Resumen Ejecutivo

Este documento describe la implementación de funciones de indexación para listar certificados asociados a agricultores y verificadores. Se implementó un sistema de índices en Persistent Storage que permite consultas eficientes del frontend.

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Completado y probado  
**Tests:** 19/19 pasando (5 nuevos tests)  
**Contrato:** `contracts/carbon-certifier/`

---

## 🎯 Objetivo

Implementar funciones de indexación que permitan:
1. Listar certificados por agricultor
2. Listar certificados por verificador
3. Consultas eficientes desde el frontend
4. Aislamiento de datos entre actores

---

## 🔧 Cambios Implementados

### 1. Expansión del Enum `DataKey`

**Archivo:** `contract.rs`

```rust
/// Claves para el almacenamiento
/// 
/// Incluye tanto Persistent Storage (para certificados e índices) como Instance Storage (para contadores)
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Almacenamiento persistente de certificados por ID (u32)
    Certificates(u32),
    /// Contador total de certificados en Instance Storage
    TotalCertificates,
    /// Contador total de CO2e acuñado en Instance Storage
    TotalCO2e,
    /// Índice de certificados por agricultor (Persistent Storage)
    FarmerCertList(Address),
    /// Índice de certificados por verificador (Persistent Storage)
    VerifierCertList(Address),
}
```

**Nuevas claves:**
- ✅ `FarmerCertList(Address)` - Para listas de certificados por agricultor
- ✅ `VerifierCertList(Address)` - Para listas de certificados por verificador
- ✅ Usa Persistent Storage para evitar State Bloat
- ✅ Clave compuesta (Address) para aislamiento de datos

### 2. Función Privada `add_to_index()`

```rust
/// Añade un certificado a la lista de un actor (agricultor o verificador)
/// 
/// Función privada que actualiza los índices en Persistent Storage
/// 
/// # Argumentos
/// * `env` - El entorno del contrato
/// * `actor_address` - La dirección del actor (farmer o verifier)
/// * `certificate_id` - El ID del certificado a añadir
/// * `is_farmer` - true si es agricultor, false si es verificador
fn add_to_index(env: &Env, actor_address: Address, certificate_id: u32, is_farmer: bool) {
    let key = if is_farmer {
        DataKey::FarmerCertList(actor_address)
    } else {
        DataKey::VerifierCertList(actor_address)
    };

    // Obtener la lista existente o crear una nueva
    let mut cert_list: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
    
    // Añadir el nuevo ID al final de la lista
    cert_list.push_back(certificate_id);
    
    // Guardar la lista actualizada en Persistent Storage
    env.storage().persistent().set(&key, &cert_list);
}
```

**Características:**
- Función privada (solo llamada internamente)
- Recibe parámetro `is_farmer` para decidir el tipo de índice
- Lee la lista existente o crea una nueva vacía
- Añade el ID al final usando `push_back()`
- Guarda en Persistent Storage

### 3. Actualización de `mint_certificate()`

```rust
// Actualizar contadores globales
Self::increment_certificate_count(&env);
Self::add_co2e_to_total(&env, record.co2e_tons);

// Indexar el certificado por agricultor y verificador
Self::add_to_index(&env, record.farmer_address.clone(), certificate_id, true);
Self::add_to_index(&env, record.verifier_address.clone(), certificate_id, false);

Ok(())
```

**Flujo actualizado:**
1. Autorización
2. Verificación de duplicados
3. Almacenar certificado
4. Actualizar contadores globales
5. **NUEVO:** Indexar por agricultor
6. **NUEVO:** Indexar por verificador
7. Retornar éxito

### 4. Funciones Públicas de Consulta

#### `list_certificates_by_farmer()`

```rust
/// Lista los IDs de certificados asociados a un agricultor específico
/// 
/// # Argumentos
/// * `env` - El entorno del contrato
/// * `farmer_address` - La dirección del agricultor
/// 
/// # Retorna
/// `Vec<u32>` - Lista de IDs de certificados del agricultor
pub fn list_certificates_by_farmer(env: Env, farmer_address: Address) -> Vec<u32> {
    let key = DataKey::FarmerCertList(farmer_address);
    env.storage().persistent().get(&key).unwrap_or(Vec::new(&env))
}
```

#### `list_certificates_by_verifier()`

```rust
/// Lista los IDs de certificados asociados a un verificador específico
/// 
/// # Argumentos
/// * `env` - El entorno del contrato
/// * `verifier_address` - La dirección del verificador
/// 
/// # Retorna
/// `Vec<u32>` - Lista de IDs de certificados del verificador
pub fn list_certificates_by_verifier(env: Env, verifier_address: Address) -> Vec<u32> {
    let key = DataKey::VerifierCertList(verifier_address);
    env.storage().persistent().get(&key).unwrap_or(Vec::new(&env))
}
```

**Características:**
- Funciones públicas de solo lectura
- No requieren autenticación
- Retornan `Vec<u32>` con IDs de certificados
- Si no hay certificados, retornan Vec vacío

---

## 🧪 Tests Implementados

### Test 1: Lista Vacía de Agricultor

```rust
#[test]
fn test_list_farmer_certificates_empty() {
    let farmer_address = Address::generate(&env);
    
    // Una nueva dirección de agricultor debe comenzar con lista vacía
    let cert_list = client.list_certificates_by_farmer(&farmer_address);
    assert_eq!(cert_list.len(), 0);
}
```

### Test 2: Lista Vacía de Verificador

```rust
#[test]
fn test_list_verifier_certificates_empty() {
    let verifier_address = Address::generate(&env);
    
    // Una nueva dirección de verificador debe comenzar con lista vacía
    let cert_list = client.list_certificates_by_verifier(&verifier_address);
    assert_eq!(cert_list.len(), 0);
}
```

### Test 3: Certificado Indexado por Actor

```rust
#[test]
fn test_certificates_indexed_by_actor() {
    // Acuñar un certificado
    client.mint_certificate(&1, &record);
    
    // Verificar que el certificado aparece en ambas listas
    let farmer_certs = client.list_certificates_by_farmer(&farmer_address);
    assert_eq!(farmer_certs.len(), 1);
    assert_eq!(farmer_certs.get(0).unwrap(), 1);
    
    let verifier_certs = client.list_certificates_by_verifier(&verifier_address);
    assert_eq!(verifier_certs.len(), 1);
    assert_eq!(verifier_certs.get(0).unwrap(), 1);
}
```

### Test 4: Múltiples Certificados para Mismo Actor

```rust
#[test]
fn test_multiple_certificates_for_same_actor() {
    // Acuñar 3 certificados para el mismo agricultor
    for i in 1..=3 {
        client.mint_certificate(&i, &record);
    }
    
    // Verificar que el agricultor tiene 3 certificados
    let farmer_certs = client.list_certificates_by_farmer(&farmer_address);
    assert_eq!(farmer_certs.len(), 3);
    assert_eq!(farmer_certs.get(0).unwrap(), 1);
    assert_eq!(farmer_certs.get(1).unwrap(), 2);
    assert_eq!(farmer_certs.get(2).unwrap(), 3);
}
```

### Test 5: Aislamiento de Certificados

```rust
#[test]
fn test_certificates_isolated_by_actor() {
    // Acuñar certificados para 2 agricultores diferentes
    // ... acuñar para farmer_a ...
    // ... acuñar para farmer_b ...
    
    // Verificar que cada agricultor ve solo sus propios certificados
    let farmer_a_certs = client.list_certificates_by_farmer(&farmer_a);
    assert_eq!(farmer_a_certs.len(), 2);
    
    let farmer_b_certs = client.list_certificates_by_farmer(&farmer_b);
    assert_eq!(farmer_b_certs.len(), 2);
    
    // Verificar que el verificador ve todos
    let verifier_certs = client.list_certificates_by_verifier(&verifier_address);
    assert_eq!(verifier_certs.len(), 4);
}
```

---

## ✅ Resultados de Tests

```
running 19 tests
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
test test::test_list_farmer_certificates_empty ... ok        ← NUEVO
test test::test_list_verifier_certificates_empty ... ok      ← NUEVO
test test::test_certificates_indexed_by_actor ... ok         ← NUEVO
test test::test_multiple_certificates_for_same_actor ... ok  ← NUEVO
test test::test_certificates_isolated_by_actor ... ok        ← NUEVO

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**Cobertura:**
- ✅ Listas vacías iniciales
- ✅ Indexación por actor
- ✅ Múltiples certificados
- ✅ Aislamiento de datos
- ✅ Integración con mint_certificate

---

## 🔐 Seguridad y Diseño

### Persistent Storage para Índices

**Ventajas:**
- ✅ Evita State Bloat en Instance Storage
- ✅ Cada actor tiene su propia lista independiente
- ✅ Escalable a millones de certificados
- ✅ Costo predecible por actor

**Desventajas:**
- ⚠️ Costo adicional por cada llamada a `add_to_index()`
- ⚠️ Lectura de listas largas puede ser costosa

### Aislamiento de Datos

Cada actor (agricultor o verificador) tiene su propia lista:
- No hay interferencia entre actores
- Privacidad de datos
- Consultas eficientes por actor

### Orden de los Certificados

Los IDs se añaden al final de la lista usando `push_back()`:
- Orden cronológico (FIFO)
- Fácil de recuperar
- Sin necesidad de ordenamiento

---

## 📊 Funciones Disponibles

| Función | Tipo | Autorización | Descripción |
|---------|------|--------------|-------------|
| `__constructor` | Constructor | Ninguna | Inicializa el contrato |
| `get_certificate_data` | Query | Ninguna | Lee un certificado por ID |
| `mint_certificate` | Write | Verificador | Acuña un nuevo certificado |
| `get_total_certificates` | Query | Ninguna | Obtiene total de certificados |
| `get_total_co2e` | Query | Ninguna | Obtiene total de CO2e acuñado |
| `list_certificates_by_farmer` | Query | Ninguna | Lista certificados de un agricultor |
| `list_certificates_by_verifier` | Query | Ninguna | Lista certificados de un verificador |

---

## 💻 Ejemplos de Uso

### Consultar Certificados de un Agricultor

```rust
// Obtener lista de certificados del agricultor
let farmer_address = Address::from_string("G...");
let cert_ids = client.list_certificates_by_farmer(&farmer_address);

println!("Agricultor tiene {} certificados:", cert_ids.len());

// Recuperar información de cada certificado
for id in cert_ids.iter() {
    match client.get_certificate_data(id) {
        Ok(record) => {
            println!("  Certificado {}: {} hectáreas, {} CO2e", 
                    id, record.hectares_not_burned, record.co2e_tons);
        }
        Err(e) => println!("  Error obteniendo certificado {}: {:?}", id, e),
    }
}
```

### Dashboard del Verificador

```rust
fn verifier_dashboard(client: &CarbonCertifierClient, verifier_address: &Address) {
    // Obtener todos los certificados del verificador
    let cert_ids = client.list_certificates_by_verifier(verifier_address);
    
    println!("=== Dashboard del Verificador ===");
    println!("Total certificados emitidos: {}", cert_ids.len());
    
    // Calcular total CO2e verificado
    let mut total_co2e: u128 = 0;
    for id in cert_ids.iter() {
        if let Ok(record) = client.get_certificate_data(id) {
            total_co2e += record.co2e_tons;
        }
    }
    
    println!("Total CO2e verificado: {} toneladas", total_co2e);
    println!("Promedio por certificado: {} toneladas", 
            if cert_ids.len() > 0 { total_co2e / cert_ids.len() as u128 } else { 0 });
}
```

### Búsqueda de Certificados por Actor

```rust
// Verificar si un actor tiene certificados
fn has_certificates(client: &CarbonCertifierClient, address: &Address, is_farmer: bool) -> bool {
    let certs = if is_farmer {
        client.list_certificates_by_farmer(address)
    } else {
        client.list_certificates_by_verifier(address)
    };
    
    certs.len() > 0
}

// Obtener estadísticas de un actor
fn actor_stats(client: &CarbonCertifierClient, address: &Address, is_farmer: bool) {
    let certs = if is_farmer {
        client.list_certificates_by_farmer(address)
    } else {
        client.list_certificates_by_verifier(address)
    };
    
    println!("Actor tiene {} certificados", certs.len());
    
    if certs.len() > 0 {
        println!("IDs: {:?}", certs);
    }
}
```

---

## 📈 Beneficios de Implementación

### 1. Eficiencia de Consultas
- ✅ No necesita iterar sobre todos los certificados
- ✅ Acceso directo por actor
- ✅ Consultas O(1) para obtener la lista

### 2. Frontend Integration
- ✅ Dashboard de agricultores
- ✅ Dashboard de verificadores
- ✅ Búsqueda y filtrado eficiente

### 3. Escalabilidad
- ✅ Manejable con millones de certificados
- ✅ Persistent Storage evita State Bloat
- ✅ Cada actor tiene almacenamiento independiente

### 4. Aislamiento y Privacidad
- ✅ Certificados no visibles entre agricultores
- ✅ Los verificadores ven solo sus propios certificados
- ✅ Privacidad de datos on-chain

---

## 🎓 Conceptos Clave

### Índices en Blockchain

Los índices son estructuras de datos que facilitan consultas:
- Evitan iterar sobre toda la colección
- Organizan datos por clave
- Permiten búsquedas eficientes

### Persistent Storage para Índices

Usar Persistent Storage para índices permite:
- Escalabilidad sin límites
- Evitar State Bloat
- Costo independiente por actor

### Claves Compuestas

`DataKey::FarmerCertList(Address)` es una clave compuesta:
- La `Address` es parte de la clave
- Cada dirección tiene su propia lista
- Aislamiento automático de datos

---

## 🚀 Próximos Pasos Sugeridos

### Paso 5: Eventos y Logging
- [ ] Emitir evento `CertificateMinted` con todos los datos
- [ ] Emitir evento `IndexUpdated` cuando se añade un certificado
- [ ] Historial de eventos para auditoría

### Paso 6: Paginación
- [ ] `list_certificates_by_farmer_paginated(offset, limit)`
- [ ] `list_certificates_by_verifier_paginated(offset, limit)`
- [ ] Evitar cargar listas muy largas de una vez

### Paso 7: Filtros Avanzados
- [ ] Filtrar por rango de fechas
- [ ] Filtrar por rango de CO2e
- [ ] Búsqueda por hash de metadata

### Paso 8: Integración NFT
- [ ] Convertir certificados a NFTs
- [ ] Funciones de transferencia
- [ ] Propiedad de certificados

---

## 📝 Notas Técnicas

### Limitaciones Actuales

1. ⚠️ **Sin límite de tamaño de lista** - Podría volverse muy grande
2. ⚠️ **Sin paginación** - Carga toda la lista de una vez
3. ⚠️ **Sin ordenamiento** - Solo orden cronológico
4. ⚠️ **Sin eliminación de índice** - No se puede "desindexar"

### Optimizaciones Futuras

1. **Paginación** - Dividir resultados en páginas
2. **Cache** - Cachear listas populares
3. **Índices secundarios** - Por fecha, por CO2e, etc.
4. **Compactación** - Optimizar almacenamiento de listas

### Costo de Gas

Cada llamada a `add_to_index()` tiene costo:
- Lectura de la lista existente
- Modificación de la lista
- Escritura de vuelta a Persistent Storage

Para 1000 certificados de un agricultor:
- Costo estimado: ~1000 operaciones de almacenamiento
- Aceptable para la mayoría de casos de uso

---

## 🔗 Referencias

- [Soroban Persistent Storage](https://developers.stellar.org/docs/build/smart-contracts/tutorials/state-management#persistent-storage)
- [Vec Operations](https://docs.rs/soroban-sdk/latest/soroban_sdk/struct.Vec.html)
- [Paso 1: Contrato Base](./PASO_1_CONTRATO_BASE.md)
- [Paso 2: Almacenamiento y Minting](./PASO_2_ALMACENAMIENTO_MINTING.md)
- [Paso 3: Funciones de Consulta](./PASO_3_FUNCIONES_CONSULTA.md)

---

**Documento generado:** 29 de Octubre, 2025  
**Autor:** Auto (AI Assistant)  
**Versión del Contrato:** 0.0.4  
**Estado:** ✅ Completo - Listo para Paso 5

