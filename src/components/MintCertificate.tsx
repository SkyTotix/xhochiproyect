import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Alert,
  Button,
  Card,
  Input,
  Loader,
  Text,
} from "@stellar/design-system";
import { Box } from "./layout/Box";
import { Buffer } from "buffer";
import carbonCertifier from "../contracts/carbon_certifier";
import { useVerifierRole } from "../hooks/useVerifierRole";
import { useWallet } from "../hooks/useWallet";

/**
 * Schema de validación Zod para el formulario de acuñación de certificado
 */
const mintCertificateSchema = z.object({
  certificate_id: z
    .number()
    .int()
    .positive("El ID del certificado debe ser un número positivo"),
  farmer_address: z
    .string()
    .min(1, "La dirección del agricultor es requerida")
    .regex(
      /^G[A-Z0-9]{55}$/,
      "La dirección debe ser un Stellar Public Key válido (G...)"
    ),
  hectares_not_burned: z
    .number()
    .int()
    .positive("Las hectáreas deben ser un número positivo"),
  co2e_tons: z
    .number()
    .positive("Las toneladas de CO2e deben ser un número positivo"),
  metadata_hash: z
    .string()
    .min(1, "El hash MRV es requerido")
    .length(64, "El hash debe ser de 64 caracteres hexadecimales")
    .regex(/^[0-9a-fA-F]{64}$/, "El hash debe ser hexadecimal"),
});

type MintCertificateFormData = z.infer<typeof mintCertificateSchema>;

/**
 * Componente para acuñar un nuevo certificado NFT de carbono
 * 
 * Este componente permite a un verificador autorizado (admin) acuñar
 * un certificado de verificación de carbono usando la función mint_certificate
 * del contrato CarbonCertifier.
 * 
 * @returns JSX.Element
 */
