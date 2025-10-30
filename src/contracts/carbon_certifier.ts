import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
import { rpcUrl } from "./util";
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  standalone: {
    networkPassphrase: "Standalone Network ; February 2017",
    contractId: "CBFZFLYPOHKL476MCNFACCKLAKYQZ2QGUUHGUUEGBX63QOBDH5WJ4BNN",
  }
} as const

/**
 * Errores del contrato
 */
export const ContractError = {
  /**
   * El certificado ya existe en el almacenamiento
   */
  1: {message:"AlreadyExists"},
  /**
   * El certificado no se encontró en el almacenamiento
   */
  2: {message:"NotFound"},
  /**
   * Datos de entrada inválidos (hectares o CO2e <= 0)
   */
  3: {message:"InvalidInput"},
  /**
   * El llamador no es el propietario del certificado
   */
  4: {message:"NotOwner"},
  /**
   * El llamador no está autorizado (no es admin)
   */
  5: {message:"NotAuthorized"}
}




/**
 * Criterios de ordenamiento para listado de certificados
 */
export type SortBy = {tag: "Co2eTons", values: void} | {tag: "Hectares", values: void} | {tag: "CertificateId", values: void};

/**
 * Claves para el almacenamiento
 * 
 * Incluye tanto Persistent Storage (para certificados e índices) como Instance Storage (para contadores)
 */
export type DataKey = {tag: "Certificates", values: readonly [u32]} | {tag: "TotalCertificates", values: void} | {tag: "TotalCO2e", values: void} | {tag: "FarmerCertList", values: readonly [string]} | {tag: "VerifierCertList", values: readonly [string]} | {tag: "CertificateOwner", values: readonly [u32]} | {tag: "TokenContractId", values: void} | {tag: "Admin", values: void};


/**
 * Datos de verificación on-chain del certificado de carbono
 * 
 * Estructura inmutable que almacena la información esencial de un certificado
 * de verificación de reducción de emisiones CO2e, basado en la metodología CONADESUCA.
 */
