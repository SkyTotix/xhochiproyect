# 📝 Creación del Componente TokenBalance

## 🎯 Objetivo

Crear un componente React/TypeScript que muestre el balance de tokens CARBONXO (CXO) del usuario conectado de forma clara y profesional, utilizando el hook `useCarbonBalance`.

---

## ✅ Archivos Creados/Modificados

1. **`src/components/TokenBalance.tsx`** (Nuevo - 100 líneas)
   - Componente para mostrar balance CXO
   - Integración con useCarbonBalance y useWallet
   - Estados de carga, error y datos
   - Formateo de BigInt

---

## 📊 Características del Componente

### 1. **Integración con Hooks**

El componente utiliza dos hooks:

```typescript
const { address: publicKey } = useWallet();
const { data: balance, isLoading, error } = useCarbonBalance();
```

**Funcionalidad:**
- ✅ Obtiene dirección del usuario
- ✅ Consulta balance de CXO
- ✅ Maneja estados de carga y error

---

### 2. **Manejo de Estados**

#### Estado: Sin Billetera Conectada

```tsx
if (!publicKey) {
  return (
    <Alert variant="info">
      Conecte su billetera para ver el balance de tokens CARBONXO.
    </Alert>
  );
}
```

#### Estado: Cargando

```tsx
if (isLoading) {
  return (
    <Box gap="sm" direction="row" align="center">
      <Loader />
      <Text>Cargando balance...</Text>
    </Box>
  );
}
```

#### Estado: Error

```tsx
if (error) {
  return (
    <Alert variant="error">
      {error.message}
    </Alert>
  );
}
```

#### Estado: Datos Disponibles

```tsx
return (
  <Box gap="md" direction="column">
    <Text size="4xl" weight="bold">
      {formatBalance(balance)}
    </Text>
    <Text size="lg" weight="semi-bold">
      CXO
    </Text>
  </Box>
);
```

---

### 3. **Formateo de Balance**

El balance es un BigInt, se formatea con toLocaleString:

```typescript
const formatBalance = (balance: bigint | undefined): string => {
  if (balance === undefined) return "0";
  return balance.toLocaleString("es-MX");
};
```

**Características:**
- ✅ Formato local (es-MX) con separadores de miles
- ✅ Maneja undefined
- ✅ Retorna "0" si no hay balance

**Ejemplo:**
```typescript
BigInt(1500) → "1,500"
BigInt(1234567) → "1,234,567"
```

---

### 4. **Diseño y UX**

#### Jerarquía Visual

```tsx
Balance (Texto grande, bold)
  ↓
1,500 (Número muy grande, bold)
  ↓
CXO (Texto medio, semi-bold)
  ↓
Descripción (Texto pequeño, muted)
```

#### Colores

| Elemento | Color | Propósito |
|----------|-------|-----------|
| Título | `neutral-08` | Secundario |
| Balance | `neutral-09` | Principal |
| Símbolo | `neutral-08` | Secundario |
| Descripción | `neutral-06` | Terciario |

#### Tamaños

| Elemento | Size | Peso |
|----------|------|------|
| Título | `md` | `semi-bold` |
| Balance | `4xl` | `bold` |
| Símbolo | `lg` | `semi-bold` |
| Descripción | `xs` | normal |

---

## 🚀 Uso del Componente

### Ejemplo Básico

```tsx
import { TokenBalance } from "../components/TokenBalance";

const Dashboard = () => {
  return (
    <Box gap="md">
      <TokenBalance />
    </Box>
  );
};
```

### Ejemplo con Layout Personalizado

```tsx
const DashboardLayout = () => {
  return (
    <Layout.Content>
      <Box gap="lg">
        <Header />
        <Box gap="md" direction="row" wrap="wrap">
          <Box flex="1 1 300px">
            <TokenBalance />
          </Box>
          <Box flex="1 1 300px">
            <CertificateList />
          </Box>
        </Box>
      </Box>
    </Layout.Content>
  );
};
```

### Ejemplo con Grid

```tsx
const Dashboard = () => {
  return (
    <Grid columns={3} gap="md">
      <TokenBalance />
      <RecentTransactions />
      <CertificateStats />
    </Grid>
  );
};
```

---

## 💡 Mejoras Futuras Sugeridas

### 1. Formateo Avanzado

```typescript
const formatBalance = (balance: bigint | undefined): string => {
  if (balance === undefined) return "0.00";
  
  // Dividir por 100 para mostrar 2 decimales
  const divided = Number(balance) / 100;
  return divided.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Resultado: "15.00" o "1,234.56"
```

### 2. Símbolo Visual

```tsx
<Box gap="xs" direction="row" align="baseline">
  <Icon name="leaf" color="green" size="lg" />
  <Text size="4xl" weight="bold">
    {formatBalance(balance)}
  </Text>
  <Text size="lg" weight="semi-bold">
    CXO
  </Text>
</Box>
```

### 3. Animación de Cambio

```tsx
const { data: balance, isLoading } = useCarbonBalance();
const [displayBalance, setDisplayBalance] = useState(balance);

useEffect(() => {
  if (balance !== undefined) {
    // Animación de conteo
    animateValue(displayBalance, balance, setDisplayBalance);
  }
}, [balance]);
```

