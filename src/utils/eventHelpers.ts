import {
  DataSubmittedWithLabel,
  Structure,
  Address,
  Property,
  Ipfs,
  Lot,
  SalesHistory,
  Tax,
  Utility,
} from "generated";
import { bytes32ToCID, getIpfsMetadata, getRelationshipData, getStructureData, getAddressData, getPropertyData, getIpfsFactSheetData, getLotData, getSalesHistoryData, getTaxData, getUtilityData } from "./ipfs";

// Function to get all wallet addresses from environment variables
export function getAllowedSubmitters(): string[] {
  const wallets: string[] = [];

  // Get all environment variables
  const envVars = process.env;

  // Find all variables that start with ENVIO_WALLET_ADDRESS
  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('ENVIO_WALLET_ADDRESS') && value) {
      wallets.push(value);
    }
  }

  if (wallets.length === 0) {
    throw new Error('CRITICAL: No wallet addresses found in environment variables starting with ENVIO_WALLET_ADDRESS. Indexer cannot proceed without valid wallet addresses.');
  }

  return wallets;
}

// Helper to create Structure entity
export function createStructureEntity(structureId: string, structureData: any): Structure {
  return {
    id: structureId,
    roof_date: structureData.roof_date || undefined,
    architectural_style_type: structureData.architectural_style_type || undefined,
    attachment_type: structureData.attachment_type || undefined,
    ceiling_condition: structureData.ceiling_condition || undefined,
    ceiling_height_average: structureData.ceiling_height_average || undefined,
    ceiling_insulation_type: structureData.ceiling_insulation_type || undefined,
    ceiling_structure_material: structureData.ceiling_structure_material || undefined,
    ceiling_surface_material: structureData.ceiling_surface_material || undefined,
    exterior_door_material: structureData.exterior_door_material || undefined,
    exterior_wall_condition: structureData.exterior_wall_condition || undefined,
    exterior_wall_insulation_type: structureData.exterior_wall_insulation_type || undefined,
    exterior_wall_material_primary: structureData.exterior_wall_material_primary || undefined,
    exterior_wall_material_secondary: structureData.exterior_wall_material_secondary || undefined,
    flooring_condition: structureData.flooring_condition || undefined,
    flooring_material_primary: structureData.flooring_material_primary || undefined,
    flooring_material_secondary: structureData.flooring_material_secondary || undefined,
    foundation_condition: structureData.foundation_condition || undefined,
    foundation_material: structureData.foundation_material || undefined,
    foundation_type: structureData.foundation_type || undefined,
    foundation_waterproofing: structureData.foundation_waterproofing || undefined,
    gutters_condition: structureData.gutters_condition || undefined,
    gutters_material: structureData.gutters_material || undefined,
    interior_door_material: structureData.interior_door_material || undefined,
    interior_wall_condition: structureData.interior_wall_condition || undefined,
    interior_wall_finish_primary: structureData.interior_wall_finish_primary || undefined,
    interior_wall_finish_secondary: structureData.interior_wall_finish_secondary || undefined,
    interior_wall_structure_material: structureData.interior_wall_structure_material || undefined,
    interior_wall_surface_material_primary: structureData.interior_wall_surface_material_primary || undefined,
    interior_wall_surface_material_secondary: structureData.interior_wall_surface_material_secondary || undefined,
    number_of_stories: structureData.number_of_stories || undefined,
    primary_framing_material: structureData.primary_framing_material || undefined,
    request_identifier: structureData.request_identifier || undefined,
    roof_age_years: structureData.roof_age_years || undefined,
    roof_condition: structureData.roof_condition || undefined,
    roof_covering_material: structureData.roof_covering_material || undefined,
    roof_design_type: structureData.roof_design_type || undefined,
    roof_material_type: structureData.roof_material_type || undefined,
    roof_structure_material: structureData.roof_structure_material || undefined,
    roof_underlayment_type: structureData.roof_underlayment_type || undefined,
    secondary_framing_material: structureData.secondary_framing_material || undefined,
    structural_damage_indicators: structureData.structural_damage_indicators || undefined,
    subfloor_material: structureData.subfloor_material || undefined,
    window_frame_material: structureData.window_frame_material || undefined,
    window_glazing_type: structureData.window_glazing_type || undefined,
    window_operation_type: structureData.window_operation_type || undefined,
    window_screen_material: structureData.window_screen_material || undefined
  };
}

