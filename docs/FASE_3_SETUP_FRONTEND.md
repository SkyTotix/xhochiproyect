# Fase 3: Setup y Compilación del Frontend

## 📋 Resumen Ejecutivo

Esta guía describe el proceso de compilación de los contratos Rust a WebAssembly (WASM) y la generación de los clientes TypeScript necesarios para el desarrollo del frontend React/TypeScript del proyecto CARBONXO.

**Fecha:** Enero 2025  
**Estado:** 🔄 Listo para ejecutar  
**Comandos:** Compilación y watch mode

---

## 🎯 Objetivo

Preparar el entorno de desarrollo full-stack:

1. Compilar contratos Rust a WASM
2. Generar clientes TypeScript en `packages/`
3. Iniciar modo watch para desarrollo
4. Identificar archivos clave del frontend

---

## 🔧 Comandos de Compilación

### 1. Compilación Única (Solo una vez)

Si solo necesitas compilar los contratos una vez y generar los clientes TypeScript:

**Método A: Con Stellar Scaffold (requiere Docker)**

```bash
# Requiere Docker corriendo
stellar scaffold build

# Esto compila contratos Y genera clientes TypeScript automáticamente
```

**Método B: Manual (sin Docker)**

```bash
# Compilar todos los contratos del workspace a WASM
cargo build --target wasm32-unknown-unknown --release

# Los WASM se generarán en:
# target/wasm32-unknown-unknown/release/carbon_certifier.wasm
# target/wasm32-unknown-unknown/release/carbon_token.wasm
```

**⚠️ Nota:** Para generar clientes TypeScript automáticamente se requiere Docker. Si no tienes Docker, los clientes se pueden crear manualmente.

**Explicación:**
- `cargo build --target wasm32-unknown-unknown --release`: Compila todos los contratos Rust del workspace usando el target WebAssembly con optimizaciones de release
- `stellar scaffold build-clients`: Genera los clientes TypeScript desde los archivos WASM compilados en `packages/`

### 2. Modo Watch (Recomendado para Desarrollo)

Para desarrollo activo con recarga automática:

```bash
# Iniciar watch mode - compila y regenera clientes automáticamente
stellar scaffold watch --build-clients
```

**Explicación:**
- `stellar scaffold watch --build-clients`: Monitorea cambios en los contratos Rust
- Recompila automáticamente cuando detecta cambios
- Regenera los clientes TypeScript en `packages/`
- Perfecto para desarrollo iterativo

### 3. Desarrollo Full-Stack (Todo en Uno)

Para iniciar el servidor de desarrollo React y el watch mode simultáneamente:

```bash
# Ejecutar en una sola terminal - React + watch mode
npm run dev
```

**Explicación:**
- `npm run dev`: Ejecuta `concurrently "stellar scaffold watch --build-clients" "vite"`
- Inicia dos procesos simultáneamente:
  1. `stellar scaffold watch --build-clients` - Watch mode para contratos
  2. `vite` - Servidor de desarrollo de React

**Alternativa con separación:**

```bash
# Terminal 1: Watch mode de contratos
stellar scaffold watch --build-clients

# Terminal 2: Servidor de desarrollo React
npm run dev:frontend  # Si existe, o simplemente: vite
```

---

## 📁 Estructura de Directorios Generados

Después de ejecutar los comandos anteriores, la estructura será:

```
carbon-xochi/
├── contracts/                    # Contratos Rust originales
│   ├── carbon-certifier/
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── contract.rs
│   │       └── test.rs
│   └── carbon-token/
│       └── src/
│           ├── lib.rs
│           ├── token.rs
│           └── test.rs
│
├── packages/                     # 📦 CLIENTES TYPESCRIPT GENERADOS
│   ├── carbon-certifier/         # Cliente de CarbonCertifier
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts         # Exportaciones principales
│   │   │   ├── contract.ts      # Cliente del contrato
│   │   │   ├── types.ts         # Tipos TypeScript
│   │   │   └── ...
│   │   └── dist/                # Archivos compilados
│   │
│   └── carbon-token/            # Cliente de CarbonToken
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── token.ts         # Cliente del contrato
│       │   ├── types.ts         # Tipos TypeScript
│       │   └── ...
│       └── dist/
│
├── src/                         # FRONTEND REACT/TS
│   ├── App.tsx                  # 📍 Componente principal
│   ├── pages/
│   │   ├── Home.tsx             # 📍 Página de inicio
│   │   └── ...
│   ├── components/              # Componentes React
│   ├── providers/
│   │   └── WalletProvider.tsx   # 📍 Provider de billetera
│   └── util/
│       └── contract.ts          # 📍 Utilidades de contratos
│
└── target/
    └── wasm32-unknown-unknown/
        └── release/              # WASM compilados
```

