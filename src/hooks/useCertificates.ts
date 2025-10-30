import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./useWallet";
import carbonCertifier, { type SortBy } from "../contracts/carbon_certifier";
import type { u32, u128 } from "@stellar/stellar-sdk/contract";

/**
 * Parámetros para el hook useCertificates
 */
export interface UseCertificatesParams {
  /** El punto de inicio de la paginación (0-indexed) */
  offset: number;
  /** El número máximo de IDs a devolver por página */
  limit: number;
  /** Toneladas mínimas de CO2e para filtro (opcional) */
  minCo2e?: number;
  /** Toneladas máximas de CO2e para filtro (opcional) */
  maxCo2e?: number;
  /** Criterio de ordenamiento (opcional, por defecto 'CertificateId') */
  sortBy?: SortBy;
  /** Si true, orden descendente; si false, orden ascendente (opcional) */
  isDescending?: boolean;
}

/**
 * Resultado de la consulta de certificados
 */
export interface CertificatesResult {
  /** Lista paginada de IDs de certificados */
  certificateIds: Array<u32>;
  /** Total de certificados que coinciden con los filtros */
  total: u32;
}

/**
 * Hook personalizado para obtener la lista paginada y filtrada de certificados NFT
 * 
 * Este hook utiliza TanStack Query para obtener certificados del contrato CarbonCertifier.
 * Soporta:
 * - Paginación eficiente con offset y limit
 * - Filtrado por rango de CO2e
 * - Ordenamiento por diferentes criterios
 * - Consulta automática basada en el usuario conectado
 * 
 * @param params - Parámetros de consulta (offset, limit, filtros, ordenamiento)
 * @returns Resultado de useQuery con estados de carga, error y datos
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCertificates({
 *   offset: 0,
 *   limit: 10,
 *   minCo2e: 100,
 *   maxCo2e: 1000,
 *   sortBy: { tag: "Co2eTons", values: undefined },
 *   isDescending: true
 * });
 * 
 * if (isLoading) return <Loader />;
 * if (error) return <Alert>{error.message}</Alert>;
 * if (data) {
 *   console.log(`${data.certificateIds.length} certificados (Total: ${data.total})`);
 * }
 * ```
 */
export const useCertificates = (params: UseCertificatesParams) => {
  const { offset, limit, minCo2e, maxCo2e, sortBy, isDescending } = params;
  const { address: publicKey } = useWallet();

  // Determinar si debemos usar filtro por rango de CO2e
  const hasCo2eFilter = minCo2e !== undefined && maxCo2e !== undefined;

  // Query para listar certificados con o sin filtro
  return useQuery<CertificatesResult>({
    queryKey: [
      "certificates",
      "farmer",
      publicKey,
      offset,
      limit,
      minCo2e,
      maxCo2e,
      sortBy?.tag,
      isDescending,
    ],
    queryFn: async () => {
      if (!publicKey) {
        throw new Error("No hay usuario conectado");
      }

      try {
        let result;

        if (hasCo2eFilter) {
          // Usar filtro por rango de CO2e
          result = await carbonCertifier.filter_by_co2e_range({
            farmer_address: publicKey,
            min_tons: BigInt(minCo2e) as u128,
            max_tons: BigInt(maxCo2e) as u128,
            offset: BigInt(offset) as u32,
            limit: BigInt(limit) as u32,
          });
        } else {
          // Usar lista por agricultor con ordenamiento
          const defaultSortBy: SortBy = sortBy || { tag: "CertificateId", values: undefined };
          const defaultIsDescending = isDescending ?? false;

          result = await carbonCertifier.list_certificates_by_farmer({
            farmer_address: publicKey,
            offset: BigInt(offset) as u32,
            limit: BigInt(limit) as u32,
            sort_by: defaultSortBy,
            is_descending: defaultIsDescending,
          });
        }

        if (result.result.isErr()) {
          throw new Error(
            `Error al obtener lista de certificados: ${result.result.unwrapErr()}`,
          );
        }

        const [certificateIds, total] = result.result.unwrap();

        return {
          certificateIds,
          total,
        };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Error desconocido al consultar certificados");
      }
    },
    // Solo consultar si hay un usuario conectado
    enabled: publicKey !== undefined && publicKey !== null && publicKey !== "",
    // Cachear resultados por 5 minutos
    staleTime: 5 * 60 * 1000,
    // Revalidar en background cada 10 minutos
    refetchInterval: 10 * 60 * 1000,
  });
};

export default useCertificates;

