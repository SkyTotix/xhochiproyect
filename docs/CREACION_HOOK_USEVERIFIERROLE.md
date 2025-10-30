# 📝 Creación del Hook useVerifierRole

## 🎯 Objetivo

Crear un hook personalizado React/TypeScript que verifique si el usuario conectado es el administrador del contrato CarbonCertifier consultando el Instance Storage.

---

## ✅ Tareas Completadas

### Archivos Creados/Modificados

1. **`contracts/carbon-certifier/src/contract.rs`** (Modificado)
   - ✅ Agregada función `get_admin()` para leer el admin desde Instance Storage

2. **`src/hooks/useVerifierRole.ts`** (Nuevo - 98 líneas)
   - Hook para verificar rol de administrador
   - Lectura directa de Instance Storage usando RPC

---

## 📊 Características del Hook

### 1. **Función get_admin en el Contrato**

Se agregó una función readonly al contrato Rust:

```rust
/// Obtiene la dirección del administrador del contrato
pub fn get_admin(env: Env) -> Result<Address, ContractError> {
    match env.storage().instance().get(&DataKey::Admin) {
        Some(admin) => Ok(admin),
        None => Err(ContractError::NotFound),
    }
}
```

**Características:**
- ✅ Función readonly (no modifica estado)
- ✅ Lee desde Instance Storage
- ✅ Retorna `Result<Address, ContractError>`

---

### 2. **Implementación del Hook**

#### Integración con useWallet

```typescript
const { address: publicKey } = useWallet();
```

#### Lectura desde Instance Storage

El hook usa el RPC Server para leer directamente el storage:

```typescript
const server = new Server(rpcUrl, { allowHttp: stellarNetwork === "LOCAL" });
const spec = carbonCertifier.spec;

// Construir DataKey
const adminDataKey = spec.toXDR("DataKey", { tag: "Admin", values: null });

// Construir LedgerKey
const ledgerKey = xdr.LedgerKey.contractData(
  new xdr.LedgerKeyContractData({
    contract: address.toScAddress(),
    key: xdr.ScVal.fromXDR(adminDataKey),
    durability: xdr.ContractDataDurability.instance(),
  })
);

// Consultar RPC
const response = await server.getLedgerEntries(ledgerKey);
```

---

### 3. **Tipificación y Retorno**

```typescript
export const useVerifierRole = () => {
  const { address: publicKey } = useWallet();

  return useQuery<boolean>({
    queryKey: ["verifier-role", publicKey],
    queryFn: async () => {
      // ... lógica
      return adminAddressStr.toLowerCase() === publicKey.toLowerCase();
    },
    enabled: publicKey !== undefined && publicKey !== null && publicKey !== "",
    staleTime: 5 * 60 * 1000,
  });
};
```

**Retorno:**
- ✅ `data: boolean` - True si es admin
- ✅ `isLoading: boolean` - Estado de carga
- ✅ `error: Error | null` - Errores de consulta

---

## 🔧 Flujo de Consulta

```
Usuario conectado (publicKey)
  ↓
useVerifierRole consulta
  ↓
Server.getLedgerEntries(Admin Key)
  ↓
Decodificar Address desde XDR
  ↓
Comparar con publicKey
  ↓
Retornar boolean
```

---

## 🚀 Uso del Hook

### Ejemplo Básico

```typescript
import { useVerifierRole } from "../hooks/useVerifierRole";

const AdminPanel = () => {
  const { data: isAdmin, isLoading, error } = useVerifierRole();

  if (isLoading) return <Loader />;
  if (error) return <Alert>{error.message}</Alert>;

  if (!isAdmin) {
    return <Alert>No autorizado: se requiere rol de administrador</Alert>;
  }

  return <div>Panel administrativo</div>;
};
```

### Ejemplo con Guard

```typescript
const MintCertificate = () => {
  const { data: isAdmin } = useVerifierRole();

  if (!isAdmin) {
    return null; // No mostrar el componente
  }

  return <MintForm />;
};
```

### Ejemplo con Conditional Render

```typescript
const NavBar = () => {
  const { data: isAdmin } = useVerifierRole();

  return (
    <nav>
      <Link to="/home">Home</Link>
      <Link to="/certificates">Certificados</Link>
      {isAdmin && <Link to="/admin">Admin</Link>}
    </nav>
  );
};
```

---

## 💡 Aproximaciones Consideradas

### ❌ Opción 1: Agregar helper al cliente (Descartada)

```typescript
// No funciona bien con tipos
clientInstance.get_admin = async () => { /* ... */ };
```

