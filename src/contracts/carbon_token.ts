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
    contractId: "CD7SQJZOUVUAKDDLIANIXKZM6FCG2EIOV3JWB4KTVCE7QBOC7I2O6YXE",
  }
} as const

/**
 * Errores del contrato
 */
export const TokenError = {
  /**
   * El contrato no ha sido inicializado
   */
  1: {message:"NotInitialized"},
  /**
   * Intentó hacer una operación no autorizada (solo admin puede acuñar)
   */
  2: {message:"Unauthorized"},
  /**
   * Balance insuficiente para la transferencia
   */
  3: {message:"InsufficientBalance"},
  /**
   * Cantidad de tokens inválida (<= 0)
   */
  4: {message:"InvalidAmount"},
  /**
   * Asignación insuficiente para transferir en nombre del dueño
   */
  5: {message:"InsufficientAllowance"}
}




/**
 * Claves para el almacenamiento
 */
export type DataKey = {tag: "Admin", values: void} | {tag: "Balance", values: readonly [string]} | {tag: "Allowance", values: readonly [string, string]};

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Inicializa el contrato de token CARBONXO
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `admin` - Dirección del administrador con permisos de acuñación
   * 
   * # Comportamiento
   * Establece el nombre 'CARBONXO', símbolo 'CXO' y guarda el admin.
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
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Acuña nuevos tokens CARBONXO
   * 
   * Solo el admin puede acuñar tokens.
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `to` - Dirección que recibirá los tokens
   * * `amount` - Cantidad de tokens a acuñar
   * 
   * # Errores
   * * `TokenError::Unauthorized` si el llamador no es el admin
   * * `TokenError::InvalidAmount` si amount <= 0
   * * `TokenError::NotInitialized` si el contrato no ha sido inicializado
   * 
   * # Emite
   * * `MintEvent` con los datos de la acuñación
   */
  mint: ({to, amount}: {to: string, amount: i128}, options?: {
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
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfiere tokens entre direcciones
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `from` - Dirección del remitente
   * * `to` - Dirección del receptor
   * * `amount` - Cantidad de tokens a transferir
   * 
   * # Errores
   * * `TokenError::Unauthorized` si 'from' no está autorizado
   * * `TokenError::InsufficientBalance` si 'from' no tiene suficientes tokens
   * * `TokenError::InvalidAmount` si amount <= 0
   * 
   * # Emite
   * * `TransferEvent` con los datos de la transferencia
   */
  transfer: ({from, to, amount}: {from: string, to: string, amount: i128}, options?: {
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
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Consulta el balance de tokens de una dirección
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `id` - Dirección del usuario
   * 
   * # Retorna
   * `i128` - Balance de tokens CARBONXO
   */
  balance: ({id}: {id: string}, options?: {
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
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Aprueba a un operador para gastar tokens en nombre del dueño
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `from` - Dirección del dueño (propietario de los tokens)
   * * `spender` - Dirección del operador autorizado
   * * `amount` - Cantidad de tokens autorizados
   * 
   * # Errores
   * * `TokenError::InvalidAmount` si amount < 0
   * 
   * # Emite
   * * `ApprovalEvent` con los datos de la aprobación
   */
  approve: ({from, spender, amount}: {from: string, spender: string, amount: i128}, options?: {
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
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Consulta la cantidad de tokens que un operador puede gastar en nombre del dueño
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `from` - Dirección del dueño
   * * `spender` - Dirección del operador
   * 
   * # Retorna
   * `i128` - Cantidad de tokens autorizados (0 si no existe aprobación)
   */
  allowance: ({from, spender}: {from: string, spender: string}, options?: {
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
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfiere tokens desde una dirección a otra en nombre del dueño
   * 
   * El operador (spender) debe haber sido previamente aprobado por el dueño (from)
   * y tener suficiente asignación.
   * 
   * # Argumentos
   * * `env` - El entorno del contrato
   * * `spender` - Dirección del operador autorizado (firmante de la transacción)
   * * `from` - Dirección del dueño (remitente de los tokens)
   * * `to` - Dirección del receptor
   * * `amount` - Cantidad de tokens a transferir
   * 
   * # Errores
   * * `TokenError::Unauthorized` si 'spender' no está autenticado
   * * `TokenError::InsufficientBalance` si 'from' no tiene suficientes tokens
   * * `TokenError::InsufficientAllowance` si no hay suficiente asignación
   * * `TokenError::InvalidAmount` si amount <= 0
   * 
   * # Emite
   * * `TransferEvent` con los datos de la transferencia
   */
  transfer_from: ({spender, from, to, amount}: {spender: string, from: string, to: string, amount: i128}, options?: {
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
      new ContractSpec([ "AAAABAAAABRFcnJvcmVzIGRlbCBjb250cmF0bwAAAAAAAAAKVG9rZW5FcnJvcgAAAAAABQAAACNFbCBjb250cmF0byBubyBoYSBzaWRvIGluaWNpYWxpemFkbwAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAABGSW50ZW50w7MgaGFjZXIgdW5hIG9wZXJhY2nDs24gbm8gYXV0b3JpemFkYSAoc29sbyBhZG1pbiBwdWVkZSBhY3XDsWFyKQAAAAAADFVuYXV0aG9yaXplZAAAAAIAAAAqQmFsYW5jZSBpbnN1ZmljaWVudGUgcGFyYSBsYSB0cmFuc2ZlcmVuY2lhAAAAAAATSW5zdWZmaWNpZW50QmFsYW5jZQAAAAADAAAAI0NhbnRpZGFkIGRlIHRva2VucyBpbnbDoWxpZGEgKDw9IDApAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABAAAAD1Bc2lnbmFjacOzbiBpbnN1ZmljaWVudGUgcGFyYSB0cmFuc2ZlcmlyIGVuIG5vbWJyZSBkZWwgZHVlw7FvAAAAAAAAFUluc3VmZmljaWVudEFsbG93YW5jZQAAAAAAAAU=",
        "AAAABQAAABRFdmVudG9zIGRlbCBjb250cmF0bwAAAAAAAAAJTWludEV2ZW50AAAAAAAAAQAAAAptaW50X2V2ZW50AAAAAAACAAAAF0RpcmVjY2nDs24gZGVsIHJlY2VwdG9yAAAAAAJ0bwAAAAAAEwAAAAAAAAARQ2FudGlkYWQgYWN1w7FhZGEAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAABQAAACFFdmVudG8gZGUgdHJhbnNmZXJlbmNpYSBkZSB0b2tlbnMAAAAAAAAAAAAADVRyYW5zZmVyRXZlbnQAAAAAAAABAAAADnRyYW5zZmVyX2V2ZW50AAAAAAADAAAAGERpcmVjY2nDs24gZGVsIHJlbWl0ZW50ZQAAAARmcm9tAAAAEwAAAAAAAAAXRGlyZWNjacOzbiBkZWwgcmVjZXB0b3IAAAAAAnRvAAAAAAATAAAAAAAAABRDYW50aWRhZCB0cmFuc2ZlcmlkYQAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==",
        "AAAABQAAACdFdmVudG8gZGUgYXByb2JhY2nDs24gZGUgZ2FzdG8gZGVsZWdhZG8AAAAAAAAAAA1BcHByb3ZhbEV2ZW50AAAAAAAAAQAAAA5hcHByb3ZhbF9ldmVudAAAAAAAAwAAABpEaXJlY2Npw7NuIGRlbCBwcm9waWV0YXJpbwAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAhRGlyZWNjacOzbiBhdXRvcml6YWRhIHBhcmEgZ2FzdGFyAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAATQ2FudGlkYWQgYXV0b3JpemFkYQAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAAAgAAAB1DbGF2ZXMgcGFyYSBlbCBhbG1hY2VuYW1pZW50bwAAAAAAAAAAAAAHRGF0YUtleQAAAAADAAAAAAAAAC9EaXJlY2Npw7NuIGRlbCBhZG1pbmlzdHJhZG9yIChJbnN0YW5jZSBTdG9yYWdlKQAAAAAFQWRtaW4AAAAAAAABAAAANUJhbGFuY2UgZGUgdG9rZW5zIHBvciBkaXJlY2Npw7NuIChQZXJzaXN0ZW50IFN0b3JhZ2UpAAAAAAAAB0JhbGFuY2UAAAAAAQAAABMAAAABAAAAU0FzaWduYWNpw7NuIGRlIGdhc3RvIGRlbGVnYWRvIChQZXJzaXN0ZW50IFN0b3JhZ2UpCk1hcGVhIChvd25lciwgc3BlbmRlcikgLT4gYW1vdW50AAAAAAlBbGxvd2FuY2UAAAAAAAACAAAAEwAAABM=",
        "AAAAAAAAAPFJbmljaWFsaXphIGVsIGNvbnRyYXRvIGRlIHRva2VuIENBUkJPTlhPCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGFkbWluYCAtIERpcmVjY2nDs24gZGVsIGFkbWluaXN0cmFkb3IgY29uIHBlcm1pc29zIGRlIGFjdcOxYWNpw7NuCgojIENvbXBvcnRhbWllbnRvCkVzdGFibGVjZSBlbCBub21icmUgJ0NBUkJPTlhPJywgc8OtbWJvbG8gJ0NYTycgeSBndWFyZGEgZWwgYWRtaW4uAAAAAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAClRva2VuRXJyb3IAAA==",
        "AAAAAAAAAblBY3XDsWEgbnVldm9zIHRva2VucyBDQVJCT05YTwoKU29sbyBlbCBhZG1pbiBwdWVkZSBhY3XDsWFyIHRva2Vucy4KCiMgQXJndW1lbnRvcwoqIGBlbnZgIC0gRWwgZW50b3JubyBkZWwgY29udHJhdG8KKiBgdG9gIC0gRGlyZWNjacOzbiBxdWUgcmVjaWJpcsOhIGxvcyB0b2tlbnMKKiBgYW1vdW50YCAtIENhbnRpZGFkIGRlIHRva2VucyBhIGFjdcOxYXIKCiMgRXJyb3JlcwoqIGBUb2tlbkVycm9yOjpVbmF1dGhvcml6ZWRgIHNpIGVsIGxsYW1hZG9yIG5vIGVzIGVsIGFkbWluCiogYFRva2VuRXJyb3I6OkludmFsaWRBbW91bnRgIHNpIGFtb3VudCA8PSAwCiogYFRva2VuRXJyb3I6Ok5vdEluaXRpYWxpemVkYCBzaSBlbCBjb250cmF0byBubyBoYSBzaWRvIGluaWNpYWxpemFkbwoKIyBFbWl0ZQoqIGBNaW50RXZlbnRgIGNvbiBsb3MgZGF0b3MgZGUgbGEgYWN1w7FhY2nDs24AAAAAAAAEbWludAAAAAIAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAb9UcmFuc2ZpZXJlIHRva2VucyBlbnRyZSBkaXJlY2Npb25lcwoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGBmcm9tYCAtIERpcmVjY2nDs24gZGVsIHJlbWl0ZW50ZQoqIGB0b2AgLSBEaXJlY2Npw7NuIGRlbCByZWNlcHRvcgoqIGBhbW91bnRgIC0gQ2FudGlkYWQgZGUgdG9rZW5zIGEgdHJhbnNmZXJpcgoKIyBFcnJvcmVzCiogYFRva2VuRXJyb3I6OlVuYXV0aG9yaXplZGAgc2kgJ2Zyb20nIG5vIGVzdMOhIGF1dG9yaXphZG8KKiBgVG9rZW5FcnJvcjo6SW5zdWZmaWNpZW50QmFsYW5jZWAgc2kgJ2Zyb20nIG5vIHRpZW5lIHN1ZmljaWVudGVzIHRva2VucwoqIGBUb2tlbkVycm9yOjpJbnZhbGlkQW1vdW50YCBzaSBhbW91bnQgPD0gMAoKIyBFbWl0ZQoqIGBUcmFuc2ZlckV2ZW50YCBjb24gbG9zIGRhdG9zIGRlIGxhIHRyYW5zZmVyZW5jaWEAAAAACHRyYW5zZmVyAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAK5Db25zdWx0YSBlbCBiYWxhbmNlIGRlIHRva2VucyBkZSB1bmEgZGlyZWNjacOzbgoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGBpZGAgLSBEaXJlY2Npw7NuIGRlbCB1c3VhcmlvCgojIFJldG9ybmEKYGkxMjhgIC0gQmFsYW5jZSBkZSB0b2tlbnMgQ0FSQk9OWE8AAAAAAAdiYWxhbmNlAAAAAAEAAAAAAAAAAmlkAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAXlBcHJ1ZWJhIGEgdW4gb3BlcmFkb3IgcGFyYSBnYXN0YXIgdG9rZW5zIGVuIG5vbWJyZSBkZWwgZHVlw7FvCgojIEFyZ3VtZW50b3MKKiBgZW52YCAtIEVsIGVudG9ybm8gZGVsIGNvbnRyYXRvCiogYGZyb21gIC0gRGlyZWNjacOzbiBkZWwgZHVlw7FvIChwcm9waWV0YXJpbyBkZSBsb3MgdG9rZW5zKQoqIGBzcGVuZGVyYCAtIERpcmVjY2nDs24gZGVsIG9wZXJhZG9yIGF1dG9yaXphZG8KKiBgYW1vdW50YCAtIENhbnRpZGFkIGRlIHRva2VucyBhdXRvcml6YWRvcwoKIyBFcnJvcmVzCiogYFRva2VuRXJyb3I6OkludmFsaWRBbW91bnRgIHNpIGFtb3VudCA8IDAKCiMgRW1pdGUKKiBgQXBwcm92YWxFdmVudGAgY29uIGxvcyBkYXRvcyBkZSBsYSBhcHJvYmFjacOzbgAAAAAAAAdhcHByb3ZlAAAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAdzcGVuZGVyAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAClRva2VuRXJyb3IAAA==",
        "AAAAAAAAARdDb25zdWx0YSBsYSBjYW50aWRhZCBkZSB0b2tlbnMgcXVlIHVuIG9wZXJhZG9yIHB1ZWRlIGdhc3RhciBlbiBub21icmUgZGVsIGR1ZcOxbwoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGBmcm9tYCAtIERpcmVjY2nDs24gZGVsIGR1ZcOxbwoqIGBzcGVuZGVyYCAtIERpcmVjY2nDs24gZGVsIG9wZXJhZG9yCgojIFJldG9ybmEKYGkxMjhgIC0gQ2FudGlkYWQgZGUgdG9rZW5zIGF1dG9yaXphZG9zICgwIHNpIG5vIGV4aXN0ZSBhcHJvYmFjacOzbikAAAAACWFsbG93YW5jZQAAAAAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAdzcGVuZGVyAAAAABMAAAABAAAACw==",
        "AAAAAAAAAwBUcmFuc2ZpZXJlIHRva2VucyBkZXNkZSB1bmEgZGlyZWNjacOzbiBhIG90cmEgZW4gbm9tYnJlIGRlbCBkdWXDsW8KCkVsIG9wZXJhZG9yIChzcGVuZGVyKSBkZWJlIGhhYmVyIHNpZG8gcHJldmlhbWVudGUgYXByb2JhZG8gcG9yIGVsIGR1ZcOxbyAoZnJvbSkKeSB0ZW5lciBzdWZpY2llbnRlIGFzaWduYWNpw7NuLgoKIyBBcmd1bWVudG9zCiogYGVudmAgLSBFbCBlbnRvcm5vIGRlbCBjb250cmF0bwoqIGBzcGVuZGVyYCAtIERpcmVjY2nDs24gZGVsIG9wZXJhZG9yIGF1dG9yaXphZG8gKGZpcm1hbnRlIGRlIGxhIHRyYW5zYWNjacOzbikKKiBgZnJvbWAgLSBEaXJlY2Npw7NuIGRlbCBkdWXDsW8gKHJlbWl0ZW50ZSBkZSBsb3MgdG9rZW5zKQoqIGB0b2AgLSBEaXJlY2Npw7NuIGRlbCByZWNlcHRvcgoqIGBhbW91bnRgIC0gQ2FudGlkYWQgZGUgdG9rZW5zIGEgdHJhbnNmZXJpcgoKIyBFcnJvcmVzCiogYFRva2VuRXJyb3I6OlVuYXV0aG9yaXplZGAgc2kgJ3NwZW5kZXInIG5vIGVzdMOhIGF1dGVudGljYWRvCiogYFRva2VuRXJyb3I6Okluc3VmZmljaWVudEJhbGFuY2VgIHNpICdmcm9tJyBubyB0aWVuZSBzdWZpY2llbnRlcyB0b2tlbnMKKiBgVG9rZW5FcnJvcjo6SW5zdWZmaWNpZW50QWxsb3dhbmNlYCBzaSBubyBoYXkgc3VmaWNpZW50ZSBhc2lnbmFjacOzbgoqIGBUb2tlbkVycm9yOjpJbnZhbGlkQW1vdW50YCBzaSBhbW91bnQgPD0gMAoKIyBFbWl0ZQoqIGBUcmFuc2ZlckV2ZW50YCBjb24gbG9zIGRhdG9zIGRlIGxhIHRyYW5zZmVyZW5jaWEAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<Result<void>>,
        mint: this.txFromJSON<Result<void>>,
        transfer: this.txFromJSON<Result<void>>,
        balance: this.txFromJSON<i128>,
        approve: this.txFromJSON<Result<void>>,
        allowance: this.txFromJSON<i128>,
        transfer_from: this.txFromJSON<Result<void>>
  }
}

export default new Client({
  contractId: networks.standalone.contractId,
  networkPassphrase: networks.standalone.networkPassphrase,
  rpcUrl: rpcUrl,
});