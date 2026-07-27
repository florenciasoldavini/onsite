const tradeCategoryLabels: Record<string, string> = {
  building_envelope_roofing_openings: "Building envelope, roofing & openings",
  carpentry_woodwork: "Carpentry & woodwork",
  concrete_masonry_structures: "Concrete, masonry & structures",
  electrical_low_voltage_systems: "Electrical & low-voltage systems",
  elevators_specialty_equipment: "Elevators & specialty equipment",
  general_site_work: "General site work",
  hvac_mechanical_systems: "HVAC & mechanical systems",
  interior_construction_finishes: "Interior construction & finishes",
  other_construction_trades: "Other construction trades",
  plumbing_gas_fire_protection: "Plumbing, gas & fire protection"
};

export function getTradeCategoryLabel(code: string) {
  return tradeCategoryLabels[code] ?? humanizeTradeCategoryCode(code);
}

function humanizeTradeCategoryCode(code: string) {
  const label = code.replaceAll("_", " ").trim();
  return label ? `${label[0].toLocaleUpperCase()}${label.slice(1)}` : code;
}
