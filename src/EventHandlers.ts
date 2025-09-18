/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ERC1967Proxy,
  ERC1967Proxy_DataGroupConsensusUpdated,
  ERC1967Proxy_DataGroupHeartBeat,
  ERC1967Proxy_DataSubmitted,
  ERC1967Proxy_Initialized,
  ERC1967Proxy_MinimumConsensusUpdated,
  ERC1967Proxy_RoleAdminChanged,
  ERC1967Proxy_RoleGranted,
  ERC1967Proxy_RoleRevoked,
  ERC1967Proxy_Upgraded,
  DataSubmittedWithLabel,
  Structure,
  Address,
  Property,
} from "generated";

import { bytes32ToCID, getIpfsMetadata, getRelationshipData, getStructureData, getAddressData, getPropertyData } from "./utils/ipfs";

ERC1967Proxy.DataGroupConsensusUpdated.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_DataGroupConsensusUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    dataGroupHash: event.params.dataGroupHash,
    oldValue: event.params.oldValue,
    newValue: event.params.newValue,
  };

  context.ERC1967Proxy_DataGroupConsensusUpdated.set(entity);


});

ERC1967Proxy.DataGroupHeartBeat.handler(async ({ event, context }) => {
  // Only process events from specific submitters
  const allowedSubmitters = [
    "0x2C810CD120eEb840a7012b77a2B4F19889Ecf65C",
    "0x2b4c5ebe66866dc0b88a05ffa4979d8830a889e9"
  ];

  if (!allowedSubmitters.includes(event.params.submitter)) {
    context.log.info(`Skipping HeartBeat event - only processing events from specific submitters`, {
      submitter: event.params.submitter,
      propertyHash: event.params.propertyHash
    });
    return;
  }

  const entity: ERC1967Proxy_DataGroupHeartBeat = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    propertyHash: event.params.propertyHash,
    dataGroupHash: event.params.dataGroupHash,
    dataHash: event.params.dataHash,
    submitter: event.params.submitter,
  };

  context.ERC1967Proxy_DataGroupHeartBeat.set(entity);

  const cid = bytes32ToCID(event.params.dataHash);

  try {
    const metadata = await context.effect(getIpfsMetadata, cid);

    // Use propertyHash as the unique ID for the property
    const propertyId = event.params.propertyHash;

    // Get existing entity or create base structure
    let existingEntity = await context.DataSubmittedWithLabel.get(propertyId);
    let structureId = existingEntity?.structure_id;
    let addressId = existingEntity?.address_id;
    let propertyDataId = existingEntity?.property_id;

    if (metadata.label === "County") {
      // Process structure data if available
      const structureCid = metadata.relationships?.property_has_structure?.["/"];
      if (structureCid) {
        try {
          const relationshipData = await context.effect(getRelationshipData, structureCid);

          // Fetch structure data from "to" part
          const structureDataCid = relationshipData.to["/"];
          const structureData = await context.effect(getStructureData, structureDataCid);

          structureId = structureDataCid; // Use the CID as the structure ID
          const structureEntity: Structure = {
            id: structureId,
            roof_date: structureData.roof_date || undefined
          };
          context.Structure.set(structureEntity);

          context.log.info(`Updated Structure entity from HeartBeat`, {
            structureId,
            roof_date: structureData.roof_date
          });

          // Fetch property data from "from" part if available
          if (relationshipData.from && relationshipData.from["/"]) {
            const propertyDataCid = relationshipData.from["/"];
            const propertyData = await context.effect(getPropertyData, propertyDataCid);

            propertyDataId = propertyDataCid; // Use the CID as the property ID
            const propertyEntity: Property = {
              id: propertyDataId,
              property_type: propertyData.property_type || undefined,
              property_structure_built_year: propertyData.property_structure_built_year || undefined,
              property_effective_built_year: propertyData.property_effective_built_year || undefined
            };
            context.Property.set(propertyEntity);

            context.log.info(`Updated Property entity from HeartBeat`, {
              propertyDataId,
              property_type: propertyData.property_type,
              property_structure_built_year: propertyData.property_structure_built_year,
              property_effective_built_year: propertyData.property_effective_built_year
            });
          }
        } catch (structureError) {
          context.log.warn(`Failed to fetch structure/property data from HeartBeat`, {
            cid,
            structureCid,
            error: (structureError as Error).message
          });
        }
      }

      context.log.info(`Updated County property from HeartBeat`, {
        propertyId,
        label: metadata.label,
        structureId
      });
    } else if (metadata.label === "Seed") {
      // Process seed data - follow property_seed -> relationship -> address data
      const seedCid = metadata.relationships?.property_seed?.["/"];
      if (seedCid) {
        try {
          const seedRelationshipData = await context.effect(getRelationshipData, seedCid);
          const addressDataCid = seedRelationshipData.to["/"];
          const addressData = await context.effect(getAddressData, addressDataCid);

          addressId = addressDataCid; // Use the CID as the address ID
          const addressEntity: Address = {
            id: addressId,
            county_name: addressData.county_jurisdiction || undefined,
            full_address: addressData.full_address || undefined
          };
          context.Address.set(addressEntity);

          context.log.info(`Updated Address entity from HeartBeat`, {
            addressId,
            county_name: addressData.county_jurisdiction,
            full_address: addressData.full_address
          });
        } catch (addressError) {
          context.log.warn(`Failed to fetch seed address data from HeartBeat`, {
            cid,
            seedCid,
            error: (addressError as Error).message
          });
        }
      }

      context.log.info(`Updated Seed property from HeartBeat`, {
        propertyId,
        label: metadata.label,
        addressId
      });
    }

    // Update or create the main property entity
    const labelEntity: DataSubmittedWithLabel = {
      id: propertyId,
      propertyHash: event.params.propertyHash,
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: cid,
      label: metadata.label,
      structure_id: structureId,
      address_id: addressId,
      property_id: propertyDataId
    };

    context.DataSubmittedWithLabel.set(labelEntity);
    context.log.info(`Updated property entity from HeartBeat`, {
      propertyId,
      label: metadata.label,
      structureId,
      addressId,
      propertyDataId
    });
  } catch (error) {
    context.log.warn(`Failed to get metadata for CID from HeartBeat`, {
      cid,
      error: (error as Error).message
    });
  }
});

