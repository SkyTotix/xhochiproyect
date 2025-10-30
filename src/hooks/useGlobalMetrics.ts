import { useQuery } from "@tanstack/react-query";
import carbonCertifier from "../contracts/carbon_certifier";

/**
 * Hook personalizado para obtener las métricas globales del proyecto de tokenización de carbono
 * 
 * Este hook utiliza TanStack Query para consultar las métricas totales del contrato
 * CarbonCertifier, incluyendo el total de certificados y el total de CO2e reducido.
 * 
 * @returns Resultado de useQuery con métricas globales, estados de carga y errores
 */
export const useGlobalMetrics = () => {
  // Query para total de certificados
  const totalCertificatesQuery = useQuery({
    queryKey: ["global-metrics", "total-certificates"],
    queryFn: async () => {
      try {
        const tx = await carbonCertifier.get_total_certificates();
        // result puede ser None si hay error, devolver 0 en ese caso
        return tx.result?.unwrap() ?? 0;
      } catch (err) {
        console.error("Error fetching total certificates:", err);
        return 0;
      }
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  // Query para total de CO2e
  const totalCo2eQuery = useQuery({
    queryKey: ["global-metrics", "total-co2e"],
    queryFn: async () => {
      try {
        const tx = await carbonCertifier.get_total_co2e();
        // result puede ser None si hay error, devolver 0 en ese caso
        return tx.result?.unwrap() ?? BigInt(0);
      } catch (err) {
        console.error("Error fetching total CO2e:", err);
        return BigInt(0);
      }
    },
    staleTime: 60 * 1000, // 1 minuto
  });

  return {
    totalCertificates: totalCertificatesQuery.data,
    totalCo2e: totalCo2eQuery.data,
    isLoading: totalCertificatesQuery.isLoading || totalCo2eQuery.isLoading,
    error: totalCertificatesQuery.error || totalCo2eQuery.error,
  };
};

export default useGlobalMetrics;

