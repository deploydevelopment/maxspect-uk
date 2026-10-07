/* ------------------------------------------------------------------ */
/*  Tank presets catalogue for dimensions selection                   */
/* ------------------------------------------------------------------ */

export interface TankPreset {
  id: string;
  brand: string;
  model: string;
  length: number;
  width: number;
  height: number;
  layout?: string;
}

const BRAND_ORDER = ["Maxspect", "Red Sea", "CADE", "Nyos", "D-D", "Waterbox"];

export const TANK_PRESETS: TankPreset[] = [
  { id: "lagoon-060", brand: "Maxspect", model: "Lagoon LS-060", length: 60, width: 50, height: 50 },
  { id: "lagoon-090", brand: "Maxspect", model: "Lagoon LS-090", length: 90, width: 50, height: 50 },
  { id: "lagoon-120", brand: "Maxspect", model: "Lagoon LS-120", length: 120, width: 50, height: 50 },
  { id: "lagoon-150", brand: "Maxspect", model: "Lagoon LS-150", length: 150, width: 55, height: 55 },
  { id: "reefer-170", brand: "Red Sea", model: "Reefer 170", length: 60, width: 40, height: 45 },
  { id: "reefer-250", brand: "Red Sea", model: "Reefer 250", length: 70, width: 40, height: 50 },
  { id: "reefer-350", brand: "Red Sea", model: "Reefer 350", length: 90, width: 40, height: 50 },
  { id: "reefer-450", brand: "Red Sea", model: "Reefer 450", length: 120, width: 45, height: 50 },
  { id: "reefer-525", brand: "Red Sea", model: "Reefer 525", length: 150, width: 57, height: 55 },
  { id: "reefer-650", brand: "Red Sea", model: "Reefer 650", length: 150, width: 60, height: 55 },
  { id: "reefer-750", brand: "Red Sea", model: "Reefer 750", length: 200, width: 65, height: 60 },
  {
    id: "reefer-pen-425",
    brand: "Red Sea",
    model: "Peninsula 425",
    length: 120,
    width: 50,
    height: 55,
    layout: "Peninsula",
  },
  {
    id: "reefer-pen-650",
    brand: "Red Sea",
    model: "Peninsula 650",
    length: 150,
    width: 60,
    height: 55,
    layout: "Peninsula",
  },
  { id: "cade-60", brand: "CADE", model: "CA60", length: 60, width: 45, height: 50 },
  { id: "cade-90", brand: "CADE", model: "CA90", length: 90, width: 50, height: 55 },
  { id: "cade-120", brand: "CADE", model: "CA120", length: 120, width: 55, height: 60 },
  { id: "cade-1500", brand: "CADE", model: "Pro 1500", length: 150, width: 55, height: 60 },
  { id: "cade-1800", brand: "CADE", model: "Pro 1800", length: 180, width: 60, height: 60 },
  { id: "nyos-250", brand: "Nyos", model: "Opus 250", length: 80, width: 50, height: 50 },
  { id: "nyos-300", brand: "Nyos", model: "Opus 300", length: 90, width: 55, height: 53 },
  { id: "nyos-440", brand: "Nyos", model: "Opus 440", length: 120, width: 60, height: 53 },
  { id: "dd-900", brand: "D-D", model: "Reef-Pro 900", length: 90, width: 60, height: 50 },
  { id: "dd-1200", brand: "D-D", model: "Reef-Pro 1200", length: 120, width: 60, height: 50 },
  { id: "dd-1500", brand: "D-D", model: "Reef-Pro 1500", length: 150, width: 60, height: 50 },
  { id: "dd-1800", brand: "D-D", model: "Reef-Pro 1800", length: 180, width: 65, height: 60 },
  { id: "wb-a60", brand: "Waterbox", model: "A 60.1", length: 60, width: 45, height: 55 },
  { id: "wb-a90", brand: "Waterbox", model: "A 90.1", length: 90, width: 50, height: 55 },
  { id: "wb-a120", brand: "Waterbox", model: "A 120.1", length: 120, width: 55, height: 55 },
  { id: "wb-a160", brand: "Waterbox", model: "A 160.1", length: 160, width: 60, height: 60 },
];

export function presetsByBrand(): { brand: string; presets: TankPreset[] }[] {
  const brands = [...new Set(TANK_PRESETS.map((p) => p.brand))];
  brands.sort((a, b) => {
    const ia = BRAND_ORDER.indexOf(a);
    const ib = BRAND_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return brands.map((brand) => ({
    brand,
    presets: TANK_PRESETS.filter((p) => p.brand === brand),
  }));
}
