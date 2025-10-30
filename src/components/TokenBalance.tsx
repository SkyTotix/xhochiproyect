import { Alert, Card, Loader, Text } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { useCarbonBalance } from "../hooks/useCarbonBalance";
import { useWallet } from "../hooks/useWallet";

/**
 * Componente para mostrar el balance de tokens CARBONXO (CXO) del usuario conectado
 * 
 * Este componente utiliza el hook useCarbonBalance para obtener y mostrar
 * el balance actual de tokens CXO de forma clara y amigable.
 * 
 * @returns JSX.Element
 */
export const TokenBalance = () => {
  const { address: publicKey } = useWallet();
  const { data: balance, isLoading, error } = useCarbonBalance();

  // Formatear el balance para mostrar
  const formatBalance = (balance: bigint | undefined): string => {
    if (balance === undefined) return "0";
    return balance.toLocaleString("es-MX");
  };

  // Si no hay billetera conectada
  if (!publicKey) {
    return (
      <Card>
        <Box gap="sm" direction="column">
          <Text as="h3" size="md" weight="semi-bold">
            Balance de Tokens CXO
          </Text>
          <Alert variant="info" placement="inline" title="Billetera no conectada">
            Conecte su billetera para ver el balance de tokens CARBONXO.
          </Alert>
        </Box>
      </Card>
    );
  }

  // Si está cargando
  if (isLoading) {
    return (
      <Card>
        <Box gap="sm" direction="column">
          <Text as="h3" size="md" weight="semi-bold">
            Balance de Tokens CXO
          </Text>
          <Box gap="sm" direction="row" align="center">
            <Loader />
            <Text as="p" size="sm" color="neutral-08">
              Cargando balance...
            </Text>
          </Box>
        </Box>
      </Card>
    );
  }

  // Si hay un error
  if (error) {
    return (
      <Card>
        <Box gap="sm" direction="column">
          <Text as="h3" size="md" weight="semi-bold">
            Balance de Tokens CXO
          </Text>
          <Alert variant="error" placement="inline" title="Error al cargar balance">
            {error instanceof Error
              ? error.message
              : "No se pudo cargar el balance de tokens. Por favor, intente más tarde."}
          </Alert>
        </Box>
      </Card>
    );
  }

  // Mostrar el balance
  return (
    <Card>
      <Box gap="md" direction="column">
        <Text as="h3" size="md" weight="semi-bold" color="neutral-08">
          Balance de Tokens CXO
        </Text>

        <Box gap="xs" direction="row" align="baseline">
          <Text as="p" size="4xl" weight="bold" color="neutral-09">
            {formatBalance(balance)}
          </Text>
          <Text as="p" size="lg" weight="semi-bold" color="neutral-08">
            CXO
          </Text>
        </Box>

        <Text as="p" size="xs" color="neutral-06">
          Tus tokens CARBONXO (CXO) están listos para usar
        </Text>
      </Box>
    </Card>
  );
};

export default TokenBalance;