### 4. Badge de Estado

```tsx
<Box gap="md" direction="column">
  <Box gap="xs" direction="row" align="center">
    <Text as="h3" size="md" weight="semi-bold">
      Balance de Tokens CXO
    </Text>
    <Badge variant="success">Activo</Badge>
  </Box>
  {/* ... */}
</Box>
```

### 5. Información Adicional

```tsx
<Box gap="md" direction="column">
  {/* Balance principal */}
  <Box gap="xs" direction="row" align="baseline">
    <Text size="4xl" weight="bold">
      {formatBalance(balance)}
    </Text>
    <Text size="lg" weight="semi-bold">
      CXO
    </Text>
  </Box>

  {/* Información extra */}
  <Box gap="xs" direction="row" align="center">
    <Text size="xs" color="neutral-06">
      ≈ ${estimatedValue(balance)}
    </Text>
    <Text size="xs" color="neutral-06">
      • Última actualización: {lastUpdate}
    </Text>
  </Box>
</Box>
```

---

## 🎨 Variantes de Diseño

### Variante Compacta

```tsx
<Card compact>
  <Box gap="xs" direction="row" align="center" justify="space-between">
    <Text size="md" color="neutral-08">CXO</Text>
    <Box gap="xs" direction="row" align="baseline">
      <Text size="lg" weight="bold">
        {formatBalance(balance)}
      </Text>
      <Text size="sm">CXO</Text>
    </Box>
  </Box>
</Card>
```

### Variante Prominente

```tsx
<Card variant="primary">
  <Box gap="md" direction="column" align="center">
    <Text size="sm" color="neutral-06">
      Tu Balance de Tokens CXO
    </Text>
    <Box gap="xs" direction="row" align="baseline">
      <Text size="5xl" weight="bold" color="white">
        {formatBalance(balance)}
      </Text>
      <Text size="2xl" weight="semi-bold" color="white">
        CXO
      </Text>
    </Box>
    <Badge variant="light">1 CXO = 1 tonelada CO2e</Badge>
  </Box>
</Card>
```

---

## 📊 Resumen Técnico

| Aspecto | Detalles |
|---------|----------|
| **Líneas de código** | 100 |
| **Dependencias** | useCarbonBalance, useWallet, SDS |
| **Estados manejados** | Loading, Error, No wallet, Data |
| **Formateo** | BigInt toLocaleString |
| **Localización** | es-MX (Español México) |
| **Tests** | Pendientes |
| **Estado** | ✅ Funcional |

---

## 🧪 Casos de Prueba Sugeridos

### 1. Sin Billetera
- ✅ Debe mostrar alerta informativa
- ✅ No debe intentar cargar balance

### 2. Cargando
- ✅ Debe mostrar Loader
- ✅ Debe mostrar texto contextual

### 3. Error de Red
- ✅ Debe mostrar Alert con error
- ✅ Debe mostrar mensaje claro

### 4. Balance Cero
- ✅ Debe mostrar "0"
- ✅ Debe mostrar símbolo CXO

### 5. Balance Grande
- ✅ Debe formatear con separadores
- ✅ Debe ser legible

### 6. Balance Después de Mint
- ✅ Debe actualizar automáticamente
- ✅ Debe mostrar nuevo balance

---

## 🔄 Integración

### Con Dashboard

```tsx
const Dashboard = () => {
  return (
    <Box gap="lg">
      <Header />
      <Grid columns={3} gap="md">
        <TokenBalance />
        <CertificateStats />
        <RecentActivity />
      </Grid>
    </Box>
  );
};
```

### Con NavBar

```tsx
const NavBar = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/certificates">Certificados</Link>
      <TokenBalance />
    </nav>
  );
};
```

### Con Página de Perfil

```tsx
const ProfilePage = () => {
  return (
    <Box gap="lg">
      <ProfileHeader />
      <Box gap="md" direction="row" wrap="wrap">
        <Box flex="1 1 300px">
          <TokenBalance />
        </Box>
        <Box flex="1 1 300px">
          <WalletInfo />
        </Box>
      </Box>
    </Box>
  );
};
```

---

## ✅ Checklist de Implementación

- [x] Crear componente TokenBalance
- [x] Integrar useCarbonBalance
- [x] Integrar useWallet
- [x] Manejar estado sin wallet
- [x] Manejar estado loading
- [x] Manejar estado error
- [x] Manejar estado con datos
- [x] Implementar formateo BigInt
- [x] Usar componentes SDS
- [x] Tipografía jerárquica
- [x] Colores apropiados
- [x] Espaciado consistente
- [x] Sin errores de linter
- [ ] Tests unitarios
- [ ] Tests de integración

---

## 🎉 Resultado Final

Componente `TokenBalance` completo que:

- ✅ Muestra balance de CXO
- ✅ Maneja todos los estados
- ✅ Formatea BigInt legiblemente
- ✅ Usa Stellar Design System
- ✅ UX profesional
- ✅ Sin errores

---

**Autor:** AI Assistant  
**Fecha:** 2025-01-28  
**Versión:** 1.0.0  
**Estado:** ✅ Funcional

