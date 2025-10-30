/// CarbonCertifier - Contrato de Certificación de Carbono
/// 
/// Este contrato gestiona la tokenización de créditos de carbono basados en 
/// la metodología CONADESUCA para la reducción de emisiones por caña de azúcar
/// sin quemar en Xochitepec, Morelos.

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, contractevent, Address, BytesN, Env, Vec, IntoVal};

#[contract]
pub struct CarbonCertifier;

// Cliente simple para CarbonToken - usaremos invoke_contract directamente

/// Errores del contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    /// El certificado ya existe en el almacenamiento
    AlreadyExists = 1,
    /// El certificado no se encontró en el almacenamiento
    NotFound = 2,
    /// Datos de entrada inválidos (hectares o CO2e <= 0)
    InvalidInput = 3,
    /// El llamador no es el propietario del certificado
    NotOwner = 4,
    /// El llamador no está autorizado (no es admin)
    NotAuthorized = 5,
}

/// Eventos del contrato
#[contractevent]
#[derive(Clone)]
pub struct CertificateMintedEvent {
    /// ID único del certificado acuñado
    pub certificate_id: u32,
    /// Dirección del agricultor beneficiario
    pub farmer: Address,
    /// Dirección del verificador autorizado
    pub verifier: Address,
    /// Toneladas de CO2e acuñadas
    pub tons_minted: u128,
    /// Timestamp de la acuñación
    pub timestamp: u64,
}

/// Evento de transferencia de certificado NFT
#[contractevent]
#[derive(Clone)]
pub struct CertificateTransferredEvent {
    /// ID único del certificado transferido
    pub certificate_id: u32,
    /// Dirección del propietario anterior
    pub from: Address,
    /// Dirección del nuevo propietario
    pub to: Address,
}

/// Evento de quema (retiro) de certificado de carbono
#[contractevent]
#[derive(Clone)]
pub struct CertificateBurnedEvent {
    /// ID único del certificado quemado
    pub certificate_id: u32,
    /// Dirección que quemó el certificado
    pub burned_by: Address,
    /// Toneladas de CO2e retiradas
    pub co2e_tons_retired: u128,
}

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

/// Claves para el almacenamiento
/// 
/// Incluye tanto Persistent Storage (para certificados e índices) como Instance Storage (para contadores)
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Almacenamiento persistente de certificados por ID (u32)
    Certificates(u32),
    /// Contador total de certificados en Instance Storage
    TotalCertificates,
    /// Contador total de CO2e acuñado en Instance Storage
    TotalCO2e,
    /// Índice de certificados por agricultor (Persistent Storage)
    FarmerCertList(Address),
    /// Índice de certificados por verificador (Persistent Storage)
    VerifierCertList(Address),
    /// Propietario actual de cada certificado NFT (Persistent Storage)
    CertificateOwner(u32),
    /// ID del contrato de token fungible CARBONXO (Instance Storage)
    TokenContractId,
    /// Dirección del administrador del contrato (Instance Storage)
    Admin,
}

/// Datos de verificación on-chain del certificado de carbono
/// 
/// Estructura inmutable que almacena la información esencial de un certificado
/// de verificación de reducción de emisiones CO2e, basado en la metodología CONADESUCA.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationRecord {
    /// Dirección del verificador/autoridad (Ingenio Emiliano Zapata/ULPCA)
    pub verifier_address: Address,
    
    /// Dirección del agricultor beneficiario del certificado
    pub farmer_address: Address,
    
    /// Superficie No Quemada (SQ) en hectáreas - Variable clave para el cálculo de CO2e
    pub hectares_not_burned: u32,
    
    /// Toneladas de CO2e reducidas (1 unidad = 1 tonelada de CO2e)
    pub co2e_tons: u128,
    
    /// Hash SHA-256 del informe MRV (Measurement, Reporting, Verification) off-chain
    /// Garantiza la inmutabilidad de la evidencia del certificado
    pub metadata_hash: BytesN<32>,
}

