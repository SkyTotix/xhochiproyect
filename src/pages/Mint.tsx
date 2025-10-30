import { Layout, Text } from "@stellar/design-system";
import { Box } from "../components/layout/Box";
import MintCertificate from "../components/MintCertificate";

/**
 * Página de Acuñación de Certificados
 * 
 * Esta página es un wrapper para el componente MintCertificate,
 * proporcionando un contexto visual claro para el proceso de acuñación.
 * 
 * @returns JSX.Element
 */
export const Mint = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <Box gap="lg" direction="column">
          {/* Título y descripción de la página */}
          <Box gap="md" direction="column">
            <Text as="h1" size="xl" weight="bold">
              Acuñar Nuevo Certificado de Carbono
            </Text>
            <Text as="p" size="md" color="neutral-08">
              Como verificador autorizado, puedes crear certificados NFT de reducción de CO₂
              basados en la metodología CONADESUCA para caña de azúcar sin quemar en Xochitepec.
            </Text>
          </Box>

          {/* Componente de formulario de acuñación */}
          <MintCertificate />
        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Mint;