---

## 🎯 Archivos Clave para el Desarrollo del Frontend

### 1. Componentes Principales en `src/`

#### `src/App.tsx`
```typescript
// Componente raíz de la aplicación
// Aquí se define el routing y la estructura general
```

#### `src/pages/Home.tsx`
```typescript
// Página principal de la aplicación
// Ideal para empezar a crear la UI del proyecto CARBONXO
```

#### `src/providers/WalletProvider.tsx`
```typescript
// Provider de billetera Stellar
// Gestiona la conexión de usuarios
// Contexto: wallet, balance, connect/disconnect
```

#### `src/components/ConnectAccount.tsx`
```typescript
// Componente para conectar billetera
// Reutilizable en múltiples páginas
```

### 2. Clientes Importar desde `packages/`

#### Cliente CarbonCertifier
```typescript
import { CarbonCertifier } from "@carbon-xochi/carbon-certifier";

// Funciones disponibles:
// - mint_certificate()
// - burn_certificate()
// - transfer_certificate()
// - get_certificate_data()
// - list_certificates_by_farmer()
// - get_total_certificates()
// - get_total_co2e()
// - etc.
```

#### Cliente CarbonToken
```typescript
import { CarbonToken } from "@carbon-xochi/carbon-token";

// Funciones disponibles:
// - mint()
// - transfer()
// - approve()
// - transfer_from()
// - balance()
// - allowance()
// etc.
```

#### Tipos TypeScript
```typescript
import { 
    VerificationRecord,
    CertificateMintedEvent,
    CertificateBurnedEvent 
} from "@carbon-xochi/carbon-certifier/types";

import {
    MintEvent,
    TransferEvent,
    ApprovalEvent
} from "@carbon-xochi/carbon-token/types";
```

### 3. Utilidades en `src/util/`

#### `src/util/contract.ts`
```typescript
// Funciones auxiliares para interactuar con contratos
// Ejemplo: deploy, invoke, query
```

---

## 🚀 Flujo de Desarrollo Recomendado

### Paso 1: Compilación Inicial

```bash
# Compilar contratos y generar clientes
stellar scaffold build-clients

# Verificar que packages/ se generó correctamente
ls packages/
# Deberías ver: carbon-certifier/ y carbon-token/
```

### Paso 2: Instalación de Dependencias

```bash
# Instalar dependencias de los clientes generados
npm run install:contracts

# O manualmente:
npm install --workspace=packages && npm run build --workspace=packages
```

### Paso 3: Inicio del Desarrollo

```bash
# Terminal 1: Iniciar watch mode + servidor React
npm run dev

# Esto ejecutará:
# 1. stellar scaffold watch --build-clients
# 2. vite (servidor React en http://localhost:5173)
```

### Paso 4: Crear Componentes del Frontend

Crear nuevos componentes en `src/components/`:

```typescript
// src/components/CarbonCertifier.tsx
import { CarbonCertifier } from "@carbon-xochi/carbon-certifier";
import { useState, useEffect } from "react";

export const CarbonCertifierComponent = () => {
    const [contract, setContract] = useState<CarbonCertifier | null>(null);
    
    // Inicializar contrato, llamar funciones, etc.
    
    return (
        <div>
            {/* UI de tu componente */}
        </div>
    );
};
```

---

## 📊 Scripts de `package.json`

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia watch mode + servidor React |
| `npm run start` | Alias de `dev` |
| `npm run build` | Build de producción del frontend |
| `npm run install:contracts` | Instala clientes generados |
| `npm run lint` | Ejecuta linter |
| `npm run format` | Formatea código con Prettier |

---

## 🔍 Verificación de Compilación Exitosa

### 1. Verificar WASM

```bash
# Verificar que los WASM se generaron
ls target/wasm32-unknown-unknown/release/

# Deberías ver:
# - carbon_certifier.wasm
# - carbon_token.wasm
```

### 2. Verificar Clientes TypeScript

```bash
# Verificar que packages/ existe
ls packages/

# Deberías ver:
# - carbon-certifier/
#   - package.json
#   - src/index.ts
#   - src/contract.ts
#   - src/types.ts
# - carbon-token/
#   - package.json
#   - src/index.ts
#   - src/token.ts
#   - src/types.ts
```

### 3. Verificar Tipos TypeScript

```bash
# Compilar TypeScript para verificar errores
npx tsc --noEmit
```

---

## 🐛 Solución de Problemas

### Error: "stellar: command not found"

**Solución:**
```bash
# Instalar Stellar CLI
npm install -g @stellar/cli

# Verificar instalación
stellar --version
```

### Error: "packages/ is empty"

**Solución:**
```bash
# Forzar regeneración de clientes
rm -rf packages/
stellar scaffold build-clients
```

### Error: "Module not found: @carbon-xochi/carbon-certifier"

**Solución:**
```bash
# Reinstalar clientes
npm run install:contracts

# O manualmente:
cd packages/carbon-certifier && npm install && npm run build
cd packages/carbon-token && npm install && npm run build
```

### Error: "Type error in client imports"

**Solución:**
```bash
# Limpiar y recompilar
cargo clean
cargo build --target wasm32-unknown-unknown --release
stellar scaffold build-clients
npm run install:contracts
```

---

## 📝 Próximos Pasos

Una vez que los clientes TypeScript estén generados:

1. **Crear componentes de UI** en `src/components/`:
   - `MintCertificateForm.tsx` - Formulario para acuñar certificados
   - `BurnCertificateButton.tsx` - Botón para quemar certificados
   - `CertificateList.tsx` - Lista de certificados del usuario
   - `BalanceDisplay.tsx` - Mostrar balance de tokens CXO

2. **Crear páginas** en `src/pages/`:
   - `MintPage.tsx` - Página de acuñación (para verificadores)
   - `MyCertificates.tsx` - Certificados del usuario (para agricultores)
   - `OffsetPage.tsx` - Página de compensación (para usuarios finales)

3. **Integrar billetera** usando:
   - `WalletProvider` en `src/providers/WalletProvider.tsx`
   - `ConnectAccount` component
   - `@creit.tech/stellar-wallets-kit`

4. **Conectar con contratos** usando:
   - `CarbonCertifier` client desde `packages/carbon-certifier`
   - `CarbonToken` client desde `packages/carbon-token`

---

## ✅ Checklist de Setup

- [ ] `stellar` CLI instalado
- [ ] `cargo` y `rustc` configurados
- [ ] `npm install` ejecutado en raíz
- [ ] Contratos compilados a WASM
- [ ] Clientes TypeScript generados en `packages/`
- [ ] `npm run install:contracts` ejecutado
- [ ] `npm run dev` inicia correctamente
- [ ] Navegador muestra aplicación en http://localhost:5173
- [ ] Clientes importables sin errores

---

## 🎓 Conceptos Clave

### Scaffold Stellar CLI

**Propósito:** Herramienta de línea de comandos para desarrollo Stellar

**Comandos principales:**
- `scaffold build-clients` - Genera clientes desde WASM
- `scaffold watch --build-clients` - Modo watch con regeneración automática

### Workspaces de NPM

El proyecto usa workspaces de NPM para manejar múltiples paquetes:
- Workspace root: proyecto principal
- `packages/*`: Clientes TypeScript generados

### Concurrently

Ejecuta múltiples comandos en paralelo:
```json
"dev": "concurrently \"stellar scaffold watch\" \"vite\""
```

---

**Fin del Documento**
