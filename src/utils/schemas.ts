import { S } from "envio";

// IPFS Metadata Schemas
//
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
    property_has_flood_storm_information: S.optional(S.schema({
      "/": S.string
    })),
    person_has_property: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    company_has_property: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    property_has_layout: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    property_has_file: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    deed_has_file: S.optional(S.array(S.schema({
      "/": S.string
    }))),
    sales_history_has_deed: S.optional(S.array(S.schema({
      "/": S.string
    }))),
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

// Flood Storm Information Data Schema
export const floodStormInformationSchema = S.schema({
  community_id: S.optional(S.string),
  effective_date: S.optional(S.string),
  evacuation_zone: S.optional(S.string),
  fema_search_url: S.optional(S.string),
  flood_insurance_required: S.optional(S.boolean),
  flood_zone: S.optional(S.string),
  map_version: S.optional(S.string),
  panel_number: S.optional(S.string),
  request_identifier: S.optional(S.string),
});

// Person Data Schema
export const personSchema = S.schema({
  birth_date: S.optional(S.string),
  first_name: S.string,
  last_name: S.string,
  middle_name: S.optional(S.string),
  prefix_name: S.optional(S.string),
  request_identifier: S.optional(S.string),
  suffix_name: S.optional(S.string),
  us_citizenship_status: S.optional(S.string),
  veteran_status: S.optional(S.boolean),
});

// Company Data Schema
export const companySchema = S.schema({
  name: S.optional(S.string),
  request_identifier: S.optional(S.string),
});

// Layout Data Schema
export const layoutSchema = S.schema({
  cabinet_style: S.optional(S.string),
  clutter_level: S.optional(S.string),
  condition_issues: S.optional(S.string),
  countertop_material: S.optional(S.string),
  decor_elements: S.optional(S.string),
  design_style: S.optional(S.string),
  fixture_finish_quality: S.optional(S.string),
  floor_level: S.optional(S.string),
  flooring_material_type: S.optional(S.string),
  flooring_wear: S.optional(S.string),
  furnished: S.optional(S.string),
  has_windows: S.optional(S.boolean),
  is_exterior: S.boolean,
  is_finished: S.boolean,
  lighting_features: S.optional(S.string),
  natural_light_quality: S.optional(S.string),
  paint_condition: S.optional(S.string),
  pool_condition: S.optional(S.string),
  pool_equipment: S.optional(S.string),
  pool_surface_type: S.optional(S.string),
  pool_type: S.optional(S.string),
  pool_water_quality: S.optional(S.string),
  request_identifier: S.optional(S.string),
  safety_features: S.optional(S.string),
  size_square_feet: S.optional(S.number),
  spa_type: S.optional(S.string),
  space_index: S.number,
  space_type: S.optional(S.string),
  view_type: S.optional(S.string),
  visible_damage: S.optional(S.string),
  window_design_type: S.optional(S.string),
  window_material_type: S.optional(S.string),
  window_treatment_type: S.optional(S.string),
});

// File Data Schema
export const fileSchema = S.schema({
  document_type: S.optional(S.string),
  file_format: S.optional(S.string),
  ipfs_url: S.optional(S.string),
  name: S.optional(S.string),
  original_url: S.optional(S.string),
  request_identifier: S.optional(S.string),
});

// Deed Data Schema
export const deedSchema = S.schema({
  deed_type: S.string,
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
export type FloodStormInformationData = S.Infer<typeof floodStormInformationSchema>;
export type PersonData = S.Infer<typeof personSchema>;
export type CompanyData = S.Infer<typeof companySchema>;
export type LayoutData = S.Infer<typeof layoutSchema>;
export type FileData = S.Infer<typeof fileSchema>;
export type DeedData = S.Infer<typeof deedSchema>;