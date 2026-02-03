// Sample district data for Kenya
// Using simplified GeoJSON boundaries for demonstration

export type InterventionStatus = "completed" | "ongoing" | "planned" | "none";

export interface DistrictProperties {
  districtId: string;
  districtName: string;
  regionId: string;
  regionName: string;
  interventionStatus: InterventionStatus;
  interventionCount: number;
  interventions: string[];
  /** Serializable category assignments (categoryId -> interventionId) for merge logic */
  interventionCategoryAssignments?: Record<string, number>;
  /** Flat property for MapLibre expressions (e.g., "CM + IPTp + Dual AI") */
  interventionMixLabel?: string;
  /** Color assigned by a rule, used for map rendering */
  ruleColor?: string;
  /** Per-category colors (categoryId -> color) for tooltip display */
  colorByCategory?: Record<string, string>;
  /** Per-intervention colors (intervention short_name -> color) for tooltip display */
  colorByInterventionName?: Record<string, string>;
}

export interface Region {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface Province {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface OrgUnitWithGeoJSON {
  id: number;
  name: string;
  parent_id: number;
  parent_name: string;
  geo_json: GeoJSON.FeatureCollection | null;
}

/**
 * Extracts all coordinates from a GeoJSON geometry
 */
function extractAllCoordinates(geometry: GeoJSON.Geometry): [number, number][] {
  const coords: [number, number][] = [];

  function processCoords(coordArray: unknown): void {
    if (!Array.isArray(coordArray)) return;

    // Check if this is a coordinate pair [lng, lat]
    if (
      coordArray.length >= 2 &&
      typeof coordArray[0] === "number" &&
      typeof coordArray[1] === "number"
    ) {
      coords.push([coordArray[0], coordArray[1]]);
      return;
    }

    // Otherwise recurse into nested arrays
    for (const item of coordArray) {
      processCoords(item);
    }
  }

  if ("coordinates" in geometry) {
    processCoords(geometry.coordinates);
  }

  return coords;
}

/**
 * Calculates bounding box for a province from its child org units
 */
function calculateBoundsFromChildren(
  orgUnits: OrgUnitWithGeoJSON[],
  provinceId: number
): Province["bounds"] {
  const children = orgUnits.filter((u) => u.parent_id === provinceId);

  const bounds = {
    north: -Infinity,
    south: Infinity,
    east: -Infinity,
    west: Infinity,
  };

  for (const unit of children) {
    if (unit.geo_json?.features?.length) {
      const geometry = unit.geo_json.features[0]?.geometry;
      if (geometry) {
        const coords = extractAllCoordinates(geometry);
        for (const [lng, lat] of coords) {
          bounds.north = Math.max(bounds.north, lat);
          bounds.south = Math.min(bounds.south, lat);
          bounds.east = Math.max(bounds.east, lng);
          bounds.west = Math.min(bounds.west, lng);
        }
      }
    }
  }

  return bounds;
}

/**
 * Extracts unique provinces from org units data
 * Provinces are derived from parent_id/parent_name fields
 */
export function extractProvinces(orgUnits: OrgUnitWithGeoJSON[]): Province[] {
  const provinceMap = new Map<number, Province>();

  for (const unit of orgUnits) {
    if (unit.parent_id && !provinceMap.has(unit.parent_id)) {
      provinceMap.set(unit.parent_id, {
        id: String(unit.parent_id),
        name: unit.parent_name,
        bounds: calculateBoundsFromChildren(orgUnits, unit.parent_id),
      });
    }
  }

  return Array.from(provinceMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Kenya regions with bounding boxes
export const regions: Region[] = [
  {
    id: "central",
    name: "Central",
    bounds: { north: -0.4, south: -1.5, east: 37.5, west: 36.5 },
  },
  {
    id: "coast",
    name: "Coast",
    bounds: { north: -1.5, south: -4.7, east: 41.0, west: 38.5 },
  },
  {
    id: "eastern",
    name: "Eastern",
    bounds: { north: 2.0, south: -3.0, east: 41.5, west: 37.0 },
  },
  {
    id: "nairobi",
    name: "Nairobi",
    bounds: { north: -1.15, south: -1.45, east: 37.1, west: 36.65 },
  },
  {
    id: "north_eastern",
    name: "North Eastern",
    bounds: { north: 4.0, south: -1.0, east: 41.9, west: 38.5 },
  },
  {
    id: "nyanza",
    name: "Nyanza",
    bounds: { north: 0.5, south: -1.2, east: 35.5, west: 33.9 },
  },
  {
    id: "rift_valley",
    name: "Rift Valley",
    bounds: { north: 4.5, south: -2.0, east: 37.5, west: 34.5 },
  },
  {
    id: "western",
    name: "Western",
    bounds: { north: 1.2, south: -0.1, east: 35.2, west: 34.0 },
  },
];

// DRC (Democratic Republic of Congo) country center and bounds
export const countryConfig = {
  name: "République Démocratique du Congo",
  center: [23.6, -2.9] as [number, number],
  zoom: 5,
  bounds: {
    north: 5.5,
    south: -13.5,
    east: 31.5,
    west: 12.0,
  },
};

// Sample districts GeoJSON with simplified polygon data
// In production, this would be loaded from an API or static file
export const districtsGeoJSON: GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  DistrictProperties
> = {
  type: "FeatureCollection",
  features: [
    // Nairobi Region
    {
      type: "Feature",
      properties: {
        districtId: "D001",
        districtName: "Nairobi Central",
        regionId: "nairobi",
        regionName: "Nairobi",
        interventionStatus: "completed",
        interventionCount: 5,
        interventions: ["Vaccination Campaign", "Health Education", "Maternal Health", "Nutrition Program", "Water Sanitation"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.75, -1.25],
            [36.85, -1.25],
            [36.85, -1.32],
            [36.75, -1.32],
            [36.75, -1.25],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D002",
        districtName: "Nairobi West",
        regionId: "nairobi",
        regionName: "Nairobi",
        interventionStatus: "ongoing",
        interventionCount: 3,
        interventions: ["Malaria Prevention", "Nutrition Program", "Health Education"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.68, -1.28],
            [36.75, -1.28],
            [36.75, -1.38],
            [36.68, -1.38],
            [36.68, -1.28],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D003",
        districtName: "Nairobi East",
        regionId: "nairobi",
        regionName: "Nairobi",
        interventionStatus: "planned",
        interventionCount: 2,
        interventions: ["Water Sanitation", "Maternal Health"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.85, -1.25],
            [36.98, -1.25],
            [36.98, -1.35],
            [36.85, -1.35],
            [36.85, -1.25],
          ],
        ],
      },
    },
    // Central Region
    {
      type: "Feature",
      properties: {
        districtId: "D004",
        districtName: "Kiambu",
        regionId: "central",
        regionName: "Central",
        interventionStatus: "completed",
        interventionCount: 4,
        interventions: ["Vaccination Campaign", "Health Education", "Maternal Health", "Nutrition Program"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.7, -0.9],
            [37.0, -0.9],
            [37.0, -1.2],
            [36.7, -1.2],
            [36.7, -0.9],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D005",
        districtName: "Nyeri",
        regionId: "central",
        regionName: "Central",
        interventionStatus: "ongoing",
        interventionCount: 2,
        interventions: ["Malaria Prevention", "Nutrition Program"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.8, -0.4],
            [37.2, -0.4],
            [37.2, -0.9],
            [36.8, -0.9],
            [36.8, -0.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D006",
        districtName: "Muranga",
        regionId: "central",
        regionName: "Central",
        interventionStatus: "none",
        interventionCount: 0,
        interventions: [],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.9, -0.6],
            [37.3, -0.6],
            [37.3, -1.0],
            [36.9, -1.0],
            [36.9, -0.6],
          ],
        ],
      },
    },
    // Coast Region
    {
      type: "Feature",
      properties: {
        districtId: "D007",
        districtName: "Mombasa",
        regionId: "coast",
        regionName: "Coast",
        interventionStatus: "completed",
        interventionCount: 6,
        interventions: ["Vaccination Campaign", "Health Education", "Maternal Health", "Nutrition Program", "Water Sanitation", "Malaria Prevention"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [39.5, -3.9],
            [39.8, -3.9],
            [39.8, -4.15],
            [39.5, -4.15],
            [39.5, -3.9],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D008",
        districtName: "Kilifi",
        regionId: "coast",
        regionName: "Coast",
        interventionStatus: "planned",
        interventionCount: 1,
        interventions: ["Water Sanitation"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [39.4, -2.8],
            [40.0, -2.8],
            [40.0, -3.9],
            [39.4, -3.9],
            [39.4, -2.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D009",
        districtName: "Kwale",
        regionId: "coast",
        regionName: "Coast",
        interventionStatus: "ongoing",
        interventionCount: 2,
        interventions: ["Malaria Prevention", "Health Education"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [38.9, -4.0],
            [39.5, -4.0],
            [39.5, -4.6],
            [38.9, -4.6],
            [38.9, -4.0],
          ],
        ],
      },
    },
    // Western Region
    {
      type: "Feature",
      properties: {
        districtId: "D010",
        districtName: "Kakamega",
        regionId: "western",
        regionName: "Western",
        interventionStatus: "planned",
        interventionCount: 1,
        interventions: ["Maternal Health"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.4, 0.1],
            [35.0, 0.1],
            [35.0, 0.6],
            [34.4, 0.6],
            [34.4, 0.1],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D011",
        districtName: "Bungoma",
        regionId: "western",
        regionName: "Western",
        interventionStatus: "completed",
        interventionCount: 3,
        interventions: ["Vaccination Campaign", "Maternal Health", "Nutrition Program"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.2, 0.5],
            [34.8, 0.5],
            [34.8, 1.0],
            [34.2, 1.0],
            [34.2, 0.5],
          ],
        ],
      },
    },
    // Nyanza Region
    {
      type: "Feature",
      properties: {
        districtId: "D012",
        districtName: "Kisumu",
        regionId: "nyanza",
        regionName: "Nyanza",
        interventionStatus: "ongoing",
        interventionCount: 4,
        interventions: ["Malaria Prevention", "Nutrition Program", "Health Education", "Water Sanitation"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.5, -0.3],
            [35.0, -0.3],
            [35.0, 0.2],
            [34.5, 0.2],
            [34.5, -0.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D013",
        districtName: "Homa Bay",
        regionId: "nyanza",
        regionName: "Nyanza",
        interventionStatus: "none",
        interventionCount: 0,
        interventions: [],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.0, -0.8],
            [34.6, -0.8],
            [34.6, -0.3],
            [34.0, -0.3],
            [34.0, -0.8],
          ],
        ],
      },
    },
    // Rift Valley Region
    {
      type: "Feature",
      properties: {
        districtId: "D014",
        districtName: "Nakuru",
        regionId: "rift_valley",
        regionName: "Rift Valley",
        interventionStatus: "completed",
        interventionCount: 5,
        interventions: ["Vaccination Campaign", "Health Education", "Maternal Health", "Nutrition Program", "Water Sanitation"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [35.8, -0.8],
            [36.4, -0.8],
            [36.4, -0.2],
            [35.8, -0.2],
            [35.8, -0.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D015",
        districtName: "Eldoret",
        regionId: "rift_valley",
        regionName: "Rift Valley",
        interventionStatus: "planned",
        interventionCount: 2,
        interventions: ["Water Sanitation", "Maternal Health"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [35.0, 0.3],
            [35.5, 0.3],
            [35.5, 0.8],
            [35.0, 0.8],
            [35.0, 0.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D016",
        districtName: "Turkana",
        regionId: "rift_valley",
        regionName: "Rift Valley",
        interventionStatus: "none",
        interventionCount: 0,
        interventions: [],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [34.5, 2.5],
            [36.5, 2.5],
            [36.5, 4.0],
            [34.5, 4.0],
            [34.5, 2.5],
          ],
        ],
      },
    },
    // Eastern Region
    {
      type: "Feature",
      properties: {
        districtId: "D017",
        districtName: "Machakos",
        regionId: "eastern",
        regionName: "Eastern",
        interventionStatus: "ongoing",
        interventionCount: 3,
        interventions: ["Malaria Prevention", "Nutrition Program", "Health Education"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [37.0, -1.4],
            [37.8, -1.4],
            [37.8, -0.8],
            [37.0, -0.8],
            [37.0, -1.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D018",
        districtName: "Kitui",
        regionId: "eastern",
        regionName: "Eastern",
        interventionStatus: "planned",
        interventionCount: 1,
        interventions: ["Water Sanitation"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [37.5, -2.5],
            [38.5, -2.5],
            [38.5, -1.0],
            [37.5, -1.0],
            [37.5, -2.5],
          ],
        ],
      },
    },
    // North Eastern Region
    {
      type: "Feature",
      properties: {
        districtId: "D019",
        districtName: "Garissa",
        regionId: "north_eastern",
        regionName: "North Eastern",
        interventionStatus: "none",
        interventionCount: 0,
        interventions: [],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [39.0, -1.0],
            [41.0, -1.0],
            [41.0, 1.5],
            [39.0, 1.5],
            [39.0, -1.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        districtId: "D020",
        districtName: "Wajir",
        regionId: "north_eastern",
        regionName: "North Eastern",
        interventionStatus: "planned",
        interventionCount: 1,
        interventions: ["Maternal Health"],
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [39.5, 1.5],
            [41.5, 1.5],
            [41.5, 3.5],
            [39.5, 3.5],
            [39.5, 1.5],
          ],
        ],
      },
    },
  ],
};

// Intervention status colors matching PRD
export const interventionColors: Record<InterventionStatus, string> = {
  completed: "#4ade80", // Green
  ongoing: "#facc15", // Yellow
  planned: "#60a5fa", // Blue
  none: "#e5e7eb", // Gray
};

// Legend items for the map
export const legendItems = [
  { color: interventionColors.completed, label: "Completed" },
  { color: interventionColors.ongoing, label: "Ongoing" },
  { color: interventionColors.planned, label: "Planned" },
  { color: interventionColors.none, label: "No intervention" },
];
