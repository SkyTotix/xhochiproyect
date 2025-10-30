/// CarbonToken - Contrato de Token Fungible CARBONXO (CXO)
/// 
/// Este contrato representa la unidad monetaria de tokenización de carbono:
/// 1 CXO = 1 Tonelada de CO2e
/// 
/// Implementa la interfaz de token fungible de Soroban para permitir
/// acuñación, transferencias y consultas de balance de tokens CARBONXO.

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, contractevent, Address, Env};

#[contract]
pub struct CarbonToken;

/// Errores del contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum TokenError {
    /// El contrato no ha sido inicializado
    NotInitialized = 1,
    /// Intentó hacer una operación no autorizada (solo admin puede acuñar)
    Unauthorized = 2,
    /// Balance insuficiente para la transferencia
    InsufficientBalance = 3,
    /// Cantidad de tokens inválida (<= 0)
    InvalidAmount = 4,
    /// Asignación insuficiente para transferir en nombre del dueño
    InsufficientAllowance = 5,
}

/// Eventos del contrato
#[contractevent]
#[derive(Clone)]
pub struct MintEvent {
    /// Dirección del receptor
    pub to: Address,
    /// Cantidad acuñada
    pub amount: i128,
}

/// Evento de transferencia de tokens
#[contractevent]
#[derive(Clone)]
pub struct TransferEvent {
    /// Dirección del remitente
    pub from: Address,
    /// Dirección del receptor
    pub to: Address,
    /// Cantidad transferida
    pub amount: i128,
}

/// Evento de aprobación de gasto delegado
#[contractevent]
#[derive(Clone)]
pub struct ApprovalEvent {
    /// Dirección del propietario
    pub owner: Address,
    /// Dirección autorizada para gastar
    pub spender: Address,
    /// Cantidad autorizada
    pub amount: i128,
}

/// Claves para el almacenamiento
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Dirección del administrador (Instance Storage)
    Admin,
    /// Balance de tokens por dirección (Persistent Storage)
    Balance(Address),
    /// Asignación de gasto delegado (Persistent Storage)
    /// Mapea (owner, spender) -> amount
    Allowance(Address, Address),
}

#[contractimpl]
impl CarbonToken {
    /// Inicializa el contrato de token CARBONXO
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `admin` - Dirección del administrador con permisos de acuñación
    /// 
    /// # Comportamiento
    /// Establece el nombre 'CARBONXO', símbolo 'CXO' y guarda el admin.
    pub fn initialize(env: Env, admin: Address) -> Result<(), TokenError> {
        // Verificar que no ha sido inicializado ya
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(TokenError::NotInitialized);
        }

        // Guardar el admin en Instance Storage
        env.storage().instance().set(&DataKey::Admin, &admin);