export const MintCertificate = () => {
  const { address } = useWallet();
  const { data: isAdmin, isLoading: isLoadingRole } = useVerifierRole();

  // Estado del formulario
  const [formData, setFormData] = useState<MintCertificateFormData>({
    certificate_id: 1,
    farmer_address: "",
    hectares_not_burned: 0,
    co2e_tons: 0,
    metadata_hash: "",
  });

  // Estado de errores de validación
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof MintCertificateFormData, string>>
  >({});

  // Mutación para acuñar el certificado
  const mintMutation = useMutation({
    mutationFn: async (data: MintCertificateFormData) => {
      if (!address) {
        throw new Error("No hay billetera conectada");
      }

      if (!isAdmin) {
        throw new Error("No tienes permisos de administrador");
      }

      // Convertir metadata_hash de hex string a Buffer
      const metadataHashBuffer = Buffer.from(data.metadata_hash, "hex");

      if (metadataHashBuffer.length !== 32) {
        throw new Error(
          "El hash debe tener exactamente 32 bytes (64 caracteres hex)"
        );
      }

      // Construir VerificationRecord
      const record = {
        verifier_address: address, // El verificador es el admin que firmó
        farmer_address: data.farmer_address,
        hectares_not_burned: data.hectares_not_burned,
        co2e_tons: BigInt(data.co2e_tons),
        metadata_hash: metadataHashBuffer,
      };

      // Llamar a mint_certificate - esto solo simula por defecto
      const tx = await carbonCertifier.mint_certificate({
        certificate_id: data.certificate_id,
        record,
      });

      // Firmar y enviar la transacción
      const result = await tx.signAndSend();

      if (result.result.isErr()) {
        throw new Error(result.result.unwrapErr().toString());
      }

      return result.result.unwrap();
    },
    onSuccess: () => {
      // Limpiar el formulario después de éxito
      setFormData({
        certificate_id: formData.certificate_id + 1, // Incrementar ID para el siguiente
        farmer_address: "",
        hectares_not_burned: 0,
        co2e_tons: 0,
        metadata_hash: "",
      });
      setFormErrors({});
    },
  });

  /**
   * Maneja el cambio de valor en los campos del formulario
   */
  const handleChange = (field: keyof MintCertificateFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error de este campo
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Valida el formulario usando Zod
   */
  const validateForm = (): boolean => {
    const result = mintCertificateSchema.safeParse(formData);

    if (!result.success) {
      // Mapear errores de Zod a nuestro formato
      const errors: Partial<Record<keyof MintCertificateFormData, string>> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof MintCertificateFormData;
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    mintMutation.mutate(formData);
  };

  // Mientras se carga el rol
  if (isLoadingRole) {
    return (
      <Card>
        <Box gap="md" direction="column">
          <Loader />
          <Text as="p" size="md" color="neutral-08">
            Verificando permisos...
          </Text>
        </Box>
      </Card>
    );
  }

  // Si no hay usuario conectado
  if (!address) {
    return (
      <Card>
        <Box gap="md" direction="column">
          <Alert variant="warning" placement="inline" title="Billetera no conectada">
            Debes conectar tu billetera para acuñar certificados.
          </Alert>
        </Box>
      </Card>
    );
  }

  // Si el usuario no es admin
  if (!isAdmin) {
    return (
      <Card>
        <Box gap="md" direction="column">
          <Alert variant="error" placement="inline" title="Acceso Denegado">
            Solo los verificadores autorizados pueden acuñar certificados.
            Tu dirección actual no tiene permisos de administrador.
          </Alert>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box gap="md" direction="column">
        <Text as="h2" size="lg" weight="semi-bold">
          Formulario de Acuñación
        </Text>

        <Text as="p" size="sm" color="neutral-08">
          Completa el formulario con los datos del certificado de verificación
          de carbono. Todos los campos son obligatorios.
        </Text>

        <form onSubmit={handleSubmit}>
          <Box gap="md" direction="column">
            {/* Campo: certificate_id */}
            <Input
              id="certificate_id"
              label="ID del Certificado"
              type="number"
              fieldSize="md"
              value={formData.certificate_id.toString()}
              error={formErrors.certificate_id}
              onChange={(e) =>
                handleChange("certificate_id", parseInt(e.target.value, 10) || 0)
              }
              disabled={mintMutation.isPending}
            />

            {/* Campo: farmer_address */}
            <Input
              id="farmer_address"
              label="Dirección del Agricultor"
              fieldSize="md"
              placeholder="G..."
              value={formData.farmer_address}
              error={formErrors.farmer_address}
              onChange={(e) => handleChange("farmer_address", e.target.value)}
              disabled={mintMutation.isPending}
            />

            {/* Campo: hectares_not_burned */}
            <Input
              id="hectares_not_burned"
              label="Superficie No Quemada (hectáreas)"
              type="number"
              fieldSize="md"
              value={formData.hectares_not_burned.toString()}
              error={formErrors.hectares_not_burned}
              onChange={(e) =>
                handleChange(
                  "hectares_not_burned",
                  parseInt(e.target.value, 10) || 0
                )
              }
              disabled={mintMutation.isPending}
            />

            {/* Campo: co2e_tons */}
            <Input
              id="co2e_tons"
              label="Toneladas de CO2e"
              type="number"
              fieldSize="md"
              step="0.01"
              value={formData.co2e_tons.toString()}
              error={formErrors.co2e_tons}
              onChange={(e) =>
                handleChange("co2e_tons", parseFloat(e.target.value) || 0)
              }
              disabled={mintMutation.isPending}
            />

            {/* Campo: metadata_hash */}
            <Input
              id="metadata_hash"
              label="Hash MRV (64 caracteres hex)"
              fieldSize="md"
              placeholder="0000000000000000000000000000000000000000000000000000000000000000"
              value={formData.metadata_hash}
              error={formErrors.metadata_hash}
              onChange={(e) => handleChange("metadata_hash", e.target.value)}
              disabled={mintMutation.isPending}
              maxLength={64}
            />

            {/* Mensajes de éxito/error */}
            {mintMutation.isSuccess && (
              <Alert variant="success" placement="inline" title="Certificado acuñado">
                El certificado ha sido acuñado exitosamente.
              </Alert>
            )}

            {mintMutation.isError && (
              <Alert variant="error" placement="inline" title="Error al acuñar">
                {mintMutation.error instanceof Error
                  ? mintMutation.error.message
                  : "Error desconocido al acuñar el certificado"}
              </Alert>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={mintMutation.isPending}
              disabled={mintMutation.isPending}
            >
              Acuñar Certificado
            </Button>
          </Box>
        </form>
      </Box>
    </Card>
  );
};

export default MintCertificate;

