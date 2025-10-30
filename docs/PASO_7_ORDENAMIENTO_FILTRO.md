# Paso 7: Ordenamiento y Filtrado en Listados Paginados

## 📋 Resumen Ejecutivo
Se añadieron capacidades de ordenamiento y filtrado a las funciones de listado del contrato `CarbonCertifier`, manteniendo la paginación del Paso 6. Esto permite al frontend construir vistas ricas (orden por campos clave y filtros por rango de CO2e) sin cargar toda la colección.

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Completado y probado  
**Tests Totales:** 26/26 pasando  
**Contrato:** `contracts/carbon-certifier/`

---

## 🎯 Objetivo
- Añadir un criterio de ordenamiento configurable para listados por agricultor.
- Permitir filtrar certificados por rango de `co2e_tons` (inclusive) con paginación.
- Mantener compatibilidad con `no_std` y el patrón de almacenamiento del proyecto (listas en Persistent Storage, contadores en Instance Storage).

---

## 🔧 Cambios Implementados (Código)

### 1) Enum de ordenamiento `SortBy`
Archivo: `contracts/carbon-certifier/src/contract.rs`
```rust
/// Criterios de ordenamiento para listado de certificados
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SortBy {
    /// Ordenar por toneladas de CO2e
    Co2eTons,
    /// Ordenar por hectáreas no quemadas
    Hectares,
    /// Ordenar por ID de certificado
    CertificateId,
}
```

### 2) Firma nueva de `list_certificates_by_farmer`
Archivo: `contracts/carbon-certifier/src/contract.rs`
```rust
/// Lista los IDs de certificados asociados a un agricultor específico (con paginación y ordenamiento)
///
/// # Argumentos
/// * `env` - El entorno del contrato
/// * `farmer_address` - La dirección del agricultor
/// * `offset` - El punto de inicio de la paginación (0-indexed)
/// * `limit` - El número máximo de IDs a devolver
/// * `sort_by` - Criterio de ordenamiento (Co2eTons, Hectares, CertificateId)
/// * `is_descending` - Si true, orden descendente; si false, orden ascendente
///
/// # Retorna
/// `(Vec<u32>, u32)` - Tupla que contiene (lista paginada de IDs, total de certificados)
pub fn list_certificates_by_farmer(
    env: Env,
    farmer_address: Address,
    offset: u32,
    limit: u32,
    sort_by: SortBy,
    is_descending: bool,
) -> (Vec<u32>, u32) {
    let key = DataKey::FarmerCertList(farmer_address);
    let all_certs = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));

    // Obtener y ordenar los registros completos
    let sorted_ids = Self::sort_certificates(&env, &all_certs, sort_by, is_descending);

    Self::paginate_cert_list(&env, &sorted_ids, offset, limit)
}
```

### 3) Ordenamiento compatible con `no_std`
- Implementado con un bubble sort explícito sobre un `Vec<(u32, u128)>` donde `u128` es el valor de ordenamiento según `SortBy`.
- Se evita `std::sort` y asignaciones complejas para mantener compatibilidad con `no_std`.

Fragmento clave:
```rust
/// Función privada para ordenar certificados por diferentes criterios
fn sort_certificates(env: &Env, cert_ids: &Vec<u32>, sort_by: SortBy, is_descending: bool) -> Vec<u32> {
    if cert_ids.len() <= 1 {
        let mut result = Vec::new(env);
        for id in cert_ids.iter() {
            result.push_back(id);
        }
        return result;
    }

    // Crear pares (ID, valor_de_ordenamiento)
    let mut pairs: Vec<(u32, u128)> = Vec::new(env);

    for id in cert_ids.iter() {
        let cert_key = DataKey::Certificates(id);
        if let Some(record) = env.storage().persistent().get::<DataKey, VerificationRecord>(&cert_key) {
            let sort_value = match sort_by {
                SortBy::Co2eTons => record.co2e_tons,
                SortBy::Hectares => record.hectares_not_burned as u128,
                SortBy::CertificateId => id as u128,
            };
            pairs.push_back((id, sort_value));
        }
    }

    // Bubble sort (no_std)
    let len = pairs.len();
    for i in 0..len {
        for j in 0..(len - i - 1) {
            let should_swap = if is_descending {
                pairs.get(j).unwrap().1 < pairs.get(j + 1).unwrap().1
            } else {
                pairs.get(j).unwrap().1 > pairs.get(j + 1).unwrap().1
            };
            if should_swap {
                let temp = pairs.get(j).unwrap().clone();
                pairs.set(j, pairs.get(j + 1).unwrap().clone());
                pairs.set(j + 1, temp);
            }
        }
    }

    // Extraer IDs ordenados
    let mut sorted_ids = Vec::new(env);
    for pair in pairs.iter() {
        sorted_ids.push_back(pair.0);
    }

    sorted_ids
}
```