// Helper to create Property entity
export function createPropertyEntity(propertyDataId: string, propertyData: any): Property {
  return {
    id: propertyDataId,
    property_type: propertyData.property_type || undefined,
    property_structure_built_year: propertyData.property_structure_built_year || undefined,
    property_effective_built_year: propertyData.property_effective_built_year || undefined,
    parcel_identifier: propertyData.parcel_identifier || undefined,
    area_under_air: propertyData.area_under_air || undefined,
    historic_designation: propertyData.historic_designation || undefined,
    livable_floor_area: propertyData.livable_floor_area || undefined,
    number_of_units: propertyData.number_of_units || undefined,
    number_of_units_type: propertyData.number_of_units_type || undefined,
    property_legal_description_text: propertyData.property_legal_description_text || undefined,
    request_identifier: propertyData.request_identifier || undefined,
    subdivision: propertyData.subdivision || undefined,
    total_area: propertyData.total_area || undefined,
    zoning: propertyData.zoning || undefined
  };
}

// Helper to create Address entity
export function createAddressEntity(addressId: string, addressData: any): Address {
  return {
    id: addressId,
    county_name: addressData.county_name || undefined,
    request_identifier: addressData.request_identifier || undefined,
    block: addressData.block || undefined,
    city_name: addressData.city_name || undefined,
    country_code: addressData.country_code || undefined,
    latitude: addressData.latitude || undefined,
    longitude: addressData.longitude || undefined,
    lot: addressData.lot || undefined,
    municipality_name: addressData.municipality_name || undefined,
    plus_four_postal_code: addressData.plus_four_postal_code || undefined,
    postal_code: addressData.postal_code || undefined,
    range: addressData.range || undefined,
    route_number: addressData.route_number || undefined,
    section: addressData.section || undefined,
    state_code: addressData.state_code || undefined,
    street_direction_prefix: addressData.street_pre_directional_text || undefined,
    street_direction_suffix: addressData.street_post_directional_text || undefined,
    street_name: addressData.street_name || undefined,
    street_number: addressData.street_number || undefined,
    street_suffix: addressData.street_suffix_type || undefined,
    unit_identifier: addressData.unit_identifier || undefined,
    township: addressData.township || undefined
  };
}

// Helper to create IPFS entity
export function createIpfsEntity(ipfsId: string, ipfsData: any): Ipfs {
  return {
    id: ipfsId,
    ipfs_url: ipfsData.ipfs_url || "",
    full_generation_command: ipfsData.full_generation_command || undefined
  };
}

// Helper to create Lot entity
export function createLotEntity(lotId: string, lotData: any): Lot {
  return {
    id: lotId,
    driveway_condition: lotData.driveway_condition || undefined,
    driveway_material: lotData.driveway_material || undefined,
    fence_height: lotData.fence_height || undefined,
    fence_length: lotData.fence_length || undefined,
    fencing_type: lotData.fencing_type || undefined,
    landscaping_features: lotData.landscaping_features || undefined,
    lot_area_sqft: lotData.lot_area_sqft || undefined,
    lot_condition_issues: lotData.lot_condition_issues || undefined,
    lot_length_feet: lotData.lot_length_feet || undefined,
    lot_size_acre: lotData.lot_size_acre || undefined,
    lot_type: lotData.lot_type || undefined,
    lot_width_feet: lotData.lot_width_feet || undefined,
    request_identifier: lotData.request_identifier || undefined,
    view: lotData.view || undefined
  };
}

// Helper to create SalesHistory entity
export function createSalesHistoryEntity(salesHistoryId: string, salesHistoryData: any, propertyId: string): SalesHistory {
  return {
    id: salesHistoryId,
    ownership_transfer_date: salesHistoryData.ownership_transfer_date || undefined,
    purchase_price_amount: salesHistoryData.purchase_price_amount || undefined,
    request_identifier: salesHistoryData.request_identifier || undefined,
    sale_type: salesHistoryData.sale_type || undefined,
    property_id: propertyId
  };
}

