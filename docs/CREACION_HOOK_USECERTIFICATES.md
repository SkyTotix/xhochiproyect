# 📝 Creación del Hook useCertificates

## 🎯 Objetivo

Crear un hook personalizado React/TypeScript que utilice TanStack Query para obtener listas paginadas y filtradas de certificados NFT del contrato CarbonCertifier.

---

## ✅ Tareas Completadas

### Archivo Creado

**Archivo:** `src/hooks/useCertificates.ts` (147 líneas)

---

## 📊 Características del Hook

### 1. **Tipificación Estricta**

#### Interfaces Definidas

```typescript
export interface UseCertificatesParams {
  offset: number;
  limit: number;
  minCo2e?: number;
  maxCo2e?: number;
  sortBy?: SortBy;
  isDescending?: boolean;
}

export interface CertificatesResult {
  certificateIds: Array<u32>;
  total: u32;
}
```

**Uso de Tipos Soroban:**
- ✅ `u32` para IDs y paginación
- ✅ `u128` para valores de CO2e
- ✅ `SortBy` del contrato para criterios de ordenamiento
- ✅ `Array<u32>` para listas de IDs

---

### 2. **Lógica de Consulta Inteligente**

El hook implementa dos estrategias según los parámetros:

#### Estrategia A: Lista por Agricultor (Sin Filtro)

```typescript
if (!hasCo2eFilter) {
  result = await carbonCertifier.list_certificates_by_farmer({
    farmer_address: publicKey,
    offset: BigInt(offset) as u32,
    limit: BigInt(limit) as u32,
    sort_by: defaultSortBy,
    is_descending: defaultIsDescending,
  });
}
```

**Características:**
- ✅ Paginación con `offset` y `limit`
- ✅ Ordenamiento configurable
- ✅ Consulta eficiente O(limit)

#### Estrategia B: Filtro por Rango CO2e

```typescript
if (hasCo2eFilter) {
  result = await carbonCertifier.filter_by_co2e_range({
    farmer_address: publicKey,
    min_tons: BigInt(minCo2e) as u128,
    max_tons: BigInt(maxCo2e) as u128,
    offset: BigInt(offset) as u32,
    limit: BigInt(limit) as u32,
  });
}
```

**Características:**
- ✅ Filtrado por rango de CO2e
- ✅ Paginación integrada
- ✅ Eficiencia O(limit) mantenida

---

### 3. **Integración con TanStack Query**

#### Configuración de la Query

```typescript
return useQuery<CertificatesResult>({
  queryKey: [
    "certificates",
    "farmer",
    publicKey,
    offset,
    limit,
    minCo2e,
    maxCo2e,
    sortBy?.tag,
    isDescending,
  ],
  queryFn: async () => { /* ... */ },
  enabled: publicKey !== undefined && publicKey !== null && publicKey !== "",
  staleTime: 5 * 60 * 1000,      // 5 minutos
  refetchInterval: 10 * 60 * 1000, // 10 minutos
});
```

**Características:**
- ✅ **Cache Automático:** Resultados cacheados por 5 minutos
- ✅ **Auto-refetch:** Revalidación en background cada 10 minutos
- ✅ **Query Key Única:** Incluye todos los parámetros
- ✅ **Enabled Conditional:** Solo consulta si hay usuario conectado

---

### 4. **Integración con useWallet**

```typescript
const { address: publicKey } = useWallet();
```

- ✅ Usa `useWallet()` para obtener dirección
- ✅ Solo consulta si hay usuario conectado
- ✅ Maneja `undefined`, `null` y `""`

---

### 5. **Manejo de Errores**

#### Validación de Usuario

```typescript
if (!publicKey) {
  throw new Error("No hay usuario conectado");
}
```

#### Manejo de Respuestas

```typescript
if (result.result.isErr()) {
  throw new Error(
    `Error al obtener lista de certificados: ${result.result.unwrapErr()}`,
  );
}
```

#### Try-Catch Genérico

```typescript
try {
  // ... lógica de consulta
} catch (error) {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("Error desconocido al consultar certificados");
}
```

---

## 🚀 Uso del Hook

