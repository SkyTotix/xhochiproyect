import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./useWallet";
import carbonCertifier, { networks } from "../contracts/carbon_certifier";
import { rpcUrl, stellarNetwork } from "../contracts/util";
import { Server } from "@stellar/stellar-sdk/rpc";
import { Address, Contract } from "@stellar/stellar-sdk";
import { xdr } from "@stellar/stellar-sdk";

/**
 * Hook personalizado para verificar si el usuario conectado es el administrador del contrato CarbonCertifier
 * 
 * Este hook utiliza TanStack Query para consultar el Instance Storage del contrato
 * y comparar la dirección del administrador con la del usuario conectado.
 * 
 * @returns Objeto con estado de admin, carga y errores
 * 
 * @example
 * ```tsx
 * const { isAdmin, isLoading, error } = useVerifierRole();
 * 
 * if (isLoading) return <Loader />;
 * if (error) return <Alert>{error.message}</Alert>;
 * 
 * if (isAdmin) {
 *   // Mostrar opciones administrativas
 * }
 * ```
 */
export const useVerifierRole = () => {
  const { address: publicKey } = useWallet();

  return useQuery<boolean>({
    queryKey: ["verifier-role", publicKey],
    queryFn: async () => {
      if (!publicKey) {
        return false;
      }

      try {
        // Crear server RPC
        const server = new Server(rpcUrl, { allowHttp: stellarNetwork === "LOCAL" });

        // Obtener el spec del contrato
        const spec = carbonCertifier.spec;
        
        // Construir el DataKey para Admin (Instance Storage)
        // El formato es: { tag: "Admin", values: null }
        const adminDataKey = spec.toXDR("DataKey", { tag: "Admin", values: null });

        // Construir la clave de ledger
        const address = Address.fromString(networks.standalone.contractId);
        
        const ledgerKey = xdr.LedgerKey.contractData(
          new xdr.LedgerKeyContractData({
            contract: address.toScAddress(),
            key: xdr.ScVal.fromXDR(adminDataKey),
            durability: xdr.ContractDataDurability.instance(),
          })
        );

        // Obtener la entrada del storage
        const response = await server.getLedgerEntries(ledgerKey);
        
        if (!response.entries.length || !response.entries[0]?.val) {
          throw new Error("Admin no encontrado en el storage");
        }

        // Extraer el valor del storage
        const storageEntry = response.entries[0].val!;
        const ledgerEntryData = storageEntry.contractData();
        const contractDataVal = ledgerEntryData.val();
        
        // Obtener el ScVal del storage
        const scVal = contractDataVal.value();
        
        // Decodificar el Address desde el ScVal
        // ScVal tiene un método toXDR que devuelve la representación XDR
        const scValXdr = scVal.toXDR("base64");
        const adminAddressStr = spec.fromXDR("Address", scValXdr);

        // Comparar con la dirección del usuario
        return adminAddressStr.toLowerCase() === publicKey.toLowerCase();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Error desconocido al verificar rol de administrador");
      }
    },
    // Solo consultar si hay un usuario conectado
    enabled: publicKey !== undefined && publicKey !== null && publicKey !== "",
    // Cachear el resultado por 5 minutos
    staleTime: 5 * 60 * 1000,
  });
};

export default useVerifierRole;

