import { S } from "envio";

// IPFS Metadata Schemas
export const ipfsMetadataSchema = S.schema({
  label: S.string,
  relationships: S.optional(S.schema({
    property_has_structure: S.optional(S.schema({
      "/": S.string
    })),
    property_has_address: S.optional(S.schema({
      "/": S.string
    })),
    property_has_lot: S.optional(S.schema({
      "/": S.string
    })),
    property_has_sales_history: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    property_has_tax: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    property_has_utility: S.optional(S.schema({
      "/": S.string
    })),
    property_seed: S.optional(S.schema({
      "/": S.string
    })),
    address_has_fact_sheet: S.optional(S.array(S.schema({
      "/": S.string
    })))
  }))
});

// Relationship Schema
export const relationshipSchema = S.schema({
  from: S.optional(S.schema({
    "/": S.string
  })),
  to: S.schema({
    "/": S.string
  })
});

// Structure Data Schema
export const structureSchema = S.schema({
  roof_date: S.optional(S.string),
  architectural_style_type: S.optional(S.string),
  attachment_type: S.optional(S.string),
  ceiling_condition: S.optional(S.string),
  ceiling_height_average: S.optional(S.number),
  ceiling_insulation_type: S.optional(S.string),
  ceiling_structure_material: S.optional(S.string),
  ceiling_surface_material: S.optional(S.string),
  exterior_door_material: S.optional(S.string),
  exterior_wall_condition: S.optional(S.string),
  exterior_wall_insulation_type: S.optional(S.string),
  exterior_wall_material_primary: S.optional(S.string),
  exterior_wall_material_secondary: S.optional(S.string),
  flooring_condition: S.optional(S.string),
  flooring_material_primary: S.optional(S.string),
  flooring_material_secondary: S.optional(S.string),
  foundation_condition: S.optional(S.string),
  foundation_material: S.optional(S.string),
  foundation_type: S.optional(S.string),
  foundation_waterproofing: S.optional(S.string),
  gutters_condition: S.optional(S.string),
  gutters_material: S.optional(S.string),
  interior_door_material: S.optional(S.string),
  interior_wall_condition: S.optional(S.string),
  interior_wall_finish_primary: S.optional(S.string),
  interior_wall_finish_secondary: S.optional(S.string),
  interior_wall_structure_material: S.optional(S.string),
  interior_wall_surface_material_primary: S.optional(S.string),
  interior_wall_surface_material_secondary: S.optional(S.string),
  number_of_stories: S.optional(S.number),
  primary_framing_material: S.optional(S.string),
  request_identifier: S.optional(S.string),
  roof_age_years: S.optional(S.number),
  roof_condition: S.optional(S.string),
  roof_covering_material: S.optional(S.string),
  roof_design_type: S.optional(S.string),
  roof_material_type: S.optional(S.string),
  roof_structure_material: S.optional(S.string),
  roof_underlayment_type: S.optional(S.string),
  secondary_framing_material: S.optional(S.string),
  structural_damage_indicators: S.optional(S.string),
  subfloor_material: S.optional(S.string),
  window_frame_material: S.optional(S.string),
  window_glazing_type: S.optional(S.string),
  window_operation_type: S.optional(S.string),
  window_screen_material: S.optional(S.string),
});

// Address Data Schema
export const addressSchema = S.schema({
  request_identifier: S.optional(S.string),
  block: S.optional(S.string),
  city_name: S.optional(S.string),
  country_code: S.optional(S.string),
  county_name: S.optional(S.string),
  latitude: S.optional(S.number),
  longitude: S.optional(S.number),
  lot: S.optional(S.string),
  municipality_name: S.optional(S.string),
  plus_four_postal_code: S.optional(S.string),
  postal_code: S.optional(S.string),
  range: S.optional(S.string),
  route_number: S.optional(S.string),
  section: S.optional(S.string),
  state_code: S.optional(S.string),
  street_name: S.optional(S.string),
  street_number: S.optional(S.string),
  street_post_directional_text: S.optional(S.string),
  street_pre_directional_text: S.optional(S.string),
  street_suffix_type: S.optional(S.string),
  township: S.optional(S.string),
  unit_identifier: S.optional(S.string),
});

// Property Data Schema
export const propertySchema = S.schema({
  property_type: S.optional(S.string),
  property_structure_built_year: S.optional(S.string),
  property_effective_built_year: S.optional(S.string),
  parcel_identifier: S.optional(S.string),
  area_under_air: S.optional(S.string),
  historic_designation: S.optional(S.boolean),
  livable_floor_area: S.optional(S.string),
  number_of_units: S.optional(S.number),
  number_of_units_type: S.optional(S.string),
  property_legal_description_text: S.optional(S.string),
  request_identifier: S.optional(S.string),
  subdivision: S.optional(S.string),
  total_area: S.optional(S.string),
  zoning: S.optional(S.string),
});

// IPFS Fact Sheet Schema
export const ipfsFactSheetSchema = S.schema({
  ipfs_url: S.optional(S.string),
  full_generation_command: S.optional(S.string),
});

// Lot Data Schema
export const lotDataSchema = S.schema({
  driveway_condition: S.optional(S.string),
  driveway_material: S.optional(S.string),
  fence_height: S.optional(S.string),
  fence_length: S.optional(S.string),
  fencing_type: S.optional(S.string),
  landscaping_features: S.optional(S.string),
  lot_area_sqft: S.optional(S.number),
  lot_condition_issues: S.optional(S.string),
  lot_length_feet: S.optional(S.number),
  lot_size_acre: S.optional(S.number),
  lot_type: S.optional(S.string),
  lot_width_feet: S.optional(S.number),
  request_identifier: S.optional(S.string),
  view: S.optional(S.string),
});

// Sales History Data Schema
export const salesHistorySchema = S.schema({
  ownership_transfer_date: S.optional(S.string),
  purchase_price_amount: S.optional(S.number),
  request_identifier: S.optional(S.string),
  sale_type: S.optional(S.string),
});

// Tax Data Schema
export const taxSchema = S.schema({
  first_year_building_on_tax_roll: S.optional(S.number),
  first_year_on_tax_roll: S.optional(S.number),
  monthly_tax_amount: S.optional(S.number),
  period_end_date: S.optional(S.string),
  period_start_date: S.optional(S.string),
  property_assessed_value_amount: S.number,
  property_building_amount: S.optional(S.number),
  property_land_amount: S.optional(S.number),
  property_market_value_amount: S.number,
  property_taxable_value_amount: S.number,
  request_identifier: S.optional(S.string),
  tax_year: S.optional(S.number),
  yearly_tax_amount: S.optional(S.number),
});

// Utility Data Schema
export const utilitySchema = S.schema({
  cooling_system_type: S.optional(S.string),
  electrical_panel_capacity: S.optional(S.string),
  electrical_wiring_type: S.optional(S.string),
  electrical_wiring_type_other_description: S.optional(S.string),
  heating_system_type: S.optional(S.string),
  hvac_condensing_unit_present: S.optional(S.string),
  hvac_unit_condition: S.optional(S.string),
  hvac_unit_issues: S.optional(S.string),
  plumbing_system_type: S.optional(S.string),
  plumbing_system_type_other_description: S.optional(S.string),
  public_utility_type: S.optional(S.string),
  request_identifier: S.optional(S.string),
  sewer_type: S.optional(S.string),
  smart_home_features: S.optional(S.array(S.string)),
  smart_home_features_other_description: S.optional(S.string),
  solar_inverter_visible: S.optional(S.boolean),
  solar_panel_present: S.optional(S.boolean),
  solar_panel_type: S.optional(S.string),
  solar_panel_type_other_description: S.optional(S.string),
  water_source_type: S.optional(S.string),
});

// Inferred Types
export type IpfsMetadata = S.Infer<typeof ipfsMetadataSchema>;
export type RelationshipData = S.Infer<typeof relationshipSchema>;
export type StructureData = S.Infer<typeof structureSchema>;
export type AddressData = S.Infer<typeof addressSchema>;
export type PropertyData = S.Infer<typeof propertySchema>;
export type IpfsFactSheetData = S.Infer<typeof ipfsFactSheetSchema>;
export type LotData = S.Infer<typeof lotDataSchema>;
export type SalesHistoryData = S.Infer<typeof salesHistorySchema>;
export type TaxData = S.Infer<typeof taxSchema>;
export type UtilityData = S.Infer<typeof utilitySchema>;