### Ejemplo Básico

```typescript
import { useCertificates } from "../hooks/useCertificates";

const MyComponent = () => {
  const { data, isLoading, error } = useCertificates({
    offset: 0,
    limit: 10,
  });

  if (isLoading) return <Loader />;
  if (error) return <Alert>{error.message}</Alert>;
  if (data) {
    console.log(`${data.certificateIds.length} certificados`);
    console.log(`Total disponible: ${data.total}`);
  }
};
```

### Ejemplo con Filtros

```typescript
const { data } = useCertificates({
  offset: 0,
  limit: 20,
  minCo2e: 100,
  maxCo2e: 1000,
});
```

### Ejemplo con Ordenamiento

```typescript
const { data } = useCertificates({
  offset: 0,
  limit: 10,
  sortBy: { tag: "Co2eTons", values: undefined },
  isDescending: true,
});
```

### Ejemplo con Paginación

```typescript
const [currentPage, setCurrentPage] = useState(0);
const ITEMS_PER_PAGE = 10;

const { data } = useCertificates({
  offset: currentPage * ITEMS_PER_PAGE,
  limit: ITEMS_PER_PAGE,
});
```

---

## 📈 Ventajas del Hook

### Rendimiento

- ✅ **Eficiencia O(limit):** Solo lee los IDs necesarios
- ✅ **Cache Inteligente:** Evita consultas redundantes
- ✅ **Auto-refetch:** Mantiene datos actualizados

### Experiencia de Usuario

- ✅ **Estados Integrados:** `isLoading`, `error`, `data`
- ✅ **Type Safety:** Tipificación estricta en todo el flujo
- ✅ **Manejo de Errores:** Mensajes claros y descriptivos

### Mantenibilidad

- ✅ **Reutilizable:** Funciona para múltiples componentes
- ✅ **Composable:** Se combina con otros hooks
- ✅ **Testeable:** Lógica separada de UI

---

## 🔍 Comparación de Estrategias

| Característica | Lista por Agricultor | Filtro por CO2e |
|----------------|---------------------|-----------------|
| **Función** | `list_certificates_by_farmer` | `filter_by_co2e_range` |
| **Paginación** | ✅ | ✅ |
| **Ordenamiento** | ✅ | ❌ |
| **Filtrado** | ❌ | ✅ |
| **Eficiencia** | O(limit) | O(limit) |
| **Uso** | Lista general | Búsqueda específica |

---

## 🎨 Casos de Uso

### 1. Vista de Mis Certificados

```typescript
const MyCertificatesPage = () => {
  const { data, isLoading } = useCertificates({
    offset: 0,
    limit: 10,
  });

  return (
    <div>
      <h2>Mis Certificados ({data?.total || 0})</h2>
      {data?.certificateIds.map(id => (
        <CertificateCard key={id} certificateId={id} />
      ))}
    </div>
  );
};
```

### 2. Búsqueda por Rango de CO2

```typescript
const CertificatesByCo2Range = () => {
  const [minCo2e, setMinCo2e] = useState(100);
  const [maxCo2e, setMaxCo2e] = useState(1000);

  const { data } = useCertificates({
    offset: 0,
    limit: 20,
    minCo2e,
    maxCo2e,
  });

  return (
    <div>
      <Input value={minCo2e} onChange={e => setMinCo2e(+e.target.value)} />
      <Input value={maxCo2e} onChange={e => setMaxCo2e(+e.target.value)} />
      {data?.certificateIds.map(id => (
        <CertificateCard key={id} certificateId={id} />
      ))}
    </div>
  );
};
```

### 3. Lista Ordenada

```typescript
const TopCertificatesPage = () => {
  const { data } = useCertificates({
    offset: 0,
    limit: 10,
    sortBy: { tag: "Co2eTons", values: undefined },
    isDescending: true, // Mayores valores primero
  });

  return (
    <div>
      <h2>Top 10 Certificados</h2>
      {data?.certificateIds.map(id => (
        <CertificateCard key={id} certificateId={id} />
      ))}
    </div>
  );
};
```

---

## 📝 Documentación del Código

### JSDoc Completo

```typescript
/**
 * Hook personalizado para obtener la lista paginada y filtrada de certificados NFT
 * 
 * Este hook utiliza TanStack Query para obtener certificados del contrato CarbonCertifier.
 * Soporta:
 * - Paginación eficiente con offset y limit
 * - Filtrado por rango de CO2e
 * - Ordenamiento por diferentes criterios
 * - Consulta automática basada en el usuario conectado
 * 
 * @param params - Parámetros de consulta (offset, limit, filtros, ordenamiento)
 * @returns Resultado de useQuery con estados de carga, error y datos
 * 
 * @example
 * // Uso básico
 * const { data, isLoading } = useCertificates({ offset: 0, limit: 10 });
 */
```

---

## 🧪 Testing Sugerido

### Unit Tests

```typescript
describe("useCertificates", () => {
  it("should return loading state initially", () => {
    const { result } = renderHook(() => useCertificates({ offset: 0, limit: 10 }));
    expect(result.current.isLoading).toBe(true);
  });

  it("should not query if no user connected", () => {
    // Mock useWallet to return no address
    const { result } = renderHook(() => useCertificates({ offset: 0, limit: 10 }));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("should use filter when minCo2e and maxCo2e provided", () => {
    // Verify that filter_by_co2e_range is called
  });
});
```

### Integration Tests

```typescript
describe("CertificateList Integration", () => {
  it("should fetch and display certificates", async () => {
    const { getByText } = render(<CertificateList />);
    await waitFor(() => {
      expect(getByText(/certificados/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🔄 Flujo de Datos

```
┌─────────────────┐
│   Component     │
│   (React)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useCertificates│
│     Hook        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   TanStack      │
│     Query       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  carbonCertifier│
│  TypeScript     │
│    Client       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Soroban       │
│    Network      │
│  (Blockchain)   │
└─────────────────┘
```

---

## 💡 Optimizaciones Futuras

### 1. Paginación Virtual

```typescript
// Usar react-window o react-virtual
const { data } = useCertificates({ offset: virtualOffset, limit: visibleItems });
```

### 2. Infinite Scroll

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["certificates", publicKey],
  queryFn: ({ pageParam = 0 }) => useCertificates({ offset: pageParam, limit: 10 }),
  getNextPageParam: (lastPage, allPages) => 
    allPages.length * 10 < lastPage.total ? allPages.length * 10 : undefined,
});
```

### 3. Debounce para Filtros

```typescript
const debouncedMinCo2e = useDebounce(minCo2e, 500);

const { data } = useCertificates({
  offset: 0,
  limit: 10,
  minCo2e: debouncedMinCo2e,
  maxCo2e: debouncedMaxCo2e,
});
```

---

## 📊 Resumen Técnico

| Aspecto | Detalles |
|---------|----------|
| **Líneas de código** | 147 |
| **Dependencias** | TanStack Query, useWallet |
| **Complejidad** | O(limit) |
| **Cache** | 5 minutos |
| **Auto-refetch** | 10 minutos |
| **Tipificación** | 100% estricta |
| **Tests** | Pendientes |
| **Estado** | ✅ Completo |

---

## ✅ Checklist de Implementación

- [x] Tipificación estricta con tipos Soroban
- [x] Integración con TanStack Query
- [x] Soporte para paginación (offset/limit)
- [x] Soporte para filtrado por CO2e
- [x] Soporte para ordenamiento
- [x] Manejo de errores robusto
- [x] Consulta condicional (requires user)
- [x] Cache y auto-refetch
- [x] Documentación JSDoc completa
- [x] Sin errores de linter
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Ejemplo de uso en UI

---

## 🎉 Resultado Final

Hook `useCertificates` listo para usar y compatible con:

- ✅ `CertificateCard`
- ✅ Componentes de lista
- ✅ Búsquedas filtradas
- ✅ Paginación
- ✅ Ordenamiento
- ✅ Caching y performance

---

**Autor:** AI Assistant  
**Fecha:** 2025-01-28  
**Versión:** 1.0.0  
**Estado:** ✅ Completado

