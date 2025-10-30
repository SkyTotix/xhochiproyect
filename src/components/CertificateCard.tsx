import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Text, Badge, Loader } from "@stellar/design-system";
import { Box } from "./layout/Box";
import carbonCertifier, { type VerificationRecord } from "../contracts/carbon_certifier";
import type { u32 } from "@stellar/stellar-sdk/contract";
import { Buffer } from "buffer";

/**
 * Props para el componente CertificateCard
 */
interface CertificateCardProps {
  /** ID único del certificado NFT (u32) */
  certificateId: u32;
}

/**
 * Componente de tarjeta para mostrar información de un Certificado NFT de Carbono.
 * 
 * Muestra los datos críticos del certificado incluyendo:
 * - ID del certificado
 * - Propietario actual
 * - Toneladas de CO2e reducidas
 * - Direcciones del verificador y agricultor
 * - Hash del informe MRV
 * 
 * Usa TanStack Query para obtener los datos del contrato CarbonCertifier.
 * 
 * @param props - Props del componente
 * @param props.certificateId - ID único del certificado
 * @returns Componente React que muestra la tarjeta del certificado
 */
export const CertificateCard: React.FC<CertificateCardProps> = ({ certificateId }) => {
  // Query para obtener los datos del certificado
  const {
    data: certificateData,
    isLoading: isLoadingCertificate,
    error: certificateError,
  } = useQuery<VerificationRecord>({
    queryKey: ["certificate-data", certificateId],
    queryFn: async () => {
      const result = await carbonCertifier.get_certificate_data({
        certificate_id: certificateId,
      });
      
      if (result.result.isErr()) {
        throw new Error(`Error al obtener datos del certificado: ${result.result.unwrapErr()}`);
      }
      
      return result.result.unwrap();
    },
    enabled: certificateId !== undefined && certificateId !== null,
  });

  // Query para obtener el propietario del certificado
  const {
    data: owner,
    isLoading: isLoadingOwner,
    error: ownerError,
  } = useQuery({
    queryKey: ["certificate-owner", certificateId],
    queryFn: async () => {
      const result = await carbonCertifier.get_certificate_owner({
        certificate_id: certificateId,
      });
      
      if (result.result.isErr()) {
        throw new Error(`Error al obtener propietario del certificado: ${result.result.unwrapErr()}`);
      }
      
      return result.result.unwrap();
    },
    enabled: certificateId !== undefined && certificateId !== null,
  });

  // Estados de carga y error
  const isLoading = isLoadingCertificate || isLoadingOwner;
  const error = certificateError || ownerError;

  // Si hay error, mostramos mensaje de error
  if (error) {
    return (
      <Card variant="secondary">
        <Alert variant="error" placement="inline" title="Error">
          {error instanceof Error ? error.message : "Error al cargar los datos del certificado"}
        </Alert>
      </Card>
    );
  }

  // Si está cargando, mostramos spinner
  if (isLoading) {
    return (
      <Card variant="secondary">
        <Box gap="md" align="center" justify="center">
          <Loader />
          <Text as="p" size="md">Cargando datos del certificado...</Text>
        </Box>
      </Card>
    );
  }

  // Si no hay datos, no mostramos nada
  if (!certificateData || !owner) {
    return null;
  }

  // Formatear el hash del metadata para mostrarlo
  const metadataHashHex = certificateData.metadata_hash instanceof Buffer 
    ? certificateData.metadata_hash.toString('hex') 
    : String(certificateData.metadata_hash);

  // Formatear dirección truncada para mostrar
  const truncateAddress = (address: string): string => {
    if (!address || address.length < 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card variant="secondary">
      <Box gap="lg">
        {/* Header con ID del certificado */}
        <Box gap="sm" direction="row" align="center">
          <Text as="h3" size="lg" weight="semi-bold">
            Certificado NFT #{certificateId}
          </Text>
          <Badge variant="primary" size="md">
            Carbono Verificado
          </Badge>
        </Box>

        {/* Datos del certificado */}
        <Box gap="md">
          {/* Propietario */}
          <Box gap="xs">
            <Text as="p" size="sm" weight="semi-bold" color="neutral-08">
              Propietario
            </Text>
            <Text as="p" size="md" style={{ fontFamily: 'monospace' }}>
              {truncateAddress(owner)}
            </Text>
          </Box>

          <Box gap="xs">
            <Text as="p" size="sm" weight="semi-bold" color="neutral-08">
              CO₂e Reducido
            </Text>
            <Text as="p" size="xl" weight="semi-bold" color="green-05">
              {typeof certificateData.co2e_tons === 'bigint' 
                ? certificateData.co2e_tons.toString() 
                : certificateData.co2e_tons} toneladas
            </Text>
          </Box>

          <Box gap="xs">
            <Text as="p" size="sm" weight="semi-bold" color="neutral-08">
              Superficie No Quemada (SQ)
            </Text>
            <Text as="p" size="md">
              {typeof certificateData.hectares_not_burned === 'number' 
                ? certificateData.hectares_not_burned 
                : certificateData.hectares_not_burned} hectáreas
            </Text>
          </Box>

          <Box gap="xs">
            <Text as="p" size="sm" weight="semi-bold" color="neutral-08">
              Dirección del Verificador
            </Text>
            <Text as="p" size="md" style={{ fontFamily: 'monospace' }}>
              {truncateAddress(certificateData.verifier_address)}
            </Text>
          </Box>

          <Box gap="xs">
            <Text as="p" size="sm" weight="semi-bold" color="neutral-08">
              Dirección del Agricultor
            </Text>
            <Text as="p" size="md" style={{ fontFamily: 'monospace' }}>
              {truncateAddress(certificateData.farmer_address)}
            </Text>
          </Box>

          <Box gap="xs">
            <Text as="p" size="sm" weight="semi-bold" color="neutral-08">
              Hash del Informe MRV
            </Text>
            <Text as="p" size="sm" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {metadataHashHex}
            </Text>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default CertificateCard;

