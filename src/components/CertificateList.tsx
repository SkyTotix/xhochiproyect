import React, { useState } from "react";
import { Alert, Button, Card, Input, Select, Text, Loader } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { CertificateCard } from "./CertificateCard";
import { useCertificates } from "../hooks/useCertificates";
import type { SortBy } from "../contracts/carbon_certifier";

/**
 * Componente de lista para mostrar certificados NFT de carbono
 * 
 * Este componente gestiona la visualización de una lista paginada y filtrada
 * de certificados NFT del contrato CarbonCertifier. Incluye:
 * - Filtrado por rango de CO2e
 * - Ordenamiento por diferentes criterios
 * - Paginación navegable
 * - Estados de carga y error
 * 
 * Utiliza el hook useCertificates para la lógica de datos y solo maneja
 * el estado de UI local (filtros, paginación, ordenamiento).
 * 
 * @returns Componente React que muestra la lista de certificados
 */
export const CertificateList: React.FC = () => {
  // Estados locales para la UI
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10); // Certificados por página
  const [minCo2e, setMinCo2e] = useState<string>("");
  const [maxCo2e, setMaxCo2e] = useState<string>("");
  const [sortByTag, setSortByTag] = useState<"Co2eTons" | "Hectares" | "CertificateId">("CertificateId");
  const [isDescending, setIsDescending] = useState(false);

  // Construir sortBy basado en el tag seleccionado
  const sortBy: SortBy = { tag: sortByTag, values: undefined };

  // Convertir inputs de string a número para el hook
  const minCo2eNum = minCo2e ? Number(minCo2e) : undefined;
  const maxCo2eNum = maxCo2e ? Number(maxCo2e) : undefined;

  // Hook de datos
  const { data, isLoading, error } = useCertificates({
    offset,
    limit,
    minCo2e: minCo2eNum,
    maxCo2e: maxCo2eNum,
    sortBy,
    isDescending,
  });

  // Handlers
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    // Scroll al inicio de la lista al cambiar de página
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousPage = () => {
    if (offset > 0) {
      handlePageChange(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (data && offset + limit < data.total) {
      handlePageChange(offset + limit);
    }
  };

  const handleClearFilters = () => {
    setMinCo2e("");
    setMaxCo2e("");
    setOffset(0);
  };

  const handleApplyFilters = () => {
    // Al aplicar filtros, volver a la primera página
    setOffset(0);
  };

  // Calcular información de paginación
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = data ? Math.ceil(Number(data.total) / limit) : 0;
  const hasFilters = minCo2e !== "" || maxCo2e !== "";

  return (
    <Box gap="lg">
      {/* Header */}
      <Box gap="sm">
        <Text as="h2" size="xl" weight="semi-bold">
          Mis Certificados de Carbono
        </Text>
        {data && (
          <Text as="p" size="md" color="neutral-08">
            Mostrando {data.certificateIds.length} de {Number(data.total)} certificados
          </Text>
        )}
      </Box>

      {/* Filtros y Controles */}
      <Card variant="secondary">
        <Box gap="md">
          <Text as="h3" size="lg" weight="semi-bold">
            Filtros y Ordenamiento
          </Text>

          <Box gap="md" direction="row" wrap="wrap" align="end">
            {/* Filtro por CO2e Mínimo */}
            <Box gap="xs" style={{ minWidth: "200px" }}>
              <Input
                label="CO₂e Mínimo (toneladas)"
                id="minCo2e"
                fieldSize="md"
                type="number"
                value={minCo2e}
                onChange={(e) => setMinCo2e(e.target.value)}
                placeholder="Ej: 100"
              />
            </Box>

            {/* Filtro por CO2e Máximo */}
            <Box gap="xs" style={{ minWidth: "200px" }}>
              <Input
                label="CO₂e Máximo (toneladas)"
                id="maxCo2e"
                fieldSize="md"
                type="number"
                value={maxCo2e}
                onChange={(e) => setMaxCo2e(e.target.value)}
                placeholder="Ej: 1000"
              />
            </Box>

            {/* Ordenar por */}
            <Box gap="xs" style={{ minWidth: "200px" }}>
              <Text as="label" size="sm" weight="semi-bold" htmlFor="sortBy">
                Ordenar por
              </Text>
              <Select
                id="sortBy"
                fieldSize="md"
                value={sortByTag}
                onChange={(e) => {
                  const value = e.target.value as "Co2eTons" | "Hectares" | "CertificateId";
                  setSortByTag(value);
                }}
              >
                <option value="CertificateId">ID del Certificado</option>
                <option value="Co2eTons">CO₂e Reducido</option>
                <option value="Hectares">Hectáreas No Quemadas</option>
              </Select>
            </Box>

            {/* Orden ascendente/descendente */}
            <Box gap="xs" style={{ minWidth: "180px" }}>
              <Text as="label" size="sm" weight="semi-bold" htmlFor="order">
                Orden
              </Text>
              <Select
                id="order"
                fieldSize="md"
                value={isDescending ? "desc" : "asc"}
                onChange={(e) => setIsDescending(e.target.value === "desc")}
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </Select>
            </Box>
          </Box>

          {/* Botones de acción */}
          <Box gap="sm" direction="row" wrap="wrap">
            <Button
              variant="primary"
              size="md"
              onClick={handleApplyFilters}
              disabled={!hasFilters}
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleClearFilters}
              disabled={!hasFilters}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Estado de carga */}
      {isLoading && (
        <Box gap="md" align="center" justify="center" style={{ minHeight: "200px" }}>
          <Loader />
          <Text as="p" size="md">
            Cargando certificados...
          </Text>
        </Box>
      )}

      {/* Estado de error */}
      {error && (
        <Alert variant="error" placement="inline" title="Error">
          {error instanceof Error ? error.message : "Error al cargar los certificados"}
        </Alert>
      )}

      {/* Lista de certificados */}
      {!isLoading && !error && data && (
        <>
          {data.certificateIds.length === 0 ? (
            <Alert variant="warning" placement="inline" title="Sin resultados">
              {hasFilters 
                ? "No se encontraron certificados que coincidan con los filtros aplicados."
                : "No tienes certificados de carbono aún."}
            </Alert>
          ) : (
            <Box gap="lg">
              {data.certificateIds.map((certificateId) => (
                <CertificateCard
                  key={typeof certificateId === 'number' ? certificateId : certificateId.toString()}
                  certificateId={certificateId}
                />
              ))}
            </Box>
          )}

          {/* Controles de paginación */}
          {data.certificateIds.length > 0 && totalPages > 1 && (
            <Card variant="secondary">
              <Box gap="md" direction="row" align="center" justify="space-between" wrap="wrap">
                <Text as="p" size="md">
                  Página {currentPage} de {totalPages}
                </Text>

                <Box gap="sm" direction="row" wrap="wrap">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handlePreviousPage}
                    disabled={offset === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleNextPage}
                    disabled={!data || offset + limit >= data.total}
                  >
                    Siguiente
                  </Button>
                </Box>
              </Box>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default CertificateList;