ERC1967Proxy.DataSubmitted.handler(async ({ event, context }) => {
  // Only process events from specific submitters
  const allowedSubmitters = [
    "0x2C810CD120eEb840a7012b77a2B4F19889Ecf65C",
    "0x2B4C5eBE66866dc0b88A05fFa4979D8830a889E9"
  ];

  if (!allowedSubmitters.includes(event.params.submitter)) {
    context.log.info(`Skipping DataSubmitted event - only processing events from specific submitters`, {
      submitter: event.params.submitter,
      propertyHash: event.params.propertyHash
    });
    return;
  }

  const entity: ERC1967Proxy_DataSubmitted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    propertyHash: event.params.propertyHash,
    dataGroupHash: event.params.dataGroupHash,
    submitter: event.params.submitter,
    dataHash: event.params.dataHash,
  };

  context.ERC1967Proxy_DataSubmitted.set(entity);

  const cid = bytes32ToCID(event.params.dataHash);

  try {
    const metadata = await context.effect(getIpfsMetadata, cid);

    // Use propertyHash as the unique ID for the property
    const propertyId = event.params.propertyHash;

    // Get existing entity or create base structure
    let existingEntity = await context.DataSubmittedWithLabel.get(propertyId);
    let structureId = existingEntity?.structure_id;
    let addressId = existingEntity?.address_id;
    let propertyDataId = existingEntity?.property_id;

    if (metadata.label === "County") {
      // Process structure data if available
      const structureCid = metadata.relationships?.property_has_structure?.["/"];
      if (structureCid) {
        try {
          const relationshipData = await context.effect(getRelationshipData, structureCid);

          // Fetch structure data from "to" part
          const structureDataCid = relationshipData.to["/"];
          const structureData = await context.effect(getStructureData, structureDataCid);

          structureId = structureDataCid; // Use the CID as the structure ID
          const structureEntity: Structure = {
            id: structureId,
            roof_date: structureData.roof_date || undefined
          };
          context.Structure.set(structureEntity);

          context.log.info(`Updated Structure entity`, {
            structureId,
            roof_date: structureData.roof_date
          });

          // Fetch property data from "from" part if available
          if (relationshipData.from && relationshipData.from["/"]) {
            const propertyDataCid = relationshipData.from["/"];
            const propertyData = await context.effect(getPropertyData, propertyDataCid);

            propertyDataId = propertyDataCid; // Use the CID as the property ID
            const propertyEntity: Property = {
              id: propertyDataId,
              property_type: propertyData.property_type || undefined,
              property_structure_built_year: propertyData.property_structure_built_year || undefined,
              property_effective_built_year: propertyData.property_effective_built_year || undefined
            };
            context.Property.set(propertyEntity);

            context.log.info(`Updated Property entity`, {
              propertyDataId,
              property_type: propertyData.property_type,
              property_structure_built_year: propertyData.property_structure_built_year,
              property_effective_built_year: propertyData.property_effective_built_year
            });
          }
        } catch (structureError) {
          context.log.warn(`Failed to fetch structure/property data`, {
            cid,
            structureCid,
            error: (structureError as Error).message
          });
        }
      }

      context.log.info(`Updated County property with structure data`, {
        propertyId,
        label: metadata.label,
        structureId
      });
    } else if (metadata.label === "Seed") {
      // Process seed data - follow property_seed -> relationship -> address data
      const seedCid = metadata.relationships?.property_seed?.["/"];
      if (seedCid) {
        try {
          const seedRelationshipData = await context.effect(getRelationshipData, seedCid);
          const addressDataCid = seedRelationshipData.to["/"];
          const addressData = await context.effect(getAddressData, addressDataCid);

          addressId = addressDataCid; // Use the CID as the address ID
          const addressEntity: Address = {
            id: addressId,
            county_name: addressData.county_jurisdiction || undefined,
            full_address: addressData.full_address || undefined
          };
          context.Address.set(addressEntity);

          context.log.info(`Updated Address entity from Seed`, {
            addressId,
            county_name: addressData.county_jurisdiction,
            full_address: addressData.full_address
          });
        } catch (addressError) {
          context.log.warn(`Failed to fetch seed address data`, {
            cid,
            seedCid,
            error: (addressError as Error).message
          });
        }
      }

      context.log.info(`Updated Seed property with address data`, {
        propertyId,
        label: metadata.label,
        addressId
      });
    }

    // Update or create the main property entity
    const labelEntity: DataSubmittedWithLabel = {
      id: propertyId,
      propertyHash: event.params.propertyHash,
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: cid,
      label: metadata.label,
      structure_id: structureId,
      address_id: addressId,
      property_id: propertyDataId
    };

    context.DataSubmittedWithLabel.set(labelEntity);
    context.log.info(`Updated property entity`, {
      propertyId,
      label: metadata.label,
      structureId,
      addressId,
      propertyDataId
    });
  } catch (error) {
    context.log.warn(`Failed to get metadata for CID`, {
      cid,
      error: (error as Error).message
    });
  }


});

ERC1967Proxy.Initialized.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Initialized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    version: event.params.version,
  };

  context.ERC1967Proxy_Initialized.set(entity);
});

ERC1967Proxy.MinimumConsensusUpdated.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_MinimumConsensusUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldValue: event.params.oldValue,
    newValue: event.params.newValue,
  };

  context.ERC1967Proxy_MinimumConsensusUpdated.set(entity);
});

ERC1967Proxy.RoleAdminChanged.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_RoleAdminChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    previousAdminRole: event.params.previousAdminRole,
    newAdminRole: event.params.newAdminRole,
  };

  context.ERC1967Proxy_RoleAdminChanged.set(entity);
});

ERC1967Proxy.RoleGranted.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_RoleGranted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.ERC1967Proxy_RoleGranted.set(entity);
});

ERC1967Proxy.RoleRevoked.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_RoleRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.ERC1967Proxy_RoleRevoked.set(entity);
});

ERC1967Proxy.Upgraded.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Upgraded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    implementation: event.params.implementation,
  };

  context.ERC1967Proxy_Upgraded.set(entity);
});
