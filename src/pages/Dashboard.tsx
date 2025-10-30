import { Link } from "react-router-dom";
import { Button, Card, Layout, Text, Badge, Loader } from "@stellar/design-system";
import { Box } from "../components/layout/Box";
import { useWallet } from "../hooks/useWallet";
import { useGlobalMetrics } from "../hooks/useGlobalMetrics";
import { useVerifierRole } from "../hooks/useVerifierRole";
import { useCarbonBalance } from "../hooks/useCarbonBalance";
import { TokenBalance } from "../components/TokenBalance";
import { CertificateList } from "../components/CertificateList";
import { CertificateCard } from "../components/CertificateCard";

/**
 * Dashboard principal del proyecto de tokenización de carbono
 * 
 * Esta página proporciona una vista resumida del estado del usuario conectado
 * y las métricas globales del proyecto, sirviendo como centro de navegación
 * para el resto de la aplicación.
 * 
 * @returns JSX.Element
 */
export const Dashboard = () => {
  const { address } = useWallet();
  const { data: isAdmin } = useVerifierRole();
  const { data: balance } = useCarbonBalance();
  const { totalCertificates, totalCo2e, isLoading, error } = useGlobalMetrics();

  // Formatear métricas para mostrar
  const formatNumber = (num: bigint | number | undefined): string => {
    if (num === undefined) return "0";
    return typeof num === "bigint" ? num.toLocaleString("es-MX") : num.toLocaleString("es-MX");
  };

  const formatCo2e = (co2e: bigint | undefined): string => {
    if (co2e === undefined) return "0";
    return co2e.toLocaleString("es-MX");
  };

  return (
    <Layout.Content>
      <Layout.Inset>
        <Box gap="xl" direction="column">
          {/* Header del Dashboard */}
          <Box gap="md" direction="column">
            <Text as="h1" size="3xl" weight="bold">
              Dashboard de Tokenización de Carbono
            </Text>
            <Text as="p" size="md" color="neutral-08">
              Proyecto de reducción de emisiones CO2e mediante caña de azúcar sin
              quemar en Xochitepec, Morelos
            </Text>
          </Box>

      {/* Mensaje de bienvenida si no hay wallet conectada */}
      {!address && (
        <Card variant="secondary">
          <Box gap="sm" direction="column">
            <Text as="h3" size="lg" weight="semi-bold">
              Bienvenido a CARBONXO
            </Text>
            <Text as="p" size="md" color="neutral-08">
              Conecta tu billetera para comenzar a tokenizar créditos de
              carbono y participar en el mercado de compensación.
            </Text>
          </Box>
        </Card>
      )}

      {/* Balance de Tokens CXO */}
      {address && (
        <Box gap="md" direction="column">
          <TokenBalance />
        </Box>
      )}

      {/* Call-to-Actions Condicionales */}
      {address && (
        <Box gap="md" direction="row" wrap="wrap">
          {isAdmin && (
            <Button as={Link} to="/mint" variant="primary" size="md">
              Acuñar Nuevo Certificado
            </Button>
          )}
          {balance && balance > BigInt(0) && (
            <Button as={Link} to="/transfer" variant="secondary" size="md">
              Transferir Tokens CXO
            </Button>
          )}
        </Box>
      )}

      {/* Métricas Globales */}
      <Box gap="md" direction="column">
        <Text as="h2" size="xl" weight="bold">
          Métricas del Proyecto
        </Text>

        {isLoading && (
          <Card>
            <Box gap="sm" direction="row" align="center">
              <Loader />
              <Text as="p" size="md" color="neutral-08">
                Cargando métricas...
              </Text>
            </Box>
          </Card>
        )}

        {error && (
          <Card variant="secondary">
            <Text as="p" size="md" color="neutral-08">
              No se pudieron cargar las métricas. Por favor, intente más tarde.
            </Text>
          </Card>
        )}

        {!isLoading && !error && (
          <Box gap="md" direction="row" wrap="wrap">
            {/* Card: Total de Certificados */}
            <Card flex="1 1 300px">
              <Box gap="sm" direction="column">
                <Box gap="xs" direction="row" align="center">
                  <Text as="p" size="md" color="neutral-08" weight="semi-bold">
                    Certificados Totales
                  </Text>
                  <Badge variant="primary">
                    Acuñados
                  </Badge>
                </Box>
                <Text as="p" size="3xl" weight="bold" color="neutral-09">
                  {formatNumber(totalCertificates)}
                </Text>
                <Text as="p" size="xs" color="neutral-06">
                  Certificados NFT verificados en blockchain
                </Text>
              </Box>
            </Card>

            {/* Card: Total de CO2e Reducido */}
            <Card flex="1 1 300px">
              <Box gap="sm" direction="column">
                <Box gap="xs" direction="row" align="center">
                  <Text as="p" size="md" color="neutral-08" weight="semi-bold">
                    CO2e Reducido
                  </Text>
                  <Badge variant="success">
                    Total
                  </Badge>
                </Box>
                <Text as="p" size="3xl" weight="bold" color="neutral-09">
                  {formatCo2e(totalCo2e)}
                </Text>
                <Text as="p" size="xs" color="neutral-06">
                  Toneladas de CO2e compensadas
                </Text>
              </Box>
            </Card>
          </Box>
        )}
      </Box>

      {/* Lista de Certificados Recientes */}
      {address && (
        <Box gap="md" direction="column">
          <Box gap="sm" direction="row" align="center" justify="space-between">
            <Text as="h2" size="xl" weight="bold">
              Mis Certificados
            </Text>
            <Button as={Link} to="/certificates" variant="tertiary" size="sm">
              Ver todos
            </Button>
          </Box>
          <CertificateList />
        </Box>
      )}
        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Dashboard;

