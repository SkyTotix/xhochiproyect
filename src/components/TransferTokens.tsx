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
import carbonToken from "../contracts/carbon_token";
import { useWallet } from "../hooks/useWallet";

/**
 * Schema de validación Zod para el formulario de transferencia de tokens
 */
const transferTokensSchema = z.object({
  destination: z
    .string()
    .min(1, "La dirección de destino es requerida")
    .regex(
      /^G[A-Z0-9]{55}$/,
      "La dirección debe ser un Stellar Public Key válido (G...)"
    ),
  amount: z
    .number()
    .positive("La cantidad debe ser un número positivo")
    .gt(0, "La cantidad debe ser mayor que 0"),
});

type TransferTokensFormData = z.infer<typeof transferTokensSchema>;

/**
 * Componente para transferir tokens CARBONXO (CXO) a otra dirección
 * 
 * Este componente permite al usuario conectado transferir tokens CXO
 * a otra dirección usando la función `transfer` del contrato CarbonToken.
 * 
 * @returns JSX.Element
 */
export const TransferTokens = () => {
  const { address } = useWallet();

  // Estado del formulario
  const [formData, setFormData] = useState<TransferTokensFormData>({
    destination: "",
    amount: 0,
  });

  // Estado de errores de validación
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof TransferTokensFormData, string>>
  >({});

  // Mutación para transferir tokens
  const transferMutation = useMutation({
    mutationFn: async (data: TransferTokensFormData) => {
      if (!address) {
        throw new Error("No hay billetera conectada");
      }

      // Llamar a transfer con from (address del usuario), to (destination) y amount
      const tx = await carbonToken.transfer({
        from: address,
        to: data.destination,
        amount: BigInt(Math.floor(data.amount)), // Convertir a BigInt (i128)
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
        destination: "",
        amount: 0,
      });
      setFormErrors({});
    },
  });

  /**
   * Maneja el cambio de valor en los campos del formulario
   */
  const handleChange = (
    field: keyof TransferTokensFormData,
    value: string | number
  ) => {
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
    const result = transferTokensSchema.safeParse(formData);

    if (!result.success) {
      // Mapear errores de Zod a nuestro formato
      const errors: Partial<
        Record<keyof TransferTokensFormData, string>
      > = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof TransferTokensFormData;
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

    transferMutation.mutate(formData);
  };

  // Si no hay usuario conectado
  if (!address) {
    return (
      <Card>
        <Box gap="md" direction="column">
          <Alert variant="warning" placement="inline" title="Billetera no conectada">
            Debes conectar tu billetera para transferir tokens CXO.
          </Alert>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box gap="md" direction="column">
        <Text as="h2" size="lg" weight="semi-bold">
          Formulario de Transferencia
        </Text>

        <Text as="p" size="sm" color="neutral-08">
          Transfiere tokens CARBONXO a otra dirección Stellar. Todos los campos
          son obligatorios.
        </Text>

        <form onSubmit={handleSubmit}>
          <Box gap="md" direction="column">
            {/* Campo: destination */}
            <Input
              id="destination"
              label="Dirección de Destino"
              fieldSize="md"
              placeholder="G..."
              value={formData.destination}
              error={formErrors.destination}
              onChange={(e) => handleChange("destination", e.target.value)}
              disabled={transferMutation.isPending}
            />

            {/* Campo: amount */}
            <Input
              id="amount"
              label="Cantidad de Tokens CXO"
              type="number"
              fieldSize="md"
              step="0.01"
              value={formData.amount.toString()}
              error={formErrors.amount}
              onChange={(e) =>
                handleChange("amount", parseFloat(e.target.value) || 0)
              }
              disabled={transferMutation.isPending}
            />

            {/* Mensajes de éxito/error */}
            {transferMutation.isSuccess && (
              <Alert variant="success" placement="inline" title="Transferencia exitosa">
                Los tokens han sido transferidos exitosamente.
              </Alert>
            )}

            {transferMutation.isError && (
              <Alert
                variant="error"
                placement="inline"
                title="Error al transferir"
              >
                {transferMutation.error instanceof Error
                  ? transferMutation.error.message
                  : "Error desconocido al transferir los tokens"}
              </Alert>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={transferMutation.isPending}
              disabled={transferMutation.isPending}
            >
              Transferir Tokens
            </Button>
          </Box>
        </form>
      </Box>
    </Card>
  );
};

export default TransferTokens;