#[contractimpl]
impl CarbonCertifier {
    /// Constructor del contrato
    /// Inicializa el contrato CarbonCertifier
    pub fn __constructor(env: &Env) {
        // Constructor vacío - el admin se configura con initialize()
    }

    /// Inicializa el contrato con un administrador
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `admin` - Dirección del administrador
    /// 
    /// # Errores
    /// * `ContractError::AlreadyExists` si el contrato ya ha sido inicializado
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        // Verificar que no ha sido inicializado
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyExists);
        }

        // Guardar el admin en Instance Storage
        env.storage().instance().set(&DataKey::Admin, &admin);

        Ok(())
    }

    /// Obtiene la dirección del administrador del contrato
    /// 
    /// # Retorna
    /// `Address` - La dirección del administrador
    /// 
    /// # Errores
    /// * `ContractError::NotFound` si el contrato no ha sido inicializado
    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        match env.storage().instance().get(&DataKey::Admin) {
            Some(admin) => Ok(admin),
            None => Err(ContractError::NotFound),
        }
    }

    /// Obtiene los datos de un certificado de carbono por su ID
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `certificate_id` - ID único del certificado (u32)
    /// 
    /// # Retorna
    /// `VerificationRecord` - Los datos completos del certificado
    /// 
    /// # Errores
    /// * `ContractError::NotFound` si el certificado no existe
    pub fn get_certificate_data(
        env: Env,
        certificate_id: u32,
    ) -> Result<VerificationRecord, ContractError> {
        let key = DataKey::Certificates(certificate_id);
        
        // Intentar obtener el certificado del almacenamiento persistente
        match env.storage().persistent().get(&key) {
            Some(record) => Ok(record),
            None => Err(ContractError::NotFound),
        }
    }

    /// Obtiene el propietario actual de un certificado NFT
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `certificate_id` - ID único del certificado (u32)
    /// 
    /// # Retorna
    /// `Address` - La dirección del propietario actual
    /// 
    /// # Errores
    /// * `ContractError::NotFound` si el certificado no existe
    pub fn get_certificate_owner(
        env: Env,
        certificate_id: u32,
    ) -> Result<Address, ContractError> {
        // Verificar que el certificado existe
        let cert_key = DataKey::Certificates(certificate_id);
        if env.storage().persistent().get::<DataKey, VerificationRecord>(&cert_key).is_none() {
            return Err(ContractError::NotFound);
        }
        
        // Obtener el propietario
        let owner_key = DataKey::CertificateOwner(certificate_id);
        match env.storage().persistent().get(&owner_key) {
            Some(owner) => Ok(owner),
            None => Err(ContractError::NotFound),
        }
    }

    /// Transfiere la propiedad de un certificado NFT a otra dirección
    /// 
    /// Solo puede ser invocado por el propietario actual del certificado.
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `certificate_id` - ID único del certificado (u32)
    /// * `from` - Dirección del propietario actual
    /// * `to` - Dirección del nuevo propietario
    /// 
    /// # Retorna
    /// `()` - Éxito
    /// 
    /// # Errores
    /// * `ContractError::NotFound` si el certificado no existe
    /// * `ContractError::NotOwner` si 'from' no es el propietario actual
    /// 
    /// # Autorización
    /// Requiere autenticación de `from`
    pub fn transfer_certificate(
        env: Env,
        certificate_id: u32,
        from: Address,
        to: Address,
    ) -> Result<(), ContractError> {
        // ✅ AUTORIZACIÓN CRÍTICA: Solo el propietario actual puede transferir
        from.require_auth();

        // Verificar que el certificado existe
        let cert_key = DataKey::Certificates(certificate_id);
        if env.storage().persistent().get::<DataKey, VerificationRecord>(&cert_key).is_none() {
            return Err(ContractError::NotFound);
        }

        // Obtener el propietario actual
        let owner_key = DataKey::CertificateOwner(certificate_id);
        let current_owner: Address = env.storage().persistent().get(&owner_key)
            .ok_or(ContractError::NotFound)?;

        // ✅ VERIFICAR PROPIEDAD: 'from' debe ser el propietario actual
        if current_owner != from {
            return Err(ContractError::NotOwner);
        }

        // Transferir la propiedad
        env.storage().persistent().set(&owner_key, &to);

        // ✅ EMITIR EVENTO: Notificar la transferencia del certificado
        CertificateTransferredEvent {
            certificate_id,
            from,
            to,
        }
        .publish(&env);

        Ok(())
    }

    /// Quema (retira) un certificado de carbono NFT
    /// 
    /// Solo el propietario actual del certificado puede quemarlo.
    /// Quemar un certificado es el acto final de compensación de carbono.
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `certificate_id` - ID del certificado a quemar
    /// 
    /// # Errores
    /// * `ContractError::NotFound` si el certificado no existe
    /// * `ContractError::NotOwner` si el llamador no es el propietario
    /// 
    /// # Emite
    /// * `CertificateBurnedEvent` con los datos de la quema
    pub fn burn_certificate(env: Env, certificate_id: u32) -> Result<(), ContractError> {
        // Verificar que el certificado existe y obtener el record
        let cert_key = DataKey::Certificates(certificate_id);
        let record: VerificationRecord = env.storage().persistent().get(&cert_key)
            .ok_or(ContractError::NotFound)?;

        // Obtener el propietario actual
        let owner_key = DataKey::CertificateOwner(certificate_id);
        let owner: Address = env.storage().persistent().get(&owner_key)
            .ok_or(ContractError::NotFound)?;

        // ✅ AUTORIZACIÓN: Solo el propietario puede quemar
        owner.require_auth();

        // Guardar el CO2e antes de eliminar el record
        let co2e_tons = record.co2e_tons;

        // ✅ ELIMINAR PROPIETARIO del Persistent Storage
        env.storage().persistent().remove(&owner_key);

        // ✅ ELIMINAR VERIFICATION RECORD del Persistent Storage
        env.storage().persistent().remove(&cert_key);

        // ✅ ELIMINAR de FarmerCertList (índice del agricultor)
        Self::remove_from_index(&env, &record.farmer_address, certificate_id, true);

        // ✅ ELIMINAR de VerifierCertList (índice del verificador)
        Self::remove_from_index(&env, &record.verifier_address, certificate_id, false);

        // ✅ ACTUALIZAR CONTADORES GLOBALES
        Self::decrement_certificate_count(&env);
        Self::subtract_co2e_from_total(&env, co2e_tons);

        // ✅ EMITIR EVENTO: Notificar la quema del certificado
        CertificateBurnedEvent {
            certificate_id,
            burned_by: owner,
            co2e_tons_retired: co2e_tons,
        }
        .publish(&env);

        Ok(())
    }

    /// Establece el ID del contrato de token fungible CARBONXO
    /// 
    /// Solo puede ser invocado por el administrador del contrato.
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `admin` - Dirección del administrador
    /// * `token_id` - Address del contrato CarbonToken
    /// 
    /// # Errores
    /// * `ContractError::NotAuthorized` si el llamador no es el admin
    pub fn set_token_contract_id(
        env: Env,
        admin: Address,
        token_id: Address,
    ) -> Result<(), ContractError> {
        // ✅ AUTORIZACIÓN: Solo el admin puede configurar
        admin.require_auth();

        // Obtener el admin guardado
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin)
            .ok_or(ContractError::NotAuthorized)?;

        // Verificar que el admin coincida
        if stored_admin != admin {
            return Err(ContractError::NotAuthorized);
        }

        // Guardar el ID del contrato de token
        env.storage().instance().set(&DataKey::TokenContractId, &token_id);

        Ok(())
    }

    /// Acuña un nuevo certificado de carbono NFT
    /// 
    /// Solo puede ser invocado por la dirección del verificador autorizado.
    /// Almacena el certificado en Persistent Storage para garantizar su longevidad.
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `certificate_id` - ID único del certificado (u32)
    /// * `record` - Los datos completos del certificado de verificación
    /// 
    /// # Retorna
    /// `()` - Éxito
    /// 
    /// # Errores
    /// * `ContractError::AlreadyExists` si el certificado ya existe
    /// * `ContractError::InvalidInput` si los datos son inválidos (hectares o CO2e <= 0)
    /// 
    /// # Autorización
    /// Requiere autenticación de `record.verifier_address`
    pub fn mint_certificate(
        env: Env,
        certificate_id: u32,
        record: VerificationRecord,
    ) -> Result<(), ContractError> {
        // ✅ AUTORIZACIÓN CRÍTICA: Solo el verificador autorizado puede acuñar certificados
        record.verifier_address.require_auth();

        // ✅ VALIDACIÓN DE DATOS: Verificar que los datos de entrada sean válidos
        if record.hectares_not_burned == 0 {
            return Err(ContractError::InvalidInput);
        }
        if record.co2e_tons == 0 {
            return Err(ContractError::InvalidInput);
        }

        // Verificar que el certificado no existe ya
        let key = DataKey::Certificates(certificate_id);
        if env.storage().persistent().get::<DataKey, VerificationRecord>(&key).is_some() {
            return Err(ContractError::AlreadyExists);
        }

        // Almacenar el certificado en Persistent Storage
        // El uso de Persistent Storage evita state bloat en Instance Storage
        env.storage().persistent().set(&key, &record);

        // Actualizar contadores globales
        Self::increment_certificate_count(&env);
        Self::add_co2e_to_total(&env, record.co2e_tons);

        // Indexar el certificado por agricultor y verificador
        Self::add_to_index(&env, record.farmer_address.clone(), certificate_id, true);
        Self::add_to_index(&env, record.verifier_address.clone(), certificate_id, false);

        // ✅ ESTABLECER PROPIETARIO INICIAL: El agricultor es el propietario inicial del NFT
        let owner_key = DataKey::CertificateOwner(certificate_id);
        env.storage().persistent().set(&owner_key, &record.farmer_address);

        // ✅ INVOCACIÓN CROSS-CONTRACT: Acuñar tokens CXO
        if let Some(token_contract_id) = env.storage().instance().get(&DataKey::TokenContractId) {
            // Convertir u128 a i128 para la llamada
            let amount = record.co2e_tons as i128;
            
            // Invocar la función mint del contrato CarbonToken
            // Crear los argumentos como un Vec<Val>
            let mut args = soroban_sdk::Vec::new(&env);
            args.push_back(record.farmer_address.clone().into_val(&env));
            args.push_back(amount.into_val(&env));
            let _: Result<(), soroban_sdk::Error> = env.invoke_contract(
                &token_contract_id,
                &soroban_sdk::symbol_short!("mint"),
                args,
            );
        }

        // Obtener timestamp de la acuñación
        let timestamp = env.ledger().timestamp();

        // ✅ EMITIR EVENTO: Notificar el acuñamiento del certificado
        CertificateMintedEvent {
            certificate_id,
            farmer: record.farmer_address,
            verifier: record.verifier_address,
            tons_minted: record.co2e_tons,
            timestamp,
        }
        .publish(&env);

        Ok(())
    }

    /// Incrementa el contador total de certificados acuñados
    /// 
    /// Función privada que actualiza el contador en Instance Storage
    /// Usa Instance Storage porque es un dato pequeño y permanente
    fn increment_certificate_count(env: &Env) {
        let key = DataKey::TotalCertificates;
        let current_count: u32 = env.storage().instance().get(&key).unwrap_or(0);
        env.storage().instance().set(&key, &(current_count + 1));
    }

    /// Suma CO2e al total acumulado de créditos de carbono acuñados
    /// 
    /// Función privada que actualiza el contador de CO2e en Instance Storage
    /// Usa Instance Storage porque es un dato pequeño y permanente
    fn add_co2e_to_total(env: &Env, co2e_tons: u128) {
        let key = DataKey::TotalCO2e;
        let current_total: u128 = env.storage().instance().get(&key).unwrap_or(0);
        env.storage().instance().set(&key, &(current_total + co2e_tons));
    }

    /// Decrementa el contador total de certificados acuñados
    /// 
    /// Función privada que actualiza el contador en Instance Storage al quemar un certificado
    fn decrement_certificate_count(env: &Env) {
        let key = DataKey::TotalCertificates;
        let current_count: u32 = env.storage().instance().get(&key).unwrap_or(0);
        if current_count > 0 {
            env.storage().instance().set(&key, &(current_count - 1));
        }
    }

    /// Resta CO2e del total acumulado de créditos de carbono acuñados
    /// 
    /// Función privada que actualiza el contador de CO2e en Instance Storage al quemar un certificado
    fn subtract_co2e_from_total(env: &Env, co2e_tons: u128) {
        let key = DataKey::TotalCO2e;
        let current_total: u128 = env.storage().instance().get(&key).unwrap_or(0);
        if current_total >= co2e_tons {
            env.storage().instance().set(&key, &(current_total - co2e_tons));
        }
    }

    /// Elimina un ID de certificado de una lista de índice de manera eficiente
    /// 
    /// Usa swap y pop para eliminar en O(1) en lugar de O(n)
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `actor_address` - Dirección del actor (agricultor o verificador)
    /// * `certificate_id` - ID del certificado a eliminar
    /// * `is_farmer` - Si es true, elimina de FarmerCertList; si es false, de VerifierCertList
    fn remove_from_index(env: &Env, actor_address: &Address, certificate_id: u32, is_farmer: bool) {
        // Determinar la clave según el tipo de actor
        let list_key = if is_farmer {
            DataKey::FarmerCertList(actor_address.clone())
        } else {
            DataKey::VerifierCertList(actor_address.clone())
        };

        // Obtener la lista actual (si existe)
        if let Some(mut cert_list) = env.storage().persistent().get::<DataKey, Vec<u32>>(&list_key) {
            // Buscar el índice del certificado en la lista
            let mut found_index: Option<u32> = None;
            for i in 0..cert_list.len() {
                if cert_list.get(i).unwrap() == certificate_id {
                    found_index = Some(i as u32);
                    break;
                }
            }

            // Si encontramos el certificado, eliminarlo eficientemente
            if let Some(index) = found_index {
                let list_len = cert_list.len() as u32;
                let last_index = list_len - 1;
                
                // Si no es el último elemento, intercambiar con el último
                if index < last_index {
                    let last_cert_id = cert_list.get(last_index).unwrap();
                    cert_list.set(index, last_cert_id);
                }
                
                // Eliminar el último elemento (pop)
                cert_list.pop_back();
                
                // Guardar la lista actualizada
                env.storage().persistent().set(&list_key, &cert_list);
            }
        }
    }

    /// Obtiene el total de certificados de carbono acuñados
    /// 
    /// # Retorna
    /// `u32` - El número total de certificados acuñados
    pub fn get_total_certificates(env: Env) -> u32 {
        let key = DataKey::TotalCertificates;
        env.storage().instance().get(&key).unwrap_or(0)
    }

    /// Obtiene el total de toneladas de CO2e acuñadas
    /// 
    /// # Retorna
    /// `u128` - El total de toneladas de CO2e acuñadas
    pub fn get_total_co2e(env: Env) -> u128 {
        let key = DataKey::TotalCO2e;
        env.storage().instance().get(&key).unwrap_or(0)
    }

    /// Añade un certificado a la lista de un actor (agricultor o verificador)
    /// 
    /// Función privada que actualiza los índices en Persistent Storage
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `actor_address` - La dirección del actor (farmer o verifier)
    /// * `certificate_id` - El ID del certificado a añadir
    /// * `is_farmer` - true si es agricultor, false si es verificador
    fn add_to_index(env: &Env, actor_address: Address, certificate_id: u32, is_farmer: bool) {
        let key = if is_farmer {
            DataKey::FarmerCertList(actor_address)
        } else {
            DataKey::VerifierCertList(actor_address)
        };

        // Obtener la lista existente o crear una nueva
        let mut cert_list: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        
        // Añadir el nuevo ID al final de la lista
        cert_list.push_back(certificate_id);
        
        // Guardar la lista actualizada en Persistent Storage
        env.storage().persistent().set(&key, &cert_list);
    }

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
    
    /// Función privada para ordenar certificados por diferentes criterios
    fn sort_certificates(env: &Env, cert_ids: &Vec<u32>, sort_by: SortBy, is_descending: bool) -> Vec<u32> {
        // Si la lista está vacía o tiene un solo elemento, retornar tal cual
        if cert_ids.len() <= 1 {
            let mut result = Vec::new(env);
            for id in cert_ids.iter() {
                result.push_back(id);
            }
            return result;
        }
        
        // Crear una lista de pares (ID, valor_de_ordenamiento)
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
        
        // Bubble sort (funciona en no_std)
        let len = pairs.len();
        for i in 0..len {
            for j in 0..(len - i - 1) {
                let should_swap = if is_descending {
                    pairs.get(j).unwrap().1 < pairs.get(j + 1).unwrap().1
                } else {
                    pairs.get(j).unwrap().1 > pairs.get(j + 1).unwrap().1
                };
                
                if should_swap {
                    // Intercambiar elementos
                    let temp = pairs.get(j).unwrap().clone();
                    pairs.set(j, pairs.get(j + 1).unwrap().clone());
                    pairs.set(j + 1, temp);
                }
            }
        }
        
        // Extraer solo los IDs ordenados
        let mut sorted_ids = Vec::new(env);
        for pair in pairs.iter() {
            sorted_ids.push_back(pair.0);
        }
        
        sorted_ids
    }

    /// Lista los IDs de certificados asociados a un verificador específico (con paginación)
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `verifier_address` - La dirección del verificador
    /// * `offset` - El punto de inicio de la paginación (0-indexed)
    /// * `limit` - El número máximo de IDs a devolver
    /// 
    /// # Retorna
    /// `(Vec<u32>, u32)` - Tupla que contiene (lista paginada de IDs, total de certificados)
    pub fn list_certificates_by_verifier(
        env: Env,
        verifier_address: Address,
        offset: u32,
        limit: u32,
    ) -> (Vec<u32>, u32) {
        let key = DataKey::VerifierCertList(verifier_address);
        let all_certs = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        
        Self::paginate_cert_list(&env, &all_certs, offset, limit)
    }
    
    /// Filtra certificados de un agricultor por rango de CO2e (con paginación)
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `farmer_address` - La dirección del agricultor
    /// * `min_tons` - Toneladas mínimas de CO2e (inclusive)
    /// * `max_tons` - Toneladas máximas de CO2e (inclusive)
    /// * `offset` - El punto de inicio de la paginación (0-indexed)
    /// * `limit` - El número máximo de IDs a devolver
    /// 
    /// # Retorna
    /// `(Vec<u32>, u32)` - Tupla que contiene (IDs filtrados y paginados, total de certificados filtrados)
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
        
        // Filtrar certificados por rango de CO2e
        let filtered_ids = Self::filter_by_co2e(&env, &all_certs, min_tons, max_tons);
        
        Self::paginate_cert_list(&env, &filtered_ids, offset, limit)
    }
    
    /// Función privada para filtrar certificados por rango de CO2e
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

    /// Función privada auxiliar para paginar listas de certificados
    /// 
    /// # Argumentos
    /// * `env` - El entorno del contrato
    /// * `all_certs` - La lista completa de IDs de certificados
    /// * `offset` - El punto de inicio de la paginación
    /// * `limit` - El número máximo de elementos a devolver
    /// 
    /// # Retorna
    /// `(Vec<u32>, u32)` - Tupla con (elementos paginados, total)
    fn paginate_cert_list(env: &Env, all_certs: &Vec<u32>, offset: u32, limit: u32) -> (Vec<u32>, u32) {
        let total = all_certs.len() as u32;
        
        // Si offset es mayor que el total, retornar lista vacía
        if offset >= total {
            return (Vec::new(env), total);
        }
        
        // Calcular el índice final
        let end = (offset + limit).min(total);
        
        // Crear el Vec paginado
        let mut paginated = Vec::new(env);
        for i in offset..end {
            paginated.push_back(all_certs.get(i).unwrap());
        }
        
        (paginated, total)
    }
}

