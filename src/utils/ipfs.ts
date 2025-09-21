import { experimental_createEffect, S, type EffectContext } from "envio";
import {
  ipfsMetadataSchema,
  relationshipSchema,
  structureSchema,
  addressSchema,
  propertySchema,
  ipfsFactSheetSchema,
  lotDataSchema,
  salesHistorySchema,
  taxSchema,
  utilitySchema,
  type IpfsMetadata,
  type RelationshipData,
  type StructureData,
  type AddressData,
  type PropertyData,
  type IpfsFactSheetData,
  type LotData,
  type SalesHistoryData,
  type TaxData,
  type UtilityData
} from "./schemas";

// Convert bytes32 to CID (same as subgraph implementation)
export function bytes32ToCID(dataHashHex: string): string {
  // Remove 0x prefix if present
  const cleanHex = dataHashHex.startsWith('0x') ? dataHashHex.slice(2) : dataHashHex;

  // Convert hex string to bytes
  const hashBytes = new Uint8Array(
      cleanHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );

  // Create multihash (sha256 + 32 bytes + hash)
  const multihash = new Uint8Array(34);
  multihash[0] = 0x12; // sha256
  multihash[1] = 0x20; // 32 bytes

  for (let i = 0; i < 32; i++) {
    multihash[i + 2] = hashBytes[i];
  }

  // Create CID data (v1 + raw codec + multihash)
  const cidData = new Uint8Array(36);
  cidData[0] = 0x01; // CID v1
  cidData[1] = 0x55; // raw codec

  for (let i = 0; i < 34; i++) {
    cidData[i + 2] = multihash[i];
  }

  // Base32 encode
  const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
  let output = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cidData.length; i++) {
    value = (value << 8) | cidData[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return "b" + output;
}

// Gateway configuration with optional authentication tokens
const endpoints = [
  // Multiple public gateways for reliability
  { url: "https://sapphire-academic-leech-250.mypinata.cloud/ipfs", token: "CcV1DorYnAo9eZr_P4DXg8TY4SB-QuUw_b6C70JFs2M8aY0fJudBnle2mUyCYyTu" },
  { url: "https://moral-aqua-catfish.myfilebase.com/ipfs", token: null },
  { url: "https://ipfs.io/ipfs", token: null },
  { url: "https://bronze-blank-cod-736.mypinata.cloud/ipfs", token: "0EicEGVVMxNrYgog3s1-Aud_3v32eSvF9nYypTkQ4Qy-G4M8N-zdBvL1DNYjlupe" },
  { url: "https://ipfs.io/ipfs", token: null },
  { url: "https://indexing2.myfilebase.com/ipfs", token: null },
  { url: "https://gateway.ipfs.io/ipfs", token: null },
  { url: "https://dweb.link/ipfs", token: null },
  { url: "https://w3s.link/ipfs", token: null },
  { url: "https://gateway.pinata.cloud/ipfs", token: null },
];

// Helper function to build URL with optional token
function buildGatewayUrl(baseUrl: string, cid: string, token: string | null): string {
  const url = `${baseUrl}/${cid}`;
  if (token) {
    return `${url}?pinataGatewayToken=${token}`;
  }
  return url;
}

async function fetchFromEndpoint(
    context: EffectContext,
    endpoint: { url: string; token: string | null },
    cid: string
): Promise<IpfsMetadata | null> {
  try {
    const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
    context.log.info(`Fetching IPFS content from gateway`, { cid, endpoint: endpoint.url });

    const response = await fetch(fullUrl);

    if (response.ok) {
      const metadata: any = await response.json();

      // Extract label from metadata
      if (metadata && typeof metadata === 'object' && metadata.label && typeof metadata.label === 'string') {
        context.log.info(`Successfully fetched IPFS metadata`, { cid, label: metadata.label });
        return {
          label: metadata.label,
          relationships: metadata.relationships
        };
      } else {
        context.log.warn(`No label field found in IPFS metadata`, { cid, endpoint: endpoint.url });
        return null;
      }
    } else {
      if (response.status === 429) {
        context.log.warn(`Rate limited by IPFS gateway`, { cid, endpoint: endpoint.url });
      } else {
        context.log.warn(`IPFS gateway returned error`, {
          cid,
          endpoint: endpoint.url,
          status: response.status,
          statusText: response.statusText
        });
      }
      return null;
    }
  } catch (e) {
    const error = e as Error;
    context.log.warn(`IPFS fetch failed`, {
      cid,
      endpoint: endpoint.url,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      errorCause: error.cause
    });
    return null;
  }
}

// Fetch relationship data (from/to structure)
export const getRelationshipData = experimental_createEffect(
    {
      name: "getRelationshipData",
      input: S.string,
      output: relationshipSchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching relationship data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && data.to && data.to["/"]) {
              context.log.info(`Successfully fetched relationship data`, { cid });
              return data;
            }
          } else {
            context.log.warn(`Relationship data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch relationship data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorName: error.name,
            errorStack: error.stack,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch relationship data for CID: ${cid}`);
    }
);