### 4) Filtrado por rango de CO2e (con paginación)
Nueva función pública:
```rust
/// Filtra certificados de un agricultor por rango de CO2e (con paginación)
/// Retorna `(Vec<u32>, u32)` con (IDs filtrados y paginados, total filtrado)
pub fn filter_by_co2e_range(
    env: Env,
    farmer_address: Address,
    min_tons: u128,
    max_tons: u128,
    offset: u32,
    limit: u32,
) -> (Vec<u32>, u32) {
    let key = DataKey::FarmerCertList(farmer_address);
    let all_certs = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));

    // Filtrar por rango inclusivo
    let filtered_ids = Self::filter_by_co2e(&env, &all_certs, min_tons, max_tons);

    Self::paginate_cert_list(&env, &filtered_ids, offset, limit)
}
```

Ayudante de filtrado:
```rust
fn filter_by_co2e(env: &Env, cert_ids: &Vec<u32>, min_tons: u128, max_tons: u128) -> Vec<u32> {
    let mut filtered = Vec::new(env);
    for id in cert_ids.iter() {
        let cert_key = DataKey::Certificates(id);
        if let Some(record) = env.storage().persistent().get::<DataKey, VerificationRecord>(&cert_key) {
            if record.co2e_tons >= min_tons && record.co2e_tons <= max_tons {
                filtered.push_back(id);
            }
        }
    }
    filtered
}
```

### 5) Paginación reusada (Paso 6)
Se reusa el helper de paginación:
```rust
fn paginate_cert_list(env: &Env, all_certs: &Vec<u32>, offset: u32, limit: u32) -> (Vec<u32>, u32)
```
- Maneja edge cases (offset > total, offset+limit > total, limit > total).
- Retorna una tupla con los elementos y el total.

---

## 🧪 Pruebas y Validaciones
Todos los tests del paquete (26/26) pasan tras los cambios. A continuación patrones de uso verificados:

### Ordenamiento por ID ascendente (básico)
```rust
let (page, total) = client.list_certificates_by_farmer(
    &farmer_address, &0, &10, &SortBy::CertificateId, &false
);
assert_eq!(total, /* total esperado */);
```

### Ordenamiento por CO2e descendente
```rust
let (page, total) = client.list_certificates_by_farmer(
    &farmer_address, &0, &5, &SortBy::Co2eTons, &true
);
// `page` debe contener los IDs con mayores `co2e_tons` primero
```

### Filtrado por rango + paginación
```rust
let (filtered, total_filtered) = client.filter_by_co2e_range(
    &farmer_address, &100u128, &300u128, &0, &10
);
// `filtered` contiene solo los IDs con `co2e_tons` ∈ [100, 300]
```

---

## 📘 Integración Frontend (Patrones)
### Paginación + Ordenamiento
```typescript
const [ids, total] = await contract.list_certificates_by_farmer(
  farmerAddress,
  offset,
  limit,
  SortBy.Co2eTons, // o Hectares / CertificateId
  true              // descendente
);
```

### Filtrado por Rango + Paginación
```typescript
const [ids, total] = await contract.filter_by_co2e_range(
  farmerAddress,
  minTons,
  maxTons,
  offset,
  limit
);
```

---

## ✅ Beneficios
- Respuestas pequeñas y rápidas (paginación).
- Orden configurable por campos críticos (CO2e, hectáreas, ID).
- Filtrado server-side por rango de CO2e.
- Compatibilidad `no_std` preservada.
- Mantiene el diseño de almacenamiento del proyecto: índices en Persistent Storage; contadores globales en Instance Storage.

---

## ⚠️ Consideraciones y Futuras Mejores
- Ordenamiento actual O(n²) (bubble-sort) apto para lotes modestos por actor (compatibilidad `no_std`). Para volúmenes muy grandes se recomienda:
  - Ordenamiento off-chain del resultado paginado
  - Índices secundarios por `co2e_tons`/`hectares`
  - Caches por actor
- Extender ordenamiento por `timestamp` de acuñación (requeriría indexar la fecha junto con los IDs).
- Filtros adicionales: por rango de hectáreas, por verificador, por período de tiempo.

---

## 🔗 Referencias
- Paso 6: Paginación (`docs/PASO_6_PAGINACION.md`)
- Paso 5: Validación y Eventos (`docs/PASO_5_VALIDACION_EVENTOS.md`)
- Soroban State Management: Persistent vs Instance Storage

---

**Versión del Contrato:** 0.0.7  
**Estado:** ✅ Completo - Listo para integrar en el frontend