// Helper to create Tax entity
export function createTaxEntity(taxId: string, taxData: any, propertyId: string): Tax {
  return {
    id: taxId,
    first_year_building_on_tax_roll: taxData.first_year_building_on_tax_roll || undefined,
    first_year_on_tax_roll: taxData.first_year_on_tax_roll || undefined,
    monthly_tax_amount: taxData.monthly_tax_amount || undefined,
    period_end_date: taxData.period_end_date || undefined,
    period_start_date: taxData.period_start_date || undefined,
    property_assessed_value_amount: taxData.property_assessed_value_amount,
    property_building_amount: taxData.property_building_amount || undefined,
    property_land_amount: taxData.property_land_amount || undefined,
    property_market_value_amount: taxData.property_market_value_amount,
    property_taxable_value_amount: taxData.property_taxable_value_amount,
    request_identifier: taxData.request_identifier || undefined,
    tax_year: taxData.tax_year || undefined,
    yearly_tax_amount: taxData.yearly_tax_amount || undefined,
    property_id: propertyId
  };
}

// Helper to create Utility entity
export function createUtilityEntity(utilityId: string, utilityData: any): Utility {
  return {
    id: utilityId,
    cooling_system_type: utilityData.cooling_system_type || undefined,
    electrical_panel_capacity: utilityData.electrical_panel_capacity || undefined,
    electrical_wiring_type: utilityData.electrical_wiring_type || undefined,
    electrical_wiring_type_other_description: utilityData.electrical_wiring_type_other_description || undefined,
    heating_system_type: utilityData.heating_system_type || undefined,
    hvac_condensing_unit_present: utilityData.hvac_condensing_unit_present || undefined,
    hvac_unit_condition: utilityData.hvac_unit_condition || undefined,
    hvac_unit_issues: utilityData.hvac_unit_issues || undefined,
    plumbing_system_type: utilityData.plumbing_system_type || undefined,
    plumbing_system_type_other_description: utilityData.plumbing_system_type_other_description || undefined,
    public_utility_type: utilityData.public_utility_type || undefined,
    request_identifier: utilityData.request_identifier || undefined,
    sewer_type: utilityData.sewer_type || undefined,
    smart_home_features: utilityData.smart_home_features || undefined,
    smart_home_features_other_description: utilityData.smart_home_features_other_description || undefined,
    solar_inverter_visible: utilityData.solar_inverter_visible || undefined,
    solar_panel_present: utilityData.solar_panel_present || undefined,
    solar_panel_type: utilityData.solar_panel_type || undefined,
    solar_panel_type_other_description: utilityData.solar_panel_type_other_description || undefined,
    water_source_type: utilityData.water_source_type || undefined
  };
}