// Fetch structure data (roof_date)
export const getStructureData = experimental_createEffect(
    {
      name: "getStructureData",
      input: S.string,
      output: structureSchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching structure data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched structure data`, { cid, roof_date: data.roof_date });
              return {
                // Original field
                roof_date: data.roof_date || undefined,
                architectural_style_type: data.architectural_style_type || undefined,
                attachment_type: data.attachment_type || undefined,
                ceiling_condition: data.ceiling_condition || undefined,
                ceiling_height_average: data.ceiling_height_average || undefined,
                ceiling_insulation_type: data.ceiling_insulation_type || undefined,
                ceiling_structure_material: data.ceiling_structure_material || undefined,
                ceiling_surface_material: data.ceiling_surface_material || undefined,
                exterior_door_material: data.exterior_door_material || undefined,
                exterior_wall_condition: data.exterior_wall_condition || undefined,
                exterior_wall_insulation_type: data.exterior_wall_insulation_type || undefined,
                exterior_wall_material_primary: data.exterior_wall_material_primary || undefined,
                exterior_wall_material_secondary: data.exterior_wall_material_secondary || undefined,
                flooring_condition: data.flooring_condition || undefined,
                flooring_material_primary: data.flooring_material_primary || undefined,
                flooring_material_secondary: data.flooring_material_secondary || undefined,
                foundation_condition: data.foundation_condition || undefined,
                foundation_material: data.foundation_material || undefined,
                foundation_type: data.foundation_type || undefined,
                foundation_waterproofing: data.foundation_waterproofing || undefined,
                gutters_condition: data.gutters_condition || undefined,
                gutters_material: data.gutters_material || undefined,
                interior_door_material: data.interior_door_material || undefined,
                interior_wall_condition: data.interior_wall_condition || undefined,
                interior_wall_finish_primary: data.interior_wall_finish_primary || undefined,
                interior_wall_finish_secondary: data.interior_wall_finish_secondary || undefined,
                interior_wall_structure_material: data.interior_wall_structure_material || undefined,
                interior_wall_surface_material_primary: data.interior_wall_surface_material_primary || undefined,
                interior_wall_surface_material_secondary: data.interior_wall_surface_material_secondary || undefined,
                number_of_stories: data.number_of_stories || undefined,
                primary_framing_material: data.primary_framing_material || undefined,
                request_identifier: data.request_identifier || undefined,
                roof_age_years: data.roof_age_years || undefined,
                roof_condition: data.roof_condition || undefined,
                roof_covering_material: data.roof_covering_material || undefined,
                roof_design_type: data.roof_design_type || undefined,
                roof_material_type: data.roof_material_type || undefined,
                roof_structure_material: data.roof_structure_material || undefined,
                roof_underlayment_type: data.roof_underlayment_type || undefined,
                secondary_framing_material: data.secondary_framing_material || undefined,
                structural_damage_indicators: data.structural_damage_indicators || undefined,
                subfloor_material: data.subfloor_material || undefined,
                window_frame_material: data.window_frame_material || undefined,
                window_glazing_type: data.window_glazing_type || undefined,
                window_operation_type: data.window_operation_type || undefined,
                window_screen_material: data.window_screen_material || undefined,
              };
            }
          } else {
            context.log.warn(`Structure data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch structure data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorName: error.name,
            errorStack: error.stack,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch structure data for CID: ${cid}`);
    }
);

// Fetch address data
export const getAddressData = experimental_createEffect(
    {
      name: "getAddressData",
      input: S.string,
      output: addressSchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching address data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched address data`, {
                cid,
                county_name: data.county_name
              });

              return {
                request_identifier: data.request_identifier || undefined,
                block: data.block || undefined,
                city_name: data.city_name || undefined,
                country_code: data.country_code || undefined,
                county_name: data.county_name || undefined,
                latitude: data.latitude || undefined,
                longitude: data.longitude || undefined,
                lot: data.lot || undefined,
                municipality_name: data.municipality_name || undefined,
                plus_four_postal_code: data.plus_four_postal_code || undefined,
                postal_code: data.postal_code || undefined,
                range: data.range || undefined,
                route_number: data.route_number || undefined,
                section: data.section || undefined,
                state_code: data.state_code || undefined,
                street_name: data.street_name || undefined,
                street_number: data.street_number || undefined,
                street_post_directional_text: data.street_post_directional_text || undefined,
                street_pre_directional_text: data.street_pre_directional_text || undefined,
                street_suffix_type: data.street_suffix_type || undefined,
                township: data.township || undefined,
                unit_identifier: data.unit_identifier || undefined,
              };
            }
          } else {
            context.log.warn(`Address data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch address data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorName: error.name,
            errorStack: error.stack,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch address data for CID: ${cid}`);
    }
);

