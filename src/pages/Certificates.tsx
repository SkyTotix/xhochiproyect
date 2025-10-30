import { Layout, Text } from "@stellar/design-system";
import { Box } from "../components/layout/Box";
import { CertificateList } from "../components/CertificateList";

/**
 * Página de Certificados
 * 
 * Vista completa de todos los certificados del usuario con filtros,
 * ordenamiento y paginación.
 * 
 * @returns JSX.Element
 */
export const Certificates = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <Box gap="lg" direction="column">
          <Box gap="md" direction="column">
            <Text as="h1" size="3xl" weight="bold">
              Mis Certificados de Carbono
            </Text>
            <Text as="p" size="md" color="neutral-08">
              Gestiona y visualiza todos tus certificados NFT de reducción de CO₂
            </Text>
          </Box>

          <CertificateList />
        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Certificates;

