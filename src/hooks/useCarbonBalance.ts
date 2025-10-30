import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./useWallet";
import carbonToken from "../contracts/carbon_token";

/**
 * Hook personalizado para obtener el balance de tokens CARBONXO (CXO) del usuario conectado
 * 
 * Este hook utiliza TanStack Query para consultar el balance de tokens
 * del usuario conectado mediante la función `balance` del contrato CarbonToken.
 * 
 * @returns Resultado de useQuery con balance del usuario (i128), estados de carga y errores
 * 
 * @example
 * ```tsx
 * const { data: balance, isLoading, error } = useCarbonBalance();
 * 
 * if (isLoading) return <Loader />;
 * if (error) return <Alert>{error.message}</Alert>;
 * 
 * return <Text>Balance: {balance?.toString()} CXO</Text>;
 * ```
 */
export const useCarbonBalance = () => {
  const { address: publicKey } = useWallet();

  return useQuery<i128>({
    queryKey: ["carbon-balance", publicKey],
    queryFn: async () => {
      if (!publicKey) {
        throw new Error("No hay billetera conectada");
      }

      // Llamar a balance - esto solo simula por defecto
      const tx = await carbonToken.balance({
        id: publicKey,
      });

      // Obtener el resultado de la simulación
      return tx.result;
    },
    // Solo consultar si hay un usuario conectado
    enabled: publicKey !== undefined && publicKey !== null && publicKey !== "",
    // Cachear el resultado por 30 segundos
    staleTime: 30 * 1000,
    // Refrescar automáticamente cada 5 minutos
    refetchInterval: 5 * 60 * 1000,
  });
};

export default useCarbonBalance;