// Fetch property data (property_type, built years)
export const getPropertyData = experimental_createEffect(
    {
      name: "getPropertyData",
      input: S.string,
      output: propertySchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching property data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched property data`, {
                cid,
                property_type: data.property_type,
                property_structure_built_year: data.property_structure_built_year,
                property_effective_built_year: data.property_effective_built_year
              });

              return {
                property_type: data.property_type || undefined,
                property_structure_built_year: data.property_structure_built_year ? String(data.property_structure_built_year) : undefined,
                property_effective_built_year: data.property_effective_built_year ? String(data.property_effective_built_year) : undefined,
                parcel_identifier: data.parcel_identifier || undefined,
                area_under_air: data.area_under_air || undefined,
                historic_designation: data.historic_designation || undefined,
                livable_floor_area: data.livable_floor_area || undefined,
                number_of_units: data.number_of_units || undefined,
                number_of_units_type: data.number_of_units_type || undefined,
                property_legal_description_text: data.property_legal_description_text || undefined,
                request_identifier: data.request_identifier || undefined,
                subdivision: data.subdivision || undefined,
                total_area: data.total_area || undefined,
                zoning: data.zoning || undefined,
              };
            }
          } else {
            context.log.warn(`Property data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch property data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorName: error.name,
            errorStack: error.stack,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch property data for CID: ${cid}`);
    }
);

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  delayBetweenEndpoints: 2000, // 2 seconds between trying different gateways
  delayOn429: 10000, // 10 seconds when rate limited
  delayOnError: 10000, // 10 seconds on other errors
  maxRetries: 1, // Max retries per endpoint (reduced to avoid too many failures)
};

// Fetch fact sheet data (ipfs_url and full_generation_command)
export const getIpfsFactSheetData = experimental_createEffect(
    {
      name: "getIpfsFactSheetData",
      input: S.string,
      output: ipfsFactSheetSchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching fact sheet data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched fact sheet data`, {
                cid,
                ipfs_url: data.ipfs_url
              });

              return {
                ipfs_url: data.ipfs_url || undefined,
                full_generation_command: data.full_generation_command || undefined,
              };
            }
          } else {
            context.log.warn(`Fact sheet data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch fact sheet data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorName: error.name,
            errorStack: error.stack,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch fact sheet data for CID: ${cid}`);
    }
);