export interface VerificationRecord {
  /**
 * Toneladas de CO2e reducidas (1 unidad = 1 tonelada de CO2e)
 */
co2e_tons: u128;
  /**
 * Dirección del agricultor beneficiario del certificado
 */
farmer_address: string;
  /**
 * Superficie No Quemada (SQ) en hectáreas - Variable clave para el cálculo de CO2e
 */
hectares_not_burned: u32;
  /**
 * Hash SHA-256 del informe MRV (Measurement, Reporting, Verification) off-chain
 * Garantiza la inmutabilidad de la evidencia del certificado
 */
metadata_hash: Buffer;
  /**
 * Dirección del verificador/autoridad (Ingenio Emiliano Zapata/ULPCA)
 */
verifier_address: string;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Inicializa el contrato con un administrador
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `admin` - Dirección del administrador
   * 
   * # Errores
   * * `ContractError::AlreadyExists` si el contrato ya ha sido inicializado
   */
  initialize: ({admin}: {admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_certificate_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obtiene los datos de un certificado de carbono por su ID
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `certificate_id` - ID único del certificado (u32)
   * 
   * # Retorna
   * `VerificationRecord` - Los datos completos del certificado
   * 
   * # Errores
   * * `ContractError::NotFound` si el certificado no existe
   */
  get_certificate_data: ({certificate_id}: {certificate_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<VerificationRecord>>>

  /**
   * Construct and simulate a get_certificate_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obtiene el propietario actual de un certificado NFT
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `certificate_id` - ID único del certificado (u32)
   * 
   * # Retorna
   * `Address` - La dirección del propietario actual
   * 
   * # Errores
   * * `ContractError::NotFound` si el certificado no existe
   */
  get_certificate_owner: ({certificate_id}: {certificate_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a transfer_certificate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfiere la propiedad de un certificado NFT a otra dirección
   * 
   * Solo puede ser invocado por el propietario actual del certificado.
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `certificate_id` - ID único del certificado (u32)
   * * `from` - Dirección del propietario actual
   * * `to` - Dirección del nuevo propietario
   * 
   * # Retorna
   * `()` - Éxito
   * 
   * # Errores
   * * `ContractError::NotFound` si el certificado no existe
   * * `ContractError::NotOwner` si 'from' no es el propietario actual
   * 
   * # Autorización
   * Requiere autenticación de `from`
   */
  transfer_certificate: ({certificate_id, from, to}: {certificate_id: u32, from: string, to: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a burn_certificate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Quema (retira) un certificado de carbono NFT
   * 
   * Solo el propietario actual del certificado puede quemarlo.
   * Quemar un certificado es el acto final de compensación de carbono.
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `certificate_id` - ID del certificado a quemar
   * 
   * # Errores
   * * `ContractError::NotFound` si el certificado no existe
   * * `ContractError::NotOwner` si el llamador no es el propietario
   * 
   * # Emite
   * * `CertificateBurnedEvent` con los datos de la quema
   */
  burn_certificate: ({certificate_id}: {certificate_id: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_token_contract_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Establece el ID del contrato de token fungible CARBONXO
   * 
   * Solo puede ser invocado por el administrador del contrato.
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `admin` - Dirección del administrador
   * * `token_id` - Address del contrato CarbonToken
   * 
   * # Errores
   * * `ContractError::NotAuthorized` si el llamador no es el admin
   */
  set_token_contract_id: ({admin, token_id}: {admin: string, token_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a mint_certificate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Acuña un nuevo certificado de carbono NFT
   * 
   * Solo puede ser invocado por la dirección del verificador autorizado.
   * Almacena el certificado en Persistent Storage para garantizar su longevidad.
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `certificate_id` - ID único del certificado (u32)
   * * `record` - Los datos completos del certificado de verificación
   * 
   * # Retorna
   * `()` - Éxito
   * 
   * # Errores
   * * `ContractError::AlreadyExists` si el certificado ya existe
   * * `ContractError::InvalidInput` si los datos son inválidos (hectares o CO2e <= 0)
   * 
   * # Autorización
   * Requiere autenticación de `record.verifier_address`
   */
  mint_certificate: ({certificate_id, record}: {certificate_id: u32, record: VerificationRecord}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_total_certificates transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obtiene el total de certificados de carbono acuñados
   * 
   * # Retorna
   * `u32` - El número total de certificados acuñados
   */
  get_total_certificates: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_total_co2e transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obtiene el total de toneladas de CO2e acuñadas
   * 
   * # Retorna
   * `u128` - El total de toneladas de CO2e acuñadas
   */
  get_total_co2e: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u128>>

  /**
   * Construct and simulate a list_certificates_by_farmer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lista los IDs de certificados asociados a un agricultor específico (con paginación y ordenamiento)
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `farmer_address` - La dirección del agricultor
   * * `offset` - El punto de inicio de la paginación (0-indexed)
   * * `limit` - El número máximo de IDs a devolver
   * * `sort_by` - Criterio de ordenamiento (Co2eTons, Hectares, CertificateId)
   * * `is_descending` - Si true, orden descendente; si false, orden ascendente
   * 
   * # Retorna
   * `(Vec<u32>, u32)` - Tupla que contiene (lista paginada de IDs, total de certificados)
   */
  list_certificates_by_farmer: ({farmer_address, offset, limit, sort_by, is_descending}: {farmer_address: string, offset: u32, limit: u32, sort_by: SortBy, is_descending: boolean}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [Array<u32>, u32]>>

  /**
   * Construct and simulate a list_certificates_by_verifier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lista los IDs de certificados asociados a un verificador específico (con paginación)
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `verifier_address` - La dirección del verificador
   * * `offset` - El punto de inicio de la paginación (0-indexed)
   * * `limit` - El número máximo de IDs a devolver
   * 
   * # Retorna
   * `(Vec<u32>, u32)` - Tupla que contiene (lista paginada de IDs, total de certificados)
   */
  list_certificates_by_verifier: ({verifier_address, offset, limit}: {verifier_address: string, offset: u32, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [Array<u32>, u32]>>

  /**
   * Construct and simulate a filter_by_co2e_range transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Filtra certificados de un agricultor por rango de CO2e (con paginación)
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `farmer_address` - La dirección del agricultor
   * * `min_tons` - Toneladas mínimas de CO2e (inclusive)
   * * `max_tons` - Toneladas máximas de CO2e (inclusive)
   * * `offset` - El punto de inicio de la paginación (0-indexed)
   * * `limit` - El número máximo de IDs a devolver
   * 
   * # Retorna
   * `(Vec<u32>, u32)` - Tupla que contiene (IDs filtrados y paginados, total de certificados filtrados)
   */
  filter_by_co2e_range: ({farmer_address, min_tons, max_tons, offset, limit}: {farmer_address: string, min_tons: u128, max_tons: u128, offset: u32, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [Array<u32>, u32]>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAABRFcnJvcmVzIGRlbCBjb250cmF0bwAAAAAAAAANQ29udHJhY3RFcnJvcgAAAAAAAAUAAAAtRWwgY2VydGlmaWNhZG8geWEgZXhpc3RlIGVuIGVsIGFsbWFjZW5hbWllbnRvAAAAAAAADUFscmVhZHlFeGlzdHMAAAAAAAABAAAAM0VsIGNlcnRpZmljYWRvIG5vIHNlIGVuY29udHLDsyBlbiBlbCBhbG1hY2VuYW1pZW50bwAAAAAITm90Rm91bmQAAAACAAAAMkRhdG9zIGRlIGVudHJhZGEgaW52w6FsaWRvcyAoaGVjdGFyZXMgbyBDTzJlIDw9IDApAAAAAAAMSW52YWxpZElucHV0AAAAAwAAADBFbCBsbGFtYWRvciBubyBlcyBlbCBwcm9waWV0YXJpbyBkZWwgY2VydGlmaWNhZG8AAAAITm90T3duZXIAAAAEAAAALUVsIGxsYW1hZG9yIG5vIGVzdMOhIGF1dG9yaXphZG8gKG5vIGVzIGFkbWluKQAAAAAAAA1Ob3RBdXRob3JpemVkAAAAAAAABQ==",
        "AAAABQAAABRFdmVudG9zIGRlbCBjb250cmF0bwAAAAAAAAAWQ2VydGlmaWNhdGVNaW50ZWRFdmVudAAAAAAAAQAAABhjZXJ0aWZpY2F0ZV9taW50ZWRfZXZlbnQAAAAFAAAAIklEIMO6bmljbyBkZWwgY2VydGlmaWNhZG8gYWN1w7FhZG8AAAAAAA5jZXJ0aWZpY2F0ZV9pZAAAAAAABAAAAAAAAAAmRGlyZWNjacOzbiBkZWwgYWdyaWN1bHRvciBiZW5lZmljaWFyaW8AAAAAAAZmYXJtZXIAAAAAABMAAAAAAAAAJURpcmVjY2nDs24gZGVsIHZlcmlmaWNhZG9yIGF1dG9yaXphZG8AAAAAAAAIdmVyaWZpZXIAAAATAAAAAAAAABtUb25lbGFkYXMgZGUgQ08yZSBhY3XDsWFkYXMAAAAAC3RvbnNfbWludGVkAAAAAAoAAAAAAAAAG1RpbWVzdGFtcCBkZSBsYSBhY3XDsWFjacOzbgAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAAAAAAC",
        "AAAABQAAACpFdmVudG8gZGUgdHJhbnNmZXJlbmNpYSBkZSBjZXJ0aWZpY2FkbyBORlQAAAAAAAAAAAAbQ2VydGlmaWNhdGVUcmFuc2ZlcnJlZEV2ZW50AAAAAAEAAAAdY2VydGlmaWNhdGVfdHJhbnNmZXJyZWRfZXZlbnQAAAAAAAADAAAAJUlEIMO6bmljbyBkZWwgY2VydGlmaWNhZG8gdHJhbnNmZXJpZG8AAAAAAAAOY2VydGlmaWNhdGVfaWQAAAAAAAQAAAAAAAAAI0RpcmVjY2nDs24gZGVsIHByb3BpZXRhcmlvIGFudGVyaW9yAAAAAARmcm9tAAAAEwAAAAAAAAAgRGlyZWNjacOzbiBkZWwgbnVldm8gcHJvcGlldGFyaW8AAAACdG8AAAAAABMAAAAAAAAAAg==",
        "AAAABQAAADJFdmVudG8gZGUgcXVlbWEgKHJldGlybykgZGUgY2VydGlmaWNhZG8gZGUgY2FyYm9ubwAAAAAAAAAAABZDZXJ0aWZpY2F0ZUJ1cm5lZEV2ZW50AAAAAAABAAAAGGNlcnRpZmljYXRlX2J1cm5lZF9ldmVudAAAAAMAAAAhSUQgw7puaWNvIGRlbCBjZXJ0aWZpY2FkbyBxdWVtYWRvAAAAAAAADmNlcnRpZmljYXRlX2lkAAAAAAAEAAAAAAAAACREaXJlY2Npw7NuIHF1ZSBxdWVtw7MgZWwgY2VydGlmaWNhZG8AAAAJYnVybmVkX2J5AAAAAAAAEwAAAAAAAAAbVG9uZWxhZGFzIGRlIENPMmUgcmV0aXJhZGFzAAAAABFjbzJlX3RvbnNfcmV0aXJlZAAAAAAAAAoAAAAAAAAAAg==",
        "AAAAAgAAADZDcml0ZXJpb3MgZGUgb3JkZW5hbWllbnRvIHBhcmEgbGlzdGFkbyBkZSBjZXJ0aWZpY2Fkb3MAAAAAAAAAAAAGU29ydEJ5AAAAAAADAAAAAAAAAB1PcmRlbmFyIHBvciB0b25lbGFkYXMgZGUgQ08yZQAAAAAAAAhDbzJlVG9ucwAAAAAAAAAiT3JkZW5hciBwb3IgaGVjdMOhcmVhcyBubyBxdWVtYWRhcwAAAAAACEhlY3RhcmVzAAAAAAAAAB1PcmRlbmFyIHBvciBJRCBkZSBjZXJ0aWZpY2FkbwAAAAAAAA1DZXJ0aWZpY2F0ZUlkAAAA",
        "AAAAAgAAAIZDbGF2ZXMgcGFyYSBlbCBhbG1hY2VuYW1pZW50bwoKSW5jbHV5ZSB0YW50byBQZXJzaXN0ZW50IFN0b3JhZ2UgKHBhcmEgY2VydGlmaWNhZG9zIGUgw61uZGljZXMpIGNvbW8gSW5zdGFuY2UgU3RvcmFnZSAocGFyYSBjb250YWRvcmVzKQAAAAAAAAAAAAdEYXRhS2V5AAAAAAgAAAABAAAAN0FsbWFjZW5hbWllbnRvIHBlcnNpc3RlbnRlIGRlIGNlcnRpZmljYWRvcyBwb3IgSUQgKHUzMikAAAAADENlcnRpZmljYXRlcwAAAAEAAAAEAAAAAAAAADJDb250YWRvciB0b3RhbCBkZSBjZXJ0aWZpY2Fkb3MgZW4gSW5zdGFuY2UgU3RvcmFnZQAAAAAAEVRvdGFsQ2VydGlmaWNhdGVzAAAAAAAAAAAAADNDb250YWRvciB0b3RhbCBkZSBDTzJlIGFjdcOxYWRvIGVuIEluc3RhbmNlIFN0b3JhZ2UAAAAACVRvdGFsQ08yZQAAAAAAAAEAAAA7w41uZGljZSBkZSBjZXJ0aWZpY2Fkb3MgcG9yIGFncmljdWx0b3IgKFBlcnNpc3RlbnQgU3RvcmFnZSkAAAAADkZhcm1lckNlcnRMaXN0AAAAAAABAAAAEwAAAAEAAAA8w41uZGljZSBkZSBjZXJ0aWZpY2Fkb3MgcG9yIHZlcmlmaWNhZG9yIChQZXJzaXN0ZW50IFN0b3JhZ2UpAAAAEFZlcmlmaWVyQ2VydExpc3QAAAABAAAAEwAAAAEAAAA/UHJvcGlldGFyaW8gYWN0dWFsIGRlIGNhZGEgY2VydGlmaWNhZG8gTkZUIChQZXJzaXN0ZW50IFN0b3JhZ2UpAAAAABBDZXJ0aWZpY2F0ZU93bmVyAAAAAQAAAAQAAAAAAAAAPUlEIGRlbCBjb250cmF0byBkZSB0b2tlbiBmdW5naWJsZSBDQVJCT05YTyAoSW5zdGFuY2UgU3RvcmFnZSkAAAAAAAAPVG9rZW5Db250cmFjdElkAAAAAAAAAAA8RGlyZWNjacOzbiBkZWwgYWRtaW5pc3RyYWRvciBkZWwgY29udHJhdG8gKEluc3RhbmNlIFN0b3JhZ2UpAAAABUFkbWluAAAA",
        "AAAAAQAAAOBEYXRvcyBkZSB2ZXJpZmljYWNpw7NuIG9uLWNoYWluIGRlbCBjZXJ0aWZpY2FkbyBkZSBjYXJib25vCgpFc3RydWN0dXJhIGlubXV0YWJsZSBxdWUgYWxtYWNlbmEgbGEgaW5mb3JtYWNpw7NuIGVzZW5jaWFsIGRlIHVuIGNlcnRpZmljYWRvCmRlIHZlcmlmaWNhY2nDs24gZGUgcmVkdWNjacOzbiBkZSBlbWlzaW9uZXMgQ08yZSwgYmFzYWRvIGVuIGxhIG1ldG9kb2xvZ8OtYSBDT05BREVTVUNBLgAAAAAAAAASVmVyaWZpY2F0aW9uUmVjb3JkAAAAAAAFAAAAO1RvbmVsYWRhcyBkZSBDTzJlIHJlZHVjaWRhcyAoMSB1bmlkYWQgPSAxIHRvbmVsYWRhIGRlIENPMmUpAAAAAAljbzJlX3RvbnMAAAAAAAAKAAAANkRpcmVjY2nDs24gZGVsIGFncmljdWx0b3IgYmVuZWZpY2lhcmlvIGRlbCBjZXJ0aWZpY2FkbwAAAAAADmZhcm1lcl9hZGRyZXNzAAAAAAATAAAAUlN1cGVyZmljaWUgTm8gUXVlbWFkYSAoU1EpIGVuIGhlY3TDoXJlYXMgLSBWYXJpYWJsZSBjbGF2ZSBwYXJhIGVsIGPDoWxjdWxvIGRlIENPMmUAAAAAABNoZWN0YXJlc19ub3RfYnVybmVkAAAAAAQAAACISGFzaCBTSEEtMjU2IGRlbCBpbmZvcm1lIE1SViAoTWVhc3VyZW1lbnQsIFJlcG9ydGluZywgVmVyaWZpY2F0aW9uKSBvZmYtY2hhaW4KR2FyYW50aXphIGxhIGlubXV0YWJpbGlkYWQgZGUgbGEgZXZpZGVuY2lhIGRlbCBjZXJ0aWZpY2FkbwAAAA1tZXRhZGF0YV9oYXNoAAAAAAAD7gAAACAAAABERGlyZWNjacOzbiBkZWwgdmVyaWZpY2Fkb3IvYXV0b3JpZGFkIChJbmdlbmlvIEVtaWxpYW5vIFphcGF0YS9VTFBDQSkAAAAQdmVyaWZpZXJfYWRkcmVzcwAAABM=",
        "AAAAAAAAAD9Db25zdHJ1Y3RvciBkZWwgY29udHJhdG8KSW5pY2lhbGl6YSBlbCBjb250cmF0byBDYXJib25DZXJ0aWZpZXIAAAAADV9fY29uc3RydWN0b3IAAAAAAAAAAAAAAA==",
        "AAAAAAAAANdJbmljaWFsaXphIGVsIGNvbnRyYXRvIGNvbiB1biBhZG1pbmlzdHJhZG9yCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGFkbWluYCAtIERpcmVjY2nDs24gZGVsIGFkbWluaXN0cmFkb3IKCiMgRXJyb3JlcwoqIGBDb250cmFjdEVycm9yOjpBbHJlYWR5RXhpc3RzYCBzaSBlbCBjb250cmF0byB5YSBoYSBzaWRvIGluaWNpYWxpemFkbwAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAASZPYnRpZW5lIGxvcyBkYXRvcyBkZSB1biBjZXJ0aWZpY2FkbyBkZSBjYXJib25vIHBvciBzdSBJRAoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGBjZXJ0aWZpY2F0ZV9pZGAgLSBJRCDDum5pY28gZGVsIGNlcnRpZmljYWRvICh1MzIpCgojIFJldG9ybmEKYFZlcmlmaWNhdGlvblJlY29yZGAgLSBMb3MgZGF0b3MgY29tcGxldG9zIGRlbCBjZXJ0aWZpY2FkbwoKIyBFcnJvcmVzCiogYENvbnRyYWN0RXJyb3I6Ok5vdEZvdW5kYCBzaSBlbCBjZXJ0aWZpY2FkbyBubyBleGlzdGUAAAAAABRnZXRfY2VydGlmaWNhdGVfZGF0YQAAAAEAAAAAAAAADmNlcnRpZmljYXRlX2lkAAAAAAAEAAAAAQAAA+kAAAfQAAAAElZlcmlmaWNhdGlvblJlY29yZAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAARdPYnRpZW5lIGVsIHByb3BpZXRhcmlvIGFjdHVhbCBkZSB1biBjZXJ0aWZpY2FkbyBORlQKCiMgQXJndW1lbnRvcwoqIGBlbnZgIC0gRWwgZW50b3JubyBkZWwgY29udHJhdG8KKiBgY2VydGlmaWNhdGVfaWRgIC0gSUQgw7puaWNvIGRlbCBjZXJ0aWZpY2FkbyAodTMyKQoKIyBSZXRvcm5hCmBBZGRyZXNzYCAtIExhIGRpcmVjY2nDs24gZGVsIHByb3BpZXRhcmlvIGFjdHVhbAoKIyBFcnJvcmVzCiogYENvbnRyYWN0RXJyb3I6Ok5vdEZvdW5kYCBzaSBlbCBjZXJ0aWZpY2FkbyBubyBleGlzdGUAAAAAFWdldF9jZXJ0aWZpY2F0ZV9vd25lcgAAAAAAAAEAAAAAAAAADmNlcnRpZmljYXRlX2lkAAAAAAAEAAAAAQAAA+kAAAATAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAhBUcmFuc2ZpZXJlIGxhIHByb3BpZWRhZCBkZSB1biBjZXJ0aWZpY2FkbyBORlQgYSBvdHJhIGRpcmVjY2nDs24KClNvbG8gcHVlZGUgc2VyIGludm9jYWRvIHBvciBlbCBwcm9waWV0YXJpbyBhY3R1YWwgZGVsIGNlcnRpZmljYWRvLgoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGBjZXJ0aWZpY2F0ZV9pZGAgLSBJRCDDum5pY28gZGVsIGNlcnRpZmljYWRvICh1MzIpCiogYGZyb21gIC0gRGlyZWNjacOzbiBkZWwgcHJvcGlldGFyaW8gYWN0dWFsCiogYHRvYCAtIERpcmVjY2nDs24gZGVsIG51ZXZvIHByb3BpZXRhcmlvCgojIFJldG9ybmEKYCgpYCAtIMOJeGl0bwoKIyBFcnJvcmVzCiogYENvbnRyYWN0RXJyb3I6Ok5vdEZvdW5kYCBzaSBlbCBjZXJ0aWZpY2FkbyBubyBleGlzdGUKKiBgQ29udHJhY3RFcnJvcjo6Tm90T3duZXJgIHNpICdmcm9tJyBubyBlcyBlbCBwcm9waWV0YXJpbyBhY3R1YWwKCiMgQXV0b3JpemFjacOzbgpSZXF1aWVyZSBhdXRlbnRpY2FjacOzbiBkZSBgZnJvbWAAAAAUdHJhbnNmZXJfY2VydGlmaWNhdGUAAAADAAAAAAAAAA5jZXJ0aWZpY2F0ZV9pZAAAAAAABAAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAc5RdWVtYSAocmV0aXJhKSB1biBjZXJ0aWZpY2FkbyBkZSBjYXJib25vIE5GVAoKU29sbyBlbCBwcm9waWV0YXJpbyBhY3R1YWwgZGVsIGNlcnRpZmljYWRvIHB1ZWRlIHF1ZW1hcmxvLgpRdWVtYXIgdW4gY2VydGlmaWNhZG8gZXMgZWwgYWN0byBmaW5hbCBkZSBjb21wZW5zYWNpw7NuIGRlIGNhcmJvbm8uCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGNlcnRpZmljYXRlX2lkYCAtIElEIGRlbCBjZXJ0aWZpY2FkbyBhIHF1ZW1hcgoKIyBFcnJvcmVzCiogYENvbnRyYWN0RXJyb3I6Ok5vdEZvdW5kYCBzaSBlbCBjZXJ0aWZpY2FkbyBubyBleGlzdGUKKiBgQ29udHJhY3RFcnJvcjo6Tm90T3duZXJgIHNpIGVsIGxsYW1hZG9yIG5vIGVzIGVsIHByb3BpZXRhcmlvCgojIEVtaXRlCiogYENlcnRpZmljYXRlQnVybmVkRXZlbnRgIGNvbiBsb3MgZGF0b3MgZGUgbGEgcXVlbWEAAAAAABBidXJuX2NlcnRpZmljYXRlAAAAAQAAAAAAAAAOY2VydGlmaWNhdGVfaWQAAAAAAAQAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAUZFc3RhYmxlY2UgZWwgSUQgZGVsIGNvbnRyYXRvIGRlIHRva2VuIGZ1bmdpYmxlIENBUkJPTlhPCgpTb2xvIHB1ZWRlIHNlciBpbnZvY2FkbyBwb3IgZWwgYWRtaW5pc3RyYWRvciBkZWwgY29udHJhdG8uCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGFkbWluYCAtIERpcmVjY2nDs24gZGVsIGFkbWluaXN0cmFkb3IKKiBgdG9rZW5faWRgIC0gQWRkcmVzcyBkZWwgY29udHJhdG8gQ2FyYm9uVG9rZW4KCiMgRXJyb3JlcwoqIGBDb250cmFjdEVycm9yOjpOb3RBdXRob3JpemVkYCBzaSBlbCBsbGFtYWRvciBubyBlcyBlbCBhZG1pbgAAAAAAFXNldF90b2tlbl9jb250cmFjdF9pZAAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIdG9rZW5faWQAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAl9BY3XDsWEgdW4gbnVldm8gY2VydGlmaWNhZG8gZGUgY2FyYm9ubyBORlQKClNvbG8gcHVlZGUgc2VyIGludm9jYWRvIHBvciBsYSBkaXJlY2Npw7NuIGRlbCB2ZXJpZmljYWRvciBhdXRvcml6YWRvLgpBbG1hY2VuYSBlbCBjZXJ0aWZpY2FkbyBlbiBQZXJzaXN0ZW50IFN0b3JhZ2UgcGFyYSBnYXJhbnRpemFyIHN1IGxvbmdldmlkYWQuCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGNlcnRpZmljYXRlX2lkYCAtIElEIMO6bmljbyBkZWwgY2VydGlmaWNhZG8gKHUzMikKKiBgcmVjb3JkYCAtIExvcyBkYXRvcyBjb21wbGV0b3MgZGVsIGNlcnRpZmljYWRvIGRlIHZlcmlmaWNhY2nDs24KCiMgUmV0b3JuYQpgKClgIC0gw4l4aXRvCgojIEVycm9yZXMKKiBgQ29udHJhY3RFcnJvcjo6QWxyZWFkeUV4aXN0c2Agc2kgZWwgY2VydGlmaWNhZG8geWEgZXhpc3RlCiogYENvbnRyYWN0RXJyb3I6OkludmFsaWRJbnB1dGAgc2kgbG9zIGRhdG9zIHNvbiBpbnbDoWxpZG9zIChoZWN0YXJlcyBvIENPMmUgPD0gMCkKCiMgQXV0b3JpemFjacOzbgpSZXF1aWVyZSBhdXRlbnRpY2FjacOzbiBkZSBgcmVjb3JkLnZlcmlmaWVyX2FkZHJlc3NgAAAAABBtaW50X2NlcnRpZmljYXRlAAAAAgAAAAAAAAAOY2VydGlmaWNhdGVfaWQAAAAAAAQAAAAAAAAABnJlY29yZAAAAAAH0AAAABJWZXJpZmljYXRpb25SZWNvcmQAAAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAHNPYnRpZW5lIGVsIHRvdGFsIGRlIGNlcnRpZmljYWRvcyBkZSBjYXJib25vIGFjdcOxYWRvcwoKIyBSZXRvcm5hCmB1MzJgIC0gRWwgbsO6bWVybyB0b3RhbCBkZSBjZXJ0aWZpY2Fkb3MgYWN1w7FhZG9zAAAAABZnZXRfdG90YWxfY2VydGlmaWNhdGVzAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAGtPYnRpZW5lIGVsIHRvdGFsIGRlIHRvbmVsYWRhcyBkZSBDTzJlIGFjdcOxYWRhcwoKIyBSZXRvcm5hCmB1MTI4YCAtIEVsIHRvdGFsIGRlIHRvbmVsYWRhcyBkZSBDTzJlIGFjdcOxYWRhcwAAAAAOZ2V0X3RvdGFsX2NvMmUAAAAAAAAAAAABAAAACg==",
        "AAAAAAAAAixMaXN0YSBsb3MgSURzIGRlIGNlcnRpZmljYWRvcyBhc29jaWFkb3MgYSB1biBhZ3JpY3VsdG9yIGVzcGVjw61maWNvIChjb24gcGFnaW5hY2nDs24geSBvcmRlbmFtaWVudG8pCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGZhcm1lcl9hZGRyZXNzYCAtIExhIGRpcmVjY2nDs24gZGVsIGFncmljdWx0b3IKKiBgb2Zmc2V0YCAtIEVsIHB1bnRvIGRlIGluaWNpbyBkZSBsYSBwYWdpbmFjacOzbiAoMC1pbmRleGVkKQoqIGBsaW1pdGAgLSBFbCBuw7ptZXJvIG3DoXhpbW8gZGUgSURzIGEgZGV2b2x2ZXIKKiBgc29ydF9ieWAgLSBDcml0ZXJpbyBkZSBvcmRlbmFtaWVudG8gKENvMmVUb25zLCBIZWN0YXJlcywgQ2VydGlmaWNhdGVJZCkKKiBgaXNfZGVzY2VuZGluZ2AgLSBTaSB0cnVlLCBvcmRlbiBkZXNjZW5kZW50ZTsgc2kgZmFsc2UsIG9yZGVuIGFzY2VuZGVudGUKCiMgUmV0b3JuYQpgKFZlYzx1MzI+LCB1MzIpYCAtIFR1cGxhIHF1ZSBjb250aWVuZSAobGlzdGEgcGFnaW5hZGEgZGUgSURzLCB0b3RhbCBkZSBjZXJ0aWZpY2Fkb3MpAAAAG2xpc3RfY2VydGlmaWNhdGVzX2J5X2Zhcm1lcgAAAAAFAAAAAAAAAA5mYXJtZXJfYWRkcmVzcwAAAAAAEwAAAAAAAAAGb2Zmc2V0AAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAAAAAAAB3NvcnRfYnkAAAAH0AAAAAZTb3J0QnkAAAAAAAAAAAANaXNfZGVzY2VuZGluZwAAAAAAAAEAAAABAAAD7QAAAAIAAAPqAAAABAAAAAQ=",
        "AAAAAAAAAYtMaXN0YSBsb3MgSURzIGRlIGNlcnRpZmljYWRvcyBhc29jaWFkb3MgYSB1biB2ZXJpZmljYWRvciBlc3BlY8OtZmljbyAoY29uIHBhZ2luYWNpw7NuKQoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGB2ZXJpZmllcl9hZGRyZXNzYCAtIExhIGRpcmVjY2nDs24gZGVsIHZlcmlmaWNhZG9yCiogYG9mZnNldGAgLSBFbCBwdW50byBkZSBpbmljaW8gZGUgbGEgcGFnaW5hY2nDs24gKDAtaW5kZXhlZCkKKiBgbGltaXRgIC0gRWwgbsO6bWVybyBtw6F4aW1vIGRlIElEcyBhIGRldm9sdmVyCgojIFJldG9ybmEKYChWZWM8dTMyPiwgdTMyKWAgLSBUdXBsYSBxdWUgY29udGllbmUgKGxpc3RhIHBhZ2luYWRhIGRlIElEcywgdG90YWwgZGUgY2VydGlmaWNhZG9zKQAAAAAdbGlzdF9jZXJ0aWZpY2F0ZXNfYnlfdmVyaWZpZXIAAAAAAAADAAAAAAAAABB2ZXJpZmllcl9hZGRyZXNzAAAAEwAAAAAAAAAGb2Zmc2V0AAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD7QAAAAIAAAPqAAAABAAAAAQ=",
        "AAAAAAAAAfRGaWx0cmEgY2VydGlmaWNhZG9zIGRlIHVuIGFncmljdWx0b3IgcG9yIHJhbmdvIGRlIENPMmUgKGNvbiBwYWdpbmFjacOzbikKCiMgQXJndW1lbnRvcwoqIGBlbnZgIC0gRWwgZW50b3JubyBkZWwgY29udHJhdG8KKiBgZmFybWVyX2FkZHJlc3NgIC0gTGEgZGlyZWNjacOzbiBkZWwgYWdyaWN1bHRvcgoqIGBtaW5fdG9uc2AgLSBUb25lbGFkYXMgbcOtbmltYXMgZGUgQ08yZSAoaW5jbHVzaXZlKQoqIGBtYXhfdG9uc2AgLSBUb25lbGFkYXMgbcOheGltYXMgZGUgQ08yZSAoaW5jbHVzaXZlKQoqIGBvZmZzZXRgIC0gRWwgcHVudG8gZGUgaW5pY2lvIGRlIGxhIHBhZ2luYWNpw7NuICgwLWluZGV4ZWQpCiogYGxpbWl0YCAtIEVsIG7Dum1lcm8gbcOheGltbyBkZSBJRHMgYSBkZXZvbHZlcgoKIyBSZXRvcm5hCmAoVmVjPHUzMj4sIHUzMilgIC0gVHVwbGEgcXVlIGNvbnRpZW5lIChJRHMgZmlsdHJhZG9zIHkgcGFnaW5hZG9zLCB0b3RhbCBkZSBjZXJ0aWZpY2Fkb3MgZmlsdHJhZG9zKQAAABRmaWx0ZXJfYnlfY28yZV9yYW5nZQAAAAUAAAAAAAAADmZhcm1lcl9hZGRyZXNzAAAAAAATAAAAAAAAAAhtaW5fdG9ucwAAAAoAAAAAAAAACG1heF90b25zAAAACgAAAAAAAAAGb2Zmc2V0AAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD7QAAAAIAAAPqAAAABAAAAAQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<Result<void>>,
        get_certificate_data: this.txFromJSON<Result<VerificationRecord>>,
        get_certificate_owner: this.txFromJSON<Result<string>>,
        transfer_certificate: this.txFromJSON<Result<void>>,
        burn_certificate: this.txFromJSON<Result<void>>,
        set_token_contract_id: this.txFromJSON<Result<void>>,
        mint_certificate: this.txFromJSON<Result<void>>,
        get_total_certificates: this.txFromJSON<u32>,
        get_total_co2e: this.txFromJSON<u128>,
        list_certificates_by_farmer: this.txFromJSON<readonly [Array<u32>, u32]>,
        list_certificates_by_verifier: this.txFromJSON<readonly [Array<u32>, u32]>,
        filter_by_co2e_range: this.txFromJSON<readonly [Array<u32>, u32]>
  }
}

export default new Client({
  contractId: networks.standalone.contractId,
  networkPassphrase: networks.standalone.networkPassphrase,
  rpcUrl: rpcUrl,
});