// Helper to process County data with full parallelism
export async function processCountyData(context: any, metadata: any, cid: string, propertyEntityId: string) {
  // Initialize entity IDs that will be populated from IPFS data
  let structureId: string | undefined;
  let addressId: string | undefined;
  let propertyDataId: string | undefined;
  let ipfsId: string | undefined;
  let lotId: string | undefined;
  let utilityId: string | undefined;
  let parcelIdentifier: string | undefined;
  const salesHistoryEntities: SalesHistory[] = [];
  const taxEntities: Tax[] = [];

  // First fetch relationships to get CIDs
  const relationshipPromises = [];

  const structureCid = metadata.relationships?.property_has_structure?.["/"];
  const propertyAddressCid = metadata.relationships?.property_has_address?.["/"];
  const propertyLotCid = metadata.relationships?.property_has_lot?.["/"];
  const propertyUtilityCid = metadata.relationships?.property_has_utility?.["/"];
  const addressFactSheetCid = metadata.relationships?.address_has_fact_sheet?.[0]?.["/"];
  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];

  if (structureCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, structureCid)
        .then((data: any) => ({ type: 'structure_rel', data, cid: structureCid }))
        .catch((error: any) => ({ type: 'structure_rel', error, cid: structureCid }))
    );
  }

  if (propertyAddressCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyAddressCid)
        .then((data: any) => ({ type: 'property_rel', data, cid: propertyAddressCid }))
        .catch((error: any) => ({ type: 'property_rel', error, cid: propertyAddressCid }))
    );
  }

  if (propertyLotCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyLotCid)
        .then((data: any) => ({ type: 'lot_rel', data, cid: propertyLotCid }))
        .catch((error: any) => ({ type: 'lot_rel', error, cid: propertyLotCid }))
    );
  }

  if (propertyUtilityCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyUtilityCid)
        .then((data: any) => ({ type: 'utility_rel', data, cid: propertyUtilityCid }))
        .catch((error: any) => ({ type: 'utility_rel', error, cid: propertyUtilityCid }))
    );
  }

  if (addressFactSheetCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, addressFactSheetCid)
        .then((data: any) => ({ type: 'address_rel', data, cid: addressFactSheetCid }))
        .catch((error: any) => ({ type: 'address_rel', error, cid: addressFactSheetCid }))
    );
  }

  // Add sales history relationship fetching
  for (const salesHistoryRef of salesHistoryCids) {
    const salesHistoryRelCid = salesHistoryRef?.["/"];
    if (salesHistoryRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, salesHistoryRelCid)
          .then((data: any) => ({ type: 'sales_history_rel', data, cid: salesHistoryRelCid }))
          .catch((error: any) => ({ type: 'sales_history_rel', error, cid: salesHistoryRelCid }))
      );
    }
  }

  // Add tax relationship fetching
  for (const taxRef of taxCids) {
    const taxRelCid = taxRef?.["/"];
    if (taxRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, taxRelCid)
          .then((data: any) => ({ type: 'tax_rel', data, cid: taxRelCid }))
          .catch((error: any) => ({ type: 'tax_rel', error, cid: taxRelCid }))
      );
    }
  }

  const relationshipResults = await Promise.all(relationshipPromises);

  // Extract all CIDs for parallel fetching
  const allDataPromises = [];
  let structureDataCid: string | undefined;
  let propertyDataCid: string | undefined;
  let lotDataCid: string | undefined;
  let utilityDataCid: string | undefined;
  let addressDataCid: string | undefined;
  let ipfsDataCid: string | undefined;

  for (const relationshipResult of relationshipResults) {
    if (relationshipResult.type === 'structure_rel' && !relationshipResult.error) {
      // From property_has_structure: only get structure (to)
      structureDataCid = relationshipResult.data.to?.["/"];
    } else if (relationshipResult.type === 'property_rel' && !relationshipResult.error) {
      // From property_has_address: get property (from)
      propertyDataCid = relationshipResult.data.from?.["/"];
    } else if (relationshipResult.type === 'lot_rel' && !relationshipResult.error) {
      // From property_has_lot: get lot data (to)
      lotDataCid = relationshipResult.data.to?.["/"];
    } else if (relationshipResult.type === 'utility_rel' && !relationshipResult.error) {
      // From property_has_utility: get utility data (to)
      utilityDataCid = relationshipResult.data.to?.["/"];
    } else if (relationshipResult.type === 'address_rel' && !relationshipResult.error) {
      addressDataCid = relationshipResult.data.from?.["/"];
      ipfsDataCid = relationshipResult.data.to?.["/"];
    } else if (relationshipResult.type === 'sales_history_rel' && !relationshipResult.error) {
      // From property_has_sales_history: get target CID and fetch sales data
      const targetCid = relationshipResult.data.to?.["/"];
      if (targetCid) {
        allDataPromises.push(
          context.effect(getSalesHistoryData, targetCid)
            .then((data: any) => ({ type: 'sales_history', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'sales_history', error, cid: targetCid }))
        );
      }
    } else if (relationshipResult.type === 'tax_rel' && !relationshipResult.error) {
      // From property_has_tax: get target CID and fetch tax data
      const targetCid = relationshipResult.data.to?.["/"];
      if (targetCid) {
        allDataPromises.push(
          context.effect(getTaxData, targetCid)
            .then((data: any) => ({ type: 'tax', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'tax', error, cid: targetCid }))
        );
      }
    }
  }

  // Fetch all data in parallel
  if (structureDataCid) {
    allDataPromises.push(
      context.effect(getStructureData, structureDataCid)
        .then((data: any) => ({ type: 'structure', data, cid: structureDataCid }))
        .catch((error: any) => ({ type: 'structure', error, cid: structureDataCid }))
    );
  }

  if (propertyDataCid) {
    allDataPromises.push(
      context.effect(getPropertyData, propertyDataCid)
        .then((data: any) => ({ type: 'property', data, cid: propertyDataCid }))
        .catch((error: any) => ({ type: 'property', error, cid: propertyDataCid }))
    );
  }

  if (addressDataCid) {
    allDataPromises.push(
      context.effect(getAddressData, addressDataCid)
        .then((data: any) => ({ type: 'address', data, cid: addressDataCid }))
        .catch((error: any) => ({ type: 'address', error, cid: addressDataCid }))
    );
  }

  if (ipfsDataCid) {
    allDataPromises.push(
      context.effect(getIpfsFactSheetData, ipfsDataCid)
        .then((data: any) => ({ type: 'ipfs', data, cid: ipfsDataCid }))
        .catch((error: any) => ({ type: 'ipfs', error, cid: ipfsDataCid }))
    );
  }

  if (lotDataCid) {
    allDataPromises.push(
      context.effect(getLotData, lotDataCid)
        .then((data: any) => ({ type: 'lot', data, cid: lotDataCid }))
        .catch((error: any) => ({ type: 'lot', error, cid: lotDataCid }))
    );
  }

  if (utilityDataCid) {
    allDataPromises.push(
      context.effect(getUtilityData, utilityDataCid)
        .then((data: any) => ({ type: 'utility', data, cid: utilityDataCid }))
        .catch((error: any) => ({ type: 'utility', error, cid: utilityDataCid }))
    );
  }

  // Execute all data fetches in parallel
  const allDataResults = await Promise.all(allDataPromises);

  // Process all results
  for (const result of allDataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, {
        cid,
        error: result.error.message
      });
      continue;
    }

    if (result.type === 'structure') {
      structureId = result.cid;
      const structureEntity = createStructureEntity(result.cid, result.data);
      context.Structure.set(structureEntity);

    } else if (result.type === 'property') {
      propertyDataId = result.cid;
      const propertyEntity = createPropertyEntity(result.cid, result.data);
      context.Property.set(propertyEntity);

      if (result.data.parcel_identifier) {
        parcelIdentifier = result.data.parcel_identifier;
      }

    } else if (result.type === 'address') {
      addressId = result.cid;
      const addressEntity = createAddressEntity(result.cid, result.data);
      context.Address.set(addressEntity);

    } else if (result.type === 'ipfs') {
      ipfsId = result.cid;
      const ipfsEntity = createIpfsEntity(result.cid, result.data);
      context.Ipfs.set(ipfsEntity);

    } else if (result.type === 'lot') {
      lotId = result.cid;
      const lotEntity = createLotEntity(result.cid, result.data);
      context.Lot.set(lotEntity);

    } else if (result.type === 'sales_history') {
      const salesHistoryEntity = createSalesHistoryEntity(result.cid, result.data, propertyEntityId);
      context.SalesHistory.set(salesHistoryEntity);
      salesHistoryEntities.push(salesHistoryEntity);

    } else if (result.type === 'tax') {
      const taxEntity = createTaxEntity(result.cid, result.data, propertyEntityId);
      context.Tax.set(taxEntity);
      taxEntities.push(taxEntity);

    } else if (result.type === 'utility') {
      utilityId = result.cid;
      const utilityEntity = createUtilityEntity(result.cid, result.data);
      context.Utility.set(utilityEntity);

    }
  }

  return {
    structureId,
    addressId,
    propertyDataId,
    ipfsId,
    lotId,
    utilityId,
    parcelIdentifier,
    salesHistoryEntities,
    taxEntities
  };
}