**Problema:** Tipos complejos de XDR/ScVal

### ✅ Opción 2: Lectura directa con RPC (Implementada)

```typescript
const response = await server.getLedgerEntries(ledgerKey);
const adminAddressStr = spec.fromXDR("Address", scValXdr);
```

**Ventajas:**
- ✅ Control total sobre el proceso
- ✅ Sin dependencias de funciones de contrato
- ✅ Funciona con cualquier storage

---

## 🔍 Manejo de Storage

### Extracción del Valor

```typescript
const storageEntry = response.entries[0].val!;
const ledgerEntryData = storageEntry.contractData();
const contractDataVal = ledgerEntryData.val();
const scVal = contractDataVal.value();
const scValXdr = scVal.toXDR("base64");
const adminAddressStr = spec.fromXDR("Address", scValXdr);
```

**Pasos:**
1. Obtener `LedgerEntryData`
2. Extraer `ContractDataVal`
3. Convertir a `ScVal`
4. Codificar a XDR base64
5. Decodificar con spec

---

## 🎯 Casos de Uso

### 1. Proteger Rutas Admin

```typescript
const ProtectedAdminRoute = ({ children }) => {
  const { data: isAdmin, isLoading } = useVerifierRole();

  if (isLoading) return <Loader />;
  if (!isAdmin) return <Navigate to="/unauthorized" />;

  return children;
};
```

### 2. Habilitar/Deshabilitar Botones

```typescript
const MintButton = () => {
  const { data: isAdmin } = useVerifierRole();

  return (
    <Button disabled={!isAdmin}>
      Acuñar Certificado
    </Button>
  );
};
```

### 3. Mostrar/Ocultar Menús

```typescript
const AdminMenu = () => {
  const { data: isAdmin } = useVerifierRole();

  if (!isAdmin) return null;

  return (
    <Menu>
      <MenuItem>Gestionar Verificadores</MenuItem>
      <MenuItem>Configurar Tokens</MenuItem>
    </Menu>
  );
};
```

---

## ⚠️ Nota Importante

**La función `get_admin()` fue agregada al contrato, pero:**

1. ⏳ El cliente TypeScript aún no se ha regenerado
2. ⏳ La función en el hook usa RPC directo como workaround
3. ✅ Una vez regenerado, podremos simplificar el hook

**Siguiente paso:** Cuando el cliente se regenere, simplificar:

```typescript
// DESPUÉS de regenerar el cliente
const result = await carbonCertifier.get_admin();
if (result.result.isErr()) {
  throw new Error(result.result.unwrapErr());
}
const adminAddress = result.result.unwrap();
return adminAddress.toLowerCase() === publicKey.toLowerCase();
```

---

## 📊 Resumen Técnico

| Aspecto | Detalles |
|---------|----------|
| **Líneas de código** | 98 |
| **Dependencias** | SorobanRpc Server, useWallet |
| **Complejidad** | Media (XDR manual) |
| **Cache** | 5 minutos |
| **Consulta** | Readonly (Instance Storage) |
| **Tipificación** | 100% estricta |
| **Tests** | Pendientes |
| **Estado** | ✅ Funcional (workaround) |

---

## 🔄 Próximos Pasos

### Inmediato

1. Esperar regeneración del cliente con `get_admin()`
2. Simplificar el hook usando la función autogenerada
3. Remover código XDR manual

### Futuro

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Documentar casos edge
- [ ] Agregar retry automático

---

## ✅ Checklist de Implementación

- [x] Agregar función `get_admin()` al contrato
- [x] Crear hook `useVerifierRole`
- [x] Integración con useWallet
- [x] Consulta a Instance Storage
- [x] Decodificación XDR
- [x] Comparación de direcciones
- [x] Manejo de errores
- [x] Cache y staleTime
- [x] Tipificación estricta
- [x] Sin errores de linter
- [ ] Simplificar cuando se regenere cliente
- [ ] Tests unitarios
- [ ] Tests de integración

---

## 🎉 Resultado Final

Hook `useVerifierRole` funcional que:

- ✅ Verifica rol de administrador
- ✅ Usa TanStack Query
- ✅ Lee Instance Storage
- ✅ Compara direcciones
- ✅ Maneja errores
- ✅ Cache inteligente
- ⏳ Usará función autogenerada cuando se regenere

---

**Autor:** AI Assistant  
**Fecha:** 2025-01-28  
**Versión:** 1.0.0 (Workaround)  
**Estado:** ✅ Funcional (pendiente simplificación)

