# 🚫 Alternativas SIN Usar Wallets Externas

## ✅ Opción 1: Debugger de Scaffold (LO MÁS FÁCIL) ⭐⭐⭐⭐⭐

**Esta es la mejor opción si las wallets no funcionan.**

### Pasos:

1. **Abre el Debugger:**
   ```
   http://localhost:5173/debug/guess_the_number
   ```

2. **Ya está configurado:**
   - ✅ Contratos listados automáticamente
   - ✅ Sin necesidad de wallet externa
   - ✅ Interfaz React moderna

3. **Usa "Simulate":**
   - Llena los campos de la función
   - Haz clic en "Simulate"
   - Ve el resultado sin enviar transacción

### Ventajas:
- ✅ No requiere wallet
- ✅ Ya configurado
- ✅ Interfaz React moderna
- ✅ Ve resultados en tiempo real
- ✅ Perfecto para desarrollo

---

## ⚠️ Opción 2: Stellar Laboratory (NO RECOMENDADO)

**Laboratory NO muestra contratos automáticamente.**

### Limitaciones:
- ❌ Necesitas guardar contratos manualmente
- ❌ No lista tus contratos desplegados
- ❌ Interfaz más compleja

### Si quieres usarlo igual:
1. Ir a `http://localhost:8000/lab`
2. Click en "Simulate Transaction"
3. Usar RPC `simulateTransaction` manualmente

---

## ✅ Opción 2: Stellar CLI desde Terminal ⭐⭐

**Control total desde la línea de comandos.**

### Obtén tu Contract ID:

```bash
# Ya lo tienes del Debugger
CCHM26S5F3NPBKPDB2LYHXS4IHTOWL7ZIZN4GI2LS5S7PCZUQF6KZ2RM
```

### Crear una cuenta de test:

```bash
# Desde el directorio del proyecto
cd carbon-xochi

# Crear una identidad de test
stellar keys generate test-account

# Ver las identidades disponibles
stellar keys list
```

### Invocar función `guess`:

```bash
# Fund tu cuenta primero
stellar contract invoke \
  --id CCHM26S5F3NPBKPDB2LYHXS4IHTOWL7ZIZN4GI2LS5S7PCZUQF6KZ2RM \
  --network standalone \
  --source test-account \
  --fund \
  --method guess \
  --args '[{"type": "u64", "value": "4"}, {"type": "address", "value": "TU_DIRECCION"}]'
```

### Invocar función `admin` (readonly):

```bash
stellar contract invoke \
  --id CCHM26S5F3NPBKPDB2LYHXS4IHTOWL7ZIZN4GI2LS5S7PCZUQF6KZ2RM \
  --network standalone \
  --source test-account \
  --method admin
```

### Ventajas:
- ✅ No requiere wallet
- ✅ Control total
- ✅ Scripteable
- ✅ Perfecto para pruebas automatizadas

---

## ✅ Opción 3: Crear Script Node.js ⭐

**Si quieres algo más programático.**

### Archivo: `test-contract.js`

```javascript
import { Contract, SorobanRpc, Networks } from '@stellar/stellar-sdk';

const contractId = 'CCHM26S5F3NPBKPDB2LYHXS4IHTOWL7ZIZN4GI2LS5S7PCZUQF6KZ2RM';
const network = Networks.STANDALONE;
const rpcUrl = 'http://localhost:8000/rpc';

const server = new SorobanRpc.Server(rpcUrl);

async function testGuess() {
  try {
    // Invocar función readonly (admin)
    const result = await server.getLedgerEntries(contractId);
    console.log('Admin:', result);
    
    // Para funciones que requieren transacción:
    const contract = new Contract(contractId);
    
    // Simular la transacción
    const response = await server.simulateTransaction({
      contract: contractId,
      method: 'guess',
      args: [
        { type: 'u64', value: '4' },
        { type: 'address', value: 'TU_DIRECCION' }
      ]
    });
    
    console.log('Simulation result:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

testGuess();
```

### Ejecutar:

```bash
node test-contract.js
```

---

## ✅ Opción 4: Usar el Debugger "Simulate" Solo ⭐

**Si solo quieres ver cómo funcionarían las transacciones.**

### Ventaja:
- El botón "Simulate" NO requiere wallet conectada
- Verás el resultado de la simulación sin enviar nada

### Limitación:
- No podrás enviar transacciones reales
- Solo sirve para ver qué pasaría

---

## 🎯 Recomendación

### Para Desarrollo Local:

1. **Usa el Debugger de Scaffold** (`http://localhost:5173/debug/guess_the_number`)
   - ⭐⭐⭐⭐⭐ Es la más fácil
   - Ya está configurado
   - Contratos listados automáticamente
   - Usa "Simulate" para probar

2. **Para transacciones reales (cuando funcione la wallet):**
   - Conecta HOT Wallet
   - Usa "Submit" en el Debugger

3. **Para automatización:**
   - Usa Stellar CLI desde terminal
   - Crea scripts Node.js

4. **Para producción/testnet:**
   - Ahí sí necesitarás Freighter o Hot Wallet

---

## 📊 Comparación

| Opción | Facilidad | Requiere Wallet | Interfaz Visual |
|--------|-----------|-----------------|-----------------|
| Stellar Laboratory | ⭐⭐⭐⭐⭐ | ❌ No | ✅ Sí |
| Stellar CLI | ⭐⭐⭐ | ❌ No | ❌ No |
| Script Node.js | ⭐⭐ | ❌ No | ❌ No |
| Debugger Simulate | ⭐⭐⭐⭐⭐ | ❌ No | ✅ Sí |
| Wallet (cuando funciona) | ⭐⭐⭐⭐ | ✅ Sí | ✅ Sí |

---

## 🔥 Paso a Paso Rápido

### Con Laboratory:

```bash
# 1. Abre en tu navegador
http://localhost:8000/lab

# 2. Click en "Smart Contracts"
# 3. Selecciona "guess_the_number"
# 4. Invoca función "admin" (sin argumentos)
# 5. Ve el resultado ✅
```

### Con Terminal:

```bash
# 1. Lista los contratos
stellar contract read \
  --id CCHM26S5F3NPBKPDB2LYHXS4IHTOWL7ZIZN4GI2LS5S7PCZUQF6KZ2RM \
  --network standalone \
  --method admin
```

---

## 💡 Resumen

**No necesitas wallet para desarrollar localmente.**

Las mejores opciones son:
1. ✅ Stellar Laboratory (visual, fácil)
2. ✅ Stellar CLI (terminal, potente)
3. ✅ Script Node.js (personalizable)

**¡Elige la que prefieras y sigue desarrollando!** 🚀

---

## 📚 Recursos

- **Stellar Laboratory:** http://localhost:8000/lab
- **Stellar CLI Docs:** https://developers.stellar.org/docs/build/smart-contracts
- **Stellar SDK Docs:** https://developers.stellar.org/docs/sdks

**¡Hay muchas formas de interactuar con contratos sin wallet!** 🎉

'''''