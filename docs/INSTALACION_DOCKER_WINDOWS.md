# Guía de Instalación de Docker Desktop para Windows

## 📋 Requisitos Previos

Antes de instalar Docker, asegúrate de tener:

### 1. Requisitos del Sistema
- ✅ Windows 10 64-bit: Pro, Enterprise o Education (build 19041 o superior)
- ✅ Windows 11 64-bit
- ✅ Procesador de 64 bits con virtualización habilitada
- ✅ Al menos 4 GB de RAM
- ✅ BIOS con virtualización habilitada

### 2. Verificar Virtualización en BIOS

**Paso 1:** Reinicia tu computadora y entra a BIOS/UEFI
- Presiona `F2`, `F12`, `Del` o `Esc` durante el arranque
- (La tecla varía según el fabricante)

**Paso 2:** Busca las siguientes opciones y habilítalas:
- `Virtualization Technology (VT-x)` o `AMD-V`
- `Hyper-V`
- `VT-d` (opcional)

**Paso 3:** Guarda y sal (Save & Exit)

## 🚀 Instalación de Docker Desktop

### Paso 1: Descargar Docker Desktop

1. **Visita el sitio oficial:**
   ```
   https://www.docker.com/products/docker-desktop/
   ```

2. **Click en "Download for Windows"**
   - Se descargará el archivo `Docker Desktop Installer.exe`
   - Tamaño aproximado: ~500 MB

### Paso 2: Instalar Docker Desktop

1. **Ejecuta el instalador:**
   - Haz doble click en `Docker Desktop Installer.exe`
   - Click en "Ok" en el diálogo de control de cuentas de usuario (UAC)

2. **Configuración de instalación:**
   - ✅ Marca "Use WSL 2 instead of Hyper-V" (recomendado)
   - ✅ Marca "Add shortcut to desktop" (opcional)
   - Click en "Ok"

3. **Espera la instalación:**
   - El proceso tomará 5-10 minutos
   - Se descargará e instalará WSL 2 si es necesario

4. **Reiniciar:**
   - El instalador pedirá reiniciar la computadora
   - Haz click en "Close and restart"

### Paso 3: Configuración Inicial

1. **Después del reinicio:**
   - Docker Desktop se iniciará automáticamente
   - Aparecerá un diálogo de "Terms and Conditions"
   - Click en "Accept"

2. **Tutorial de bienvenida (opcional):**
   - Puedes hacer click en "Skip tutorial"

3. **Espera a que Docker esté listo:**
   - Verás una notificación: "Docker Desktop is running"
   - El ícono de Docker en la bandeja del sistema estará en verde 🟢

### Paso 4: Verificar Instalación

**Ejecuta en PowerShell o CMD:**

```powershell
# Verificar que Docker está instalado
docker --version

# Deberías ver algo como:
# Docker version 24.x.x, build xxxxx
```

```powershell
# Verificar que Docker está corriendo
docker ps

# Deberías ver una lista vacía sin errores
```

## 🔧 Configuración Adicional

### Configurar WSL 2 (Si no está instalado)

Si la instalación te pidió instalar WSL 2, ejecuta:

```powershell
# Instalar WSL 2
wsl --install

# Verificar WSL 2
wsl --list --verbose

# Deberías ver:
# * NAME                   STATE           VERSION
# * Ubuntu                 Running         2
```

### Optimizar Docker Desktop

1. **Abre Docker Desktop**
2. **Click en el ícono de Settings (⚙️)**
3. **En la sección "Resources":**
   - **Memory:** 4-8 GB (recomendado 6 GB)
   - **CPUs:** 2-4 núcleos
   - **Disk image size:** 60 GB (ajusta según tus necesidades)

4. **Click en "Apply & Restart"**

## 🧪 Probar Docker

Ejecuta el siguiente comando para verificar que todo funciona:

```powershell
docker run hello-world
```

**Salida esperada:**
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

## 🐛 Solución de Problemas Comunes

### Error: "WSL 2 installation is incomplete"

**Solución:**
```powershell
# Instalar WSL 2 manualmente
wsl --install

# Actualizar WSL 2 a la última versión
wsl --update

# Reiniciar Docker Desktop
```

### Error: "Hardware assisted virtualization and data execution protection must be enabled"

**Solución:**
1. Verifica que la virtualización esté habilitada en BIOS
2. Verifica que Hyper-V esté habilitado:
   ```powershell
   # Abrir "Windows Features"
   optionalfeatures.exe
   
   # Marcar "Windows Subsystem for Linux"
   # Marcar "Virtual Machine Platform"
   ```

### Error: "Docker Desktop is starting" no avanza

**Solución:**
1. Cierra Docker Desktop completamente
2. Abre PowerShell como Administrador
3. Ejecuta:
   ```powershell
   # Reiniciar servicio de Docker
   net stop com.docker.service
   net start com.docker.service
   
   # O reinstalar Docker Desktop
   ```

### Docker Desktop no inicia

**Solución:**
```powershell
# Verificar logs
docker info

# Si no funciona, reinstalar WSL 2:
wsl --unregister
wsl --install
```

## ✅ Verificación Final

Después de instalar Docker, verifica lo siguiente:

### 1. Docker está corriendo

```powershell
docker ps
```

### 2. Version de Stellar CLI compatible

```powershell
stellar --version
```

### 3. Compilar proyectos Stellar

```powershell
# En el directorio de tu proyecto
cd carbon-xochi

# Compilar contratos y generar clientes
stellar scaffold build
```

## 📊 Recursos de Memoria

Docker Desktop usa recursos del sistema:

- **Mínimo:** 2 GB RAM
- **Recomendado:** 4-8 GB RAM
- **Para desarrollo pesado:** 8+ GB RAM

**Nota:** Docker puede pausarse automáticamente si no se usa.

## 🎯 Próximos Pasos

Una vez instalado Docker:

1. **Verifica la instalación:**
   ```powershell
   docker --version
   ```

2. **Compila tus contratos:**
   ```powershell
   cd carbon-xochi
   stellar scaffold build
   ```

3. **Inicia el desarrollo:**
   ```powershell
   npm run dev
   ```

## 📚 Recursos Adicionales

- **Documentación oficial:** https://docs.docker.com/desktop/install/windows-install/
- **Guía de WSL 2:** https://learn.microsoft.com/en-us/windows/wsl/install
- **Troubleshooting:** https://docs.docker.com/desktop/troubleshoot/topics/

## 💡 Tips

1. **Auto-start:** Docker Desktop inicia automáticamente con Windows
2. **Actualizaciones:** Docker Desktop se actualiza automáticamente
3. **Recursos:** Si Docker usa mucha memoria, ajusta en Settings → Resources
4. **Restart:** Si algo no funciona, reinicia Docker Desktop primero

---

**¡Docker Desktop listo!** 🐳

Ahora puedes continuar con:
```bash
cd carbon-xochi
stellar scaffold build
npm run dev
```
