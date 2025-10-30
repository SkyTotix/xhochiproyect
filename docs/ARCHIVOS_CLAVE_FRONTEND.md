# Archivos Clave para Desarrollo Frontend

## 📂 Estructura del Proyecto

```
carbon-xochi/
├── contracts/              # Contratos Rust (backend)
│   ├── carbon-certifier/   # NFT de Certificados
│   └── carbon-token/       # Token fungible CARBONXO
├── src/                    # Frontend React/TypeScript
│   ├── contracts/          # Clientes TypeScript autogenerados
│   ├── components/         # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas de la aplicación
│   └── util/               # Utilidades
├── packages/               # Paquetes npm de clientes (se genera automáticamente)
└── target/stellar/local/   # WASM compilados
```

## 🎯 Archivos Clave para el Frontend

### 1. Configuración de Entorno

**`environments.toml`**
- Define los contratos a desplegar en desarrollo
- Configura parámetros de construcción
- Los contratos `carbon_certifier` y `carbon_token` ya están configurados

**Ubicación:** Raíz del proyecto

### 2. Contratos TypeScript Autogenerados

Los clientes TypeScript se generan automáticamente en:

**`src/contracts/`**
- `carbon_certifier.ts` - Cliente para el contrato NFT de certificados
- `carbon_token.ts` - Cliente para el contrato de tokens CARBONXO

**Estado:** ⏳ Se generan al ejecutar `npm run dev` con Scaffold Stellar

### 3. Componentes Principales

#### **`src/components/`**

**Componentes a crear:**

1. **`CertificateList.tsx`** - Lista de certificados NFT
   ```typescript
   import carbonCertifier from "../contracts/carbon_certifier";
   
   // Listar certificados de un agricultor
   const certificates = await carbonCertifier.listCertificatesByFarmer({
     farmer: farmerAddress
   });
   ```

2. **`CertificateCard.tsx`** - Tarjeta individual de certificado
   ```typescript
   // Mostrar datos del certificado
   const data = await carbonCertifier.getCertificateData({
     certificateId: id
   });
   ```

3. **`TokenBalance.tsx`** - Balance de tokens CARBONXO
   ```typescript
   import carbonToken from "../contracts/carbon_token";
   
   // Obtener balance
   const balance = await carbonToken.balance({
     address: userAddress
   });
   ```

4. **`MintCertificate.tsx`** - Formulario para acuñar certificados (solo verificadores)
   ```typescript
   // Acuñar certificado
   await carbonCertifier.mintCertificate({
     farmer: farmerAddress,
     surfaceArea: BigDecimal("10"),
     co2Reduced: BigDecimal("5")
   });
   ```

5. **`TransferTokens.tsx`** - Transferir tokens CARBONXO
   ```typescript
   // Transferir tokens
   await carbonToken.transfer({
     from: userAddress,
     to: recipientAddress,
     amount: BigDecimal("100")
   });
   ```

### 4. Custom Hooks

#### **`src/hooks/`**

**Hooks a crear:**

1. **`useCarbonBalance.ts`** - Hook para balance de tokens
   ```typescript
   export const useCarbonBalance = (address: string) => {
     const [balance, setBalance] = useState<number>(0);
     
     useEffect(() => {
       carbonToken.balance({ address }).then(setBalance);
     }, [address]);
     
     return balance;
   };
   ```

2. **`useCertificates.ts`** - Hook para certificados
   ```typescript
   export const useCertificates = (farmerAddress: string) => {
     const [certificates, setCertificates] = useState([]);
     
     useEffect(() => {
       carbonCertifier.listCertificatesByFarmer({ 
         farmer: farmerAddress 
       }).then(setCertificates);
     }, [farmerAddress]);
     
     return certificates;
   };
   ```

3. **`useVerifierRole.ts`** - Hook para verificar rol de verificador
   ```typescript
   export const useVerifierRole = (address: string) => {
     const [isVerifier, setIsVerifier] = useState(false);
     
     // Implementar lógica de verificación
     return isVerifier;
   };
   ```

### 5. Páginas

#### **`src/pages/`**

**Páginas a crear:**

1. **`Dashboard.tsx`** - Página principal
   - Balance de tokens CARBONXO
   - Lista de certificados recientes
   - Métricas de CO2 reducido

2. **`Certificates.tsx`** - Lista de certificados
   - Filtros por agricultor/verificador
   - Búsqueda y ordenamiento
   - Detalles de cada certificado

