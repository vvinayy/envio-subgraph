import { experimental_createEffect, S, type EffectContext } from "envio";

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

// Define the schema for the IPFS metadata
const ipfsMetadataSchema = S.schema({
  label: S.string,
  relationships: S.optional(S.schema({
    property_has_structure: S.optional(S.schema({
      "/": S.string
    })),
    property_has_address: S.optional(S.schema({
      "/": S.string
    })),
    property_seed: S.optional(S.schema({
      "/": S.string
    }))
  }))
});

// Schema for structure data (roof date response)
const structureSchema = S.schema({
  roof_date: S.optional(S.string)
});

// Schema for address data (simplified for Seed processing)
const addressSchema = S.schema({
  county_jurisdiction: S.optional(S.string),
  full_address: S.optional(S.string),
  request_identifier: S.optional(S.string),
});

// Schema for property data (for County processing)
const propertySchema = S.schema({
  property_type: S.optional(S.string),
  property_structure_built_year: S.optional(S.string),
  property_effective_built_year: S.optional(S.string),
});

// Schema for relationship data (from/to structure)
const relationshipSchema = S.schema({
  from: S.optional(S.schema({
    "/": S.string
  })),
  to: S.schema({
    "/": S.string
  })
});

// Infer the types from the schemas
type IpfsMetadata = S.Infer<typeof ipfsMetadataSchema>;
type StructureData = S.Infer<typeof structureSchema>;
type AddressData = S.Infer<typeof addressSchema>;
type PropertyData = S.Infer<typeof propertySchema>;
type RelationshipData = S.Infer<typeof relationshipSchema>;

const endpoints = [
  // Multiple public gateways for reliability
  "https://moral-aqua-catfish.myfilebase.com/ipfs",
  "https://ipfs.io/ipfs",
  "https://dry-fuchsia-ox.myfilebase.com/ipfs",
  "https://indexing1.myfilebase.com/ipfs",
  "https://ipfs.io/ipfs",
  "https://indexing2.myfilebase.com/ipfs",
  "https://gateway.ipfs.io/ipfs",
  'https://dweb.link/ipfs',
  'https://w3s.link/ipfs',
  "https://gateway.pinata.cloud/ipfs",
  "https://cloudflare-ipfs.com/ipfs",

];

async function fetchFromEndpoint(
  context: EffectContext,
  endpoint: string,
  cid: string
): Promise<IpfsMetadata | null> {
  try {
    context.log.info(`Fetching IPFS content from gateway`, { cid, endpoint });

    const response = await fetch(`${endpoint}/${cid}`);

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
        context.log.warn(`No label field found in IPFS metadata`, { cid, endpoint });
        return null;
      }
    } else {
      if (response.status === 429) {
        context.log.warn(`Rate limited by IPFS gateway`, { cid, endpoint });
      } else {
        context.log.warn(`IPFS gateway returned error`, {
          cid,
          endpoint,
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
      endpoint,
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
        context.log.info(`Fetching relationship data from gateway`, { cid, endpoint });

        const response = await fetch(`${endpoint}/${cid}`);
        if (response.ok) {
          const data: any = await response.json();
          if (data && data.to && data.to["/"]) {
            context.log.info(`Successfully fetched relationship data`, { cid });
            return data;
          }
        } else {
          context.log.warn(`Relationship data fetch failed - HTTP error`, {
            cid,
            endpoint,
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (e) {
        const error = e as Error;
        context.log.warn(`Failed to fetch relationship data`, {
          cid,
          endpoint,
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
        context.log.info(`Fetching structure data from gateway`, { cid, endpoint });

        const response = await fetch(`${endpoint}/${cid}`);
        if (response.ok) {
          const data: any = await response.json();
          if (data && typeof data === 'object') {
            context.log.info(`Successfully fetched structure data`, { cid, roof_date: data.roof_date });
            return { roof_date: data.roof_date };
          }
        } else {
          context.log.warn(`Structure data fetch failed - HTTP error`, {
            cid,
            endpoint,
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (e) {
        const error = e as Error;
        context.log.warn(`Failed to fetch structure data`, {
          cid,
          endpoint,
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
        context.log.info(`Fetching address data from gateway`, { cid, endpoint });

        const response = await fetch(`${endpoint}/${cid}`);
        if (response.ok) {
          const data: any = await response.json();
          if (data && typeof data === 'object') {
            context.log.info(`Successfully fetched address data`, {
              cid,
              full_address: data.full_address,
              county_jurisdiction: data.county_jurisdiction
            });

            return {
              county_jurisdiction: data.county_jurisdiction || undefined,
              full_address: data.full_address || undefined,
              request_identifier: data.request_identifier || undefined
            };
          }
        } else {
          context.log.warn(`Address data fetch failed - HTTP error`, {
            cid,
            endpoint,
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (e) {
        const error = e as Error;
        context.log.warn(`Failed to fetch address data`, {
          cid,
          endpoint,
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
          context.log.info(`Fetching property data from gateway`, { cid, endpoint });

          const response = await fetch(`${endpoint}/${cid}`);
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
                property_structure_built_year: data.property_structure_built_year || undefined,
                property_effective_built_year: data.property_effective_built_year || undefined
              };
            }
          } else {
            context.log.warn(`Property data fetch failed - HTTP error`, {
              cid,
              endpoint,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (e) {
          const error = e as Error;
          context.log.warn(`Failed to fetch property data`, {
            cid,
            endpoint,
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
  delayBetweenEndpoints: 3000, // 3 seconds between trying different gateways
  delayOn429: 10000, // 10 seconds when rate limited
  delayOnError: 5000, // 10 seconds on other errors
  maxRetries: 1, // Max retries per endpoint (reduced to avoid too many failures)
};

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