        Ok(())
    }

    /// Acuña nuevos tokens CARBONXO
    /// 
    /// Solo el admin puede acuñar tokens.
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `to` - Dirección que recibirá los tokens
    /// * `amount` - Cantidad de tokens a acuñar
    /// 
    /// # Errores
    /// * `TokenError::Unauthorized` si el llamador no es el admin
    /// * `TokenError::InvalidAmount` si amount <= 0
    /// * `TokenError::NotInitialized` si el contrato no ha sido inicializado
    /// 
    /// # Emite
    /// * `MintEvent` con los datos de la acuñación
    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), TokenError> {
        // ✅ AUTORIZACIÓN: Solo el admin puede acuñar
        Self::require_admin(&env)?;

        // ✅ VALIDACIÓN: La cantidad debe ser positiva
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        // Incrementar el balance de 'to' en Persistent Storage
        let current_balance = Self::get_balance(&env, &to);
        let new_balance = current_balance + amount;
        Self::set_balance(&env, &to, new_balance);

        // ✅ EMITIR EVENTO
        MintEvent { to, amount }.publish(&env);

        Ok(())
    }

    /// Transfiere tokens entre direcciones
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `from` - Dirección del remitente
    /// * `to` - Dirección del receptor
    /// * `amount` - Cantidad de tokens a transferir
    /// 
    /// # Errores
    /// * `TokenError::Unauthorized` si 'from' no está autorizado
    /// * `TokenError::InsufficientBalance` si 'from' no tiene suficientes tokens
    /// * `TokenError::InvalidAmount` si amount <= 0
    /// 
    /// # Emite
    /// * `TransferEvent` con los datos de la transferencia
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), TokenError> {
        // ✅ AUTORIZACIÓN: 'from' debe firmar la transacción
        from.require_auth();

        // ✅ VALIDACIÓN: La cantidad debe ser positiva
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        // Verificar balance suficiente
        let from_balance = Self::get_balance(&env, &from);
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        // Actualizar balances
        Self::set_balance(&env, &from, from_balance - amount);
        
        let to_balance = Self::get_balance(&env, &to);
        Self::set_balance(&env, &to, to_balance + amount);

        // ✅ EMITIR EVENTO
        TransferEvent { from, to, amount }.publish(&env);

        Ok(())
    }

    /// Consulta el balance de tokens de una dirección
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `id` - Dirección del usuario
    /// 
    /// # Retorna
    /// `i128` - Balance de tokens CARBONXO
    pub fn balance(env: Env, id: Address) -> i128 {
        Self::get_balance(&env, &id)
    }

    /// Aprueba a un operador para gastar tokens en nombre del dueño
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `from` - Dirección del dueño (propietario de los tokens)
    /// * `spender` - Dirección del operador autorizado
    /// * `amount` - Cantidad de tokens autorizados
    /// 
    /// # Errores
    /// * `TokenError::InvalidAmount` si amount < 0
    /// 
    /// # Emite
    /// * `ApprovalEvent` con los datos de la aprobación
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) -> Result<(), TokenError> {
        // ✅ AUTORIZACIÓN: Solo el dueño puede aprobar gastos
        from.require_auth();

        // ✅ VALIDACIÓN: La cantidad no debe ser negativa
        if amount < 0 {
            return Err(TokenError::InvalidAmount);
        }

        // Almacenar la aprobación en Persistent Storage
        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        env.storage().persistent().set(&allowance_key, &amount);

        // ✅ EMITIR EVENTO
        ApprovalEvent {
            owner: from,
            spender,
            amount,
        }
        .publish(&env);

        Ok(())
    }

    /// Consulta la cantidad de tokens que un operador puede gastar en nombre del dueño
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `from` - Dirección del dueño
    /// * `spender` - Dirección del operador
    /// 
    /// # Retorna
    /// `i128` - Cantidad de tokens autorizados (0 si no existe aprobación)
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let allowance_key = DataKey::Allowance(from, spender);
        env.storage().persistent().get(&allowance_key).unwrap_or(0)
    }

    /// Transfiere tokens desde una dirección a otra en nombre del dueño
    /// 
    /// El operador (spender) debe haber sido previamente aprobado por el dueño (from)
    /// y tener suficiente asignación.
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `spender` - Dirección del operador autorizado (firmante de la transacción)
    /// * `from` - Dirección del dueño (remitente de los tokens)
    /// * `to` - Dirección del receptor
    /// * `amount` - Cantidad de tokens a transferir
    /// 
    /// # Errores
    /// * `TokenError::Unauthorized` si 'spender' no está autenticado
    /// * `TokenError::InsufficientBalance` si 'from' no tiene suficientes tokens
    /// * `TokenError::InsufficientAllowance` si no hay suficiente asignación
    /// * `TokenError::InvalidAmount` si amount <= 0
    /// 
    /// # Emite
    /// * `TransferEvent` con los datos de la transferencia
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), TokenError> {
        // ✅ AUTORIZACIÓN: El operador debe firmar la transacción
        spender.require_auth();

        // ✅ VALIDACIÓN: La cantidad debe ser positiva
        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        // Verificar balance suficiente del dueño
        let from_balance = Self::get_balance(&env, &from);
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        // Verificar asignación suficiente del operador
        let current_allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if current_allowance < amount {
            return Err(TokenError::InsufficientAllowance);
        }

        // Actualizar balances
        Self::set_balance(&env, &from, from_balance - amount);
        
        let to_balance = Self::get_balance(&env, &to);
        Self::set_balance(&env, &to, to_balance + amount);

        // Reducir la asignación
        let new_allowance = current_allowance - amount;
        let allowance_key = DataKey::Allowance(from.clone(), spender);
        env.storage().persistent().set(&allowance_key, &new_allowance);

        // ✅ EMITIR EVENTO
        TransferEvent { from, to, amount }.publish(&env);

        Ok(())
    }

    // =========================================================================
    // Funciones privadas auxiliares
    // =========================================================================

    /// Verifica que el llamador sea el admin
    fn require_admin(env: &Env) -> Result<(), TokenError> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin)
            .ok_or(TokenError::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    /// Obtiene el balance de una dirección
    fn get_balance(env: &Env, address: &Address) -> i128 {
        let key = DataKey::Balance(address.clone());
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Establece el balance de una dirección
    fn set_balance(env: &Env, address: &Address, balance: i128) {
        let key = DataKey::Balance(address.clone());
        env.storage().persistent().set(&key, &balance);
    }
}