export const getIpfsMetadata = experimental_createEffect(
    {
      name: "getIpfsMetadata",
      input: S.string,
      output: ipfsMetadataSchema,
      cache: true, // Enable caching for better performance
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        // Try each endpoint with retries
        for (let retry = 0; retry < RATE_LIMIT_CONFIG.maxRetries; retry++) {
          const metadata = await fetchFromEndpoint(context, endpoint, cid);
          if (metadata) {
            return metadata;
          }

          // Delay before retry (except on last retry of last endpoint)
          if (retry < RATE_LIMIT_CONFIG.maxRetries - 1) {
            const delay = RATE_LIMIT_CONFIG.delayOnError;
            context.log.info(`Retrying endpoint in ${delay}ms`, { endpoint, retry: retry + 1 });
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // Delay between endpoints (except for last endpoint)
        if (i < endpoints.length - 1) {
          context.log.info(`Trying next endpoint in ${RATE_LIMIT_CONFIG.delayBetweenEndpoints}ms`);
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      // All endpoints failed - throw error to prevent corrupted data
      context.log.error("Unable to fetch IPFS metadata from all gateways", { cid });
      throw new Error(`Failed to fetch IPFS content for CID: ${cid}`);
    }
);


export const getLotData = experimental_createEffect(
    {
      name: "getLotData",
      input: S.string,
      output: lotDataSchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching lot data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched lot data`, {
                cid,
                lot_type: data.lot_type,
                lot_area_sqft: data.lot_area_sqft
              });

              return {
                driveway_condition: data.driveway_condition || undefined,
                driveway_material: data.driveway_material || undefined,
                fence_height: data.fence_height || undefined,
                fence_length: data.fence_length || undefined,
                fencing_type: data.fencing_type || undefined,
                landscaping_features: data.landscaping_features || undefined,
                lot_area_sqft: data.lot_area_sqft || undefined,
                lot_condition_issues: data.lot_condition_issues || undefined,
                lot_length_feet: data.lot_length_feet || undefined,
                lot_size_acre: data.lot_size_acre || undefined,
                lot_type: data.lot_type || undefined,
                lot_width_feet: data.lot_width_feet || undefined,
                request_identifier: data.request_identifier || undefined,
                view: data.view || undefined,
              };
            }
          } else {
            context.log.warn(`Lot data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch lot data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch lot data for CID: ${cid}`);
    }
);

export const getSalesHistoryData = experimental_createEffect(
    {
      name: "getSalesHistoryData",
      input: S.string,
      output: salesHistorySchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching sales history data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched sales history data`, {
                cid,
                ownership_transfer_date: data.ownership_transfer_date,
                purchase_price_amount: data.purchase_price_amount,
                sale_type: data.sale_type
              });

              return {
                ownership_transfer_date: data.ownership_transfer_date || undefined,
                purchase_price_amount: data.purchase_price_amount || undefined,
                request_identifier: data.request_identifier || undefined,
                sale_type: data.sale_type || undefined,
              };
            }
          } else {
            context.log.warn(`Sales history data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch sales history data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch sales history data for CID: ${cid}`);
    }
);

export const getTaxData = experimental_createEffect(
    {
      name: "getTaxData",
      input: S.string,
      output: taxSchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching tax data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched tax data`, {
                cid,
                tax_year: data.tax_year,
                property_assessed_value_amount: data.property_assessed_value_amount,
                property_market_value_amount: data.property_market_value_amount,
                property_taxable_value_amount: data.property_taxable_value_amount
              });

              return {
                first_year_building_on_tax_roll: data.first_year_building_on_tax_roll || undefined,
                first_year_on_tax_roll: data.first_year_on_tax_roll || undefined,
                monthly_tax_amount: data.monthly_tax_amount || undefined,
                period_end_date: data.period_end_date || undefined,
                period_start_date: data.period_start_date || undefined,
                property_assessed_value_amount: data.property_assessed_value_amount,
                property_building_amount: data.property_building_amount || undefined,
                property_land_amount: data.property_land_amount || undefined,
                property_market_value_amount: data.property_market_value_amount,
                property_taxable_value_amount: data.property_taxable_value_amount,
                request_identifier: data.request_identifier || undefined,
                tax_year: data.tax_year || undefined,
                yearly_tax_amount: data.yearly_tax_amount || undefined,
              };
            }
          } else {
            context.log.warn(`Tax data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch tax data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch tax data for CID: ${cid}`);
    }
);

export const getUtilityData = experimental_createEffect(
    {
      name: "getUtilityData",
      input: S.string,
      output: utilitySchema,
      cache: true,
    },
    async ({ input: cid, context }) => {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        try {
          const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
          context.log.info(`Fetching utility data from gateway`, { cid, endpoint: endpoint.url });

          const response = await fetch(fullUrl);
          if (response.ok) {
            const data: any = await response.json();
            if (data && typeof data === 'object') {
              context.log.info(`Successfully fetched utility data`, {
                cid,
                cooling_system_type: data.cooling_system_type,
                heating_system_type: data.heating_system_type,
                public_utility_type: data.public_utility_type
              });

              return {
                cooling_system_type: data.cooling_system_type || undefined,
                electrical_panel_capacity: data.electrical_panel_capacity || undefined,
                electrical_wiring_type: data.electrical_wiring_type || undefined,
                electrical_wiring_type_other_description: data.electrical_wiring_type_other_description || undefined,
                heating_system_type: data.heating_system_type || undefined,
                hvac_condensing_unit_present: data.hvac_condensing_unit_present || undefined,
                hvac_unit_condition: data.hvac_unit_condition || undefined,
                hvac_unit_issues: data.hvac_unit_issues || undefined,
                plumbing_system_type: data.plumbing_system_type || undefined,
                plumbing_system_type_other_description: data.plumbing_system_type_other_description || undefined,
                public_utility_type: data.public_utility_type || undefined,
                request_identifier: data.request_identifier || undefined,
                sewer_type: data.sewer_type || undefined,
                smart_home_features: data.smart_home_features || undefined,
                smart_home_features_other_description: data.smart_home_features_other_description || undefined,
                solar_inverter_visible: data.solar_inverter_visible || undefined,
                solar_panel_present: data.solar_panel_present || undefined,
                solar_panel_type: data.solar_panel_type || undefined,
                solar_panel_type_other_description: data.solar_panel_type_other_description || undefined,
                water_source_type: data.water_source_type || undefined,
              };
            }
          } else {
            context.log.warn(`Utility data fetch failed - HTTP error`, {
              cid,
              endpoint: endpoint.url,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch utility data`, {
            cid,
            endpoint: endpoint.url,
            error: error.message,
            errorCause: error.cause
          });
        }

        // Delay between endpoints
        if (i < endpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.delayBetweenEndpoints));
        }
      }

      throw new Error(`Failed to fetch utility data for CID: ${cid}`);
    }
);