3. **`Mint.tsx`** - Página para acuñar certificados
   - Solo accesible para verificadores
   - Formulario con validación
   - Conexión a wallet

4. **`Transfer.tsx`** - Página de transferencias
   - Formulario de transferencia
   - Historial de transacciones

### 6. Utilidades

#### **`src/util/`**

**Utilidades existentes:**

- **`contract.ts`** - Utilidades de contratos
- **`wallet.ts`** - Utilidades de wallet
- **`storage.ts`** - Almacenamiento local

**Utilidades a crear:**

1. **`carbonCalculations.ts`** - Cálculos de CO2
   ```typescript
   // Calcular CO2 reducido según metodología CONADESUCA
   export const calculateCO2Reduced = (surfaceArea: number) => {
     // Fórmula: SQ * factor de emisión
     return surfaceArea * FACTOR_EMISION;
   };
   ```

2. **`formatting.ts`** - Formateo de datos
   ```typescript
   export const formatCO2 = (amount: number) => {
     return `${amount.toFixed(2)} t CO2e`;
   };
   ```

## 🚀 Flujo de Desarrollo

### 1. Iniciar Desarrollo

```bash
npm run dev
```

Esto ejecuta:
- `stellar scaffold watch --build-clients` (compila contratos y genera clientes)
- `vite` (servidor de desarrollo React)

### 2. Importar Clientes

Una vez generados los clientes:

```typescript
import carbonCertifier from "./contracts/carbon_certifier";
import carbonToken from "./contracts/carbon_token";
```

### 3. Usar Clientes en Componentes

```typescript
// Ejemplo en un componente React
const MyComponent = () => {
  const { address } = useWallet();
  
  const mintCertificate = async () => {
    await carbonCertifier.mintCertificate({
      farmer: farmerAddress,
      surfaceArea: BigDecimal("10"),
      co2Reduced: BigDecimal("5")
    });
  };
  
  return <Button onClick={mintCertificate}>Acuñar</Button>;
};
```

## 📊 IDs de Contratos Desplegados

Los contratos ya están desplegados en local con estos IDs:

- **CarbonCertifier:** `CBFZFLYPOHKL476MCNFACCKLAKYQZ2QGUUHGUUEGBX63QOBDH5WJ4BNN`
- **CarbonToken:** `CD7SQJZOUVUAKDDLIANIXKZM6FCG2EIOV3JWB4KTVCE7QBOC7I2O6YXE`

**Ubicación:** `.config/stellar/contract-ids/`

## 🎨 Estilos y Diseño

### Stellar Design System

El proyecto usa **Stellar Design System**:

```typescript
import { Button, Card, Text, Input } from "@stellar/design-system";
```

### Componentes de Diseño

- **`src/components/layout/Box.tsx`** - Container de layout
- Usar componentes del Design System para UI consistente

## 🔗 Integración con Wallet

### Wallet Provider

**`src/providers/WalletProvider.tsx`**
- Gestiona la conexión de wallets
- Proporciona contexto de wallet a toda la app

### Hook de Wallet

**`src/hooks/useWallet.ts`**
```typescript
const { address, isConnected, disconnect } = useWallet();
```

## 📝 Ejemplo Completo de Componente

```typescript
import { useState } from "react";
import { Button, Card, Text } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import carbonCertifier from "../contracts/carbon_certifier";
import { BigDecimal } from "@stellar/stellar-sdk";

export const MintCertificate = () => {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  
  const handleMint = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const result = await carbonCertifier.mintCertificate({
        farmer: "GEXAMPLE...",
        surfaceArea: BigDecimal("10"),
        co2Reduced: BigDecimal("5")
      });
      
      console.log("Certificado acuñado:", result);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <Text>Acuñar Certificado</Text>
      <Button onClick={handleMint} disabled={loading}>
        {loading ? "Acuñando..." : "Acuñar"}
      </Button>
    </Card>
  );
};
```

## 🧪 Testing

Usar el **Debugger** integrado en la aplicación:
- Visita `http://localhost:5173/debug` para ver todos los contratos
- Puedes invocar funciones directamente desde ahí

## 📚 Próximos Pasos

1. ✅ Contratos compilados y desplegados
2. ✅ Clientes TypeScript generándose
3. ⏳ Crear componentes UI
4. ⏳ Implementar flujo completo de tokenización
5. ⏳ Agregar validaciones y manejo de errores

---

**¡Listo para desarrollar el frontend!** 🚀
