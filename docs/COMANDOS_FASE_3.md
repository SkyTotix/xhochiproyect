# Comandos de Terminal - Fase 3: Setup Frontend

## 📋 Comandos Ejecutados con Éxito

### 1. Verificar Docker

```bash
docker --version
```

**Resultado:** Docker version 28.5.1 ✅

### 2. Compilar Contratos y Generar Clientes

```bash
stellar scaffold build --build-clients
```

**Resultado:**
- ✅ Contratos compilados a WASM
- ✅ Contratos desplegados en red local
- ✅ Clientes TypeScript generados

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

**Resultado:**
- ✅ Servidor de desarrollo iniciado
- ✅ Scaffold Stellar watch activo
- ✅ Servidor Vite corriendo

## 🎯 Comandos Disponibles

### Iniciar Desarrollo Full-Stack

```bash
# Iniciar todo (Scaffold + Vite)
npm run dev

# Detener servidor
Ctrl + C
```

### Compilar Contratos Manualmente

```bash
# Compilar y desplegar contratos
stellar scaffold build

# Compilar, desplegar y generar clientes TypeScript
stellar scaffold build --build-clients
```

### Gestionar Contenedor Docker

```bash
# Verificar estado del contenedor
docker ps

# Ver logs del contenedor
stellar container logs local

# Detener contenedor
stellar container stop local

# Iniciar contenedor
stellar container start local
```

### Verificar Contratos Desplegados

```bash
# Ver ID de CarbonCertifier
cat .config/stellar/contract-ids/carbon_certifier.json

# Ver ID de CarbonToken
cat .config/stellar/contract-ids/carbon_token.json

# Listar todos los contratos
ls .config/stellar/contract-ids/
```

### Testing y Debug

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir Debugger en navegador
http://localhost:5173/debug
```

### Build para Producción

```bash
# Build frontend
npm run build

# Preview de build de producción
npm run preview
```

## 🔧 Comandos de NPM

### Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Instalar solo dependencias de contratos
npm run install:contracts
```

### Linting y Formateo

```bash
# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## 🐳 Comandos de Docker

### Gestión de Contenedores

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Ver logs del contenedor Stellar
docker logs stellar-local

# Detener todos los contenedores
docker stop $(docker ps -q)

# Eliminar todos los contenedores
docker rm $(docker ps -aq)
```

### Gestión de Imágenes

```bash
# Ver imágenes Docker
docker images

# Eliminar imágenes no utilizadas
docker image prune

# Eliminar todas las imágenes no utilizadas
docker image prune -a
```

## 🚀 Comandos del Stellar CLI

### Gestión de Cuentas

```bash
# Listar cuentas configuradas
stellar keys list

# Crear nueva cuenta
stellar keys generate

# Ver detalles de cuenta
stellar keys show me
```

### Gestión de Contratos

```bash
# Invocar función de contrato
stellar contract invoke --id CBFZFLYPOHKL476MCNFACCKLAKYQZ2QGUUHGUUEGBX63QOBDH5WJ4BNN -- get_total_certificates

# Ver especificación del contrato
stellar contract inspect --id CBFZFLYPOHKL476MCNFACCKLAKYQZ2QGUUHGUUEGBX63QOBDH5WJ4BNN
```

### Desarrollo

```bash
# Compilar contrato específico
cargo build --target wasm32v1-none --release --manifest-path contracts/carbon-certifier/Cargo.toml

# Ver logs en tiempo real
stellar container logs local --follow
```

## 📊 Comandos Útiles para Debugging

### Ver Archivos Generados

```bash
# Ver WASM compilados
ls target/stellar/local/

# Ver clientes en packages
ls target/packages/

# Ver contratos en src
ls src/contracts/
```

### Verificar Estado del Proyecto

```bash
# Ver versión de Node
node --version

# Ver versión de npm
npm --version

# Ver versión de Stellar CLI
stellar --version

# Ver versión de Rust
rustc --version

# Ver versión de Cargo
cargo --version
```

## 🔍 Comandos de Inspección

### Ver Configuración

```bash
# Ver environments.toml
cat environments.toml

# Ver package.json
cat package.json

# Ver Cargo.toml
cat Cargo.toml
```

### Ver Logs

```bash
# Ver logs de npm
npm run dev > logs.txt 2>&1

# Ver logs de Stellar
stellar container logs local > stellar-logs.txt 2>&1
```

## 🧹 Comandos de Limpieza

### Limpiar Build

```bash
# Limpiar archivos de build de Rust
cargo clean

# Limpiar node_modules
rm -rf node_modules
rm -rf target/node_modules

# Limpiar todo y reinstalar
rm -rf node_modules target/node_modules
npm install
```

### Limpiar Docker

```bash
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo Docker (¡CUIDADO!)
docker system prune -a
```

## 🛠️ Solución de Problemas

### Si Docker no inicia

```bash
# Reiniciar servicio de Docker
# En Windows: Abrir Docker Desktop

# Verificar que Docker está corriendo
docker ps
```

### Si los clientes no se generan

```bash
# Detener servidor (Ctrl + C)
# Limpiar y reiniciar
cargo clean
stellar scaffold build --build-clients
npm run dev
```

### Si hay errores de npm

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

## 📝 Notas Importantes

1. **Backend corriendo:** Los contratos están desplegados y funcionando
2. **Clientes TypeScript:** Se generan automáticamente con `npm run dev`
3. **Servidor Vite:** Accesible en `http://localhost:5173`
4. **Debugger:** Disponible en `http://localhost:5173/debug`

## 🔗 URLs Importantes

- **Frontend:** http://localhost:5173
- **Debugger:** http://localhost:5173/debug
- **RPC:** http://localhost:8000/rpc
- **Horizon:** http://localhost:8000

---

**Estado:** 🟢 Todo funcionando correctamente

Para más detalles sobre el desarrollo frontend, ver:
- `docs/ARCHIVOS_CLAVE_FRONTEND.md`
- `docs/RESUMEN_COMPLETO_FASE_3.md`
