import { Layout, Text } from "@stellar/design-system";
import { Box } from "../components/layout/Box";
import TransferTokens from "../components/TransferTokens";

/**
 * Página de Transferencia de Tokens
 * 
 * Esta página es un wrapper para el componente TransferTokens,
 * proporcionando un contexto visual claro para el proceso de transferencia
 * de tokens CARBONXO (CXO).
 * 
 * @returns JSX.Element
 */
export const Transfer = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <Box gap="lg" direction="column">
          {/* Título y descripción de la página */}
          <Box gap="md" direction="column">
            <Text as="h1" size="xl" weight="bold">
              Transferir Tokens CARBONXO (CXO)
            </Text>
            <Text as="p" size="md" color="neutral-08">
              Transfiere tus tokens CXO a otra dirección Stellar. Todas las transacciones
              se ejecutan de forma segura en la blockchain de Stellar.
            </Text>
          </Box>

          {/* Componente de formulario de transferencia */}
          <TransferTokens />
        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Transfer;

