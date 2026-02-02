import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// Metric types that have existing data files (matching api/metricvalues/*.json)
const EXISTING_METRIC_DATA = [404, 406, 407, 331, 325, 328, 410, 411, 412, 413, 417, 418, 419, 420];

// Metric type configurations for generating mock data
// Based on the legend_config.domain values from metric-types/data.json
const METRIC_CONFIGS: Record<number, { min: number; max: number }> = {
  325: { min: 50000, max: 600000 }, // Population totale
  326: { min: 0, max: 100 }, // Population rurale (%)
  327: { min: 0, max: 600000 }, // Population déplacée
  328: { min: 0, max: 250 }, // Mortalité infanto-juvénile
  329: { min: 0, max: 100 }, // Non-recours aux services curatifs (%)
  330: { min: 0, max: 100 }, // Inaccessibilité aux soins (%)
  331: { min: 50, max: 1200 }, // Incidence brute (DHIS2)
  413: { min: 0, max: 100 }, // Prévalence du paludisme (%)
  410: { min: 0, max: 1 }, // Résistance aux insecticides
  406: { min: 0, max: 1 }, // Saisonnalité
  404: { min: 200, max: 2000 }, // Déficit de PIB par habitant (USD)
  412: { min: 0, max: 1500 }, // Insécurité (nombre de conflits)
};

// Simple seeded random number generator for deterministic values
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Generate a deterministic value for a given org_unit and metric_type
function generateMockValue(
  orgUnitId: number,
  metricTypeId: number
): number {
  const config = METRIC_CONFIGS[metricTypeId] || { min: 0, max: 1000 };
  const seed = orgUnitId * 1000 + metricTypeId;
  const random = seededRandom(seed);
  const value = config.min + random * (config.max - config.min);
  // Round to reasonable precision
  return Math.round(value * 100) / 100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metricTypeId = searchParams.get("id");

    if (!metricTypeId) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    const id = parseInt(metricTypeId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid parameter: id must be a number" },
        { status: 400 }
      );
    }

    // Check if we have existing data for this metric type
    if (EXISTING_METRIC_DATA.includes(id)) {
      const dataPath = path.join(
        process.cwd(),
        "..",
        "api",
        "metricvalues",
        `${id}.json`
      );
      const fileContent = await readFile(dataPath, "utf-8");
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    }

    // Generate mock data for other metric types
    // First, load the org units to get all org unit IDs
    const orgunitsPath = path.join(
      process.cwd(),
      "..",
      "api",
      "orgunits",
      "data.json"
    );
    const orgunitsContent = await readFile(orgunitsPath, "utf-8");
    const orgunits = JSON.parse(orgunitsContent);

    // Generate mock metric values for each org unit
    let mockIdCounter = 100000 + id * 1000;
    const mockData = orgunits.map(
      (orgUnit: { id: number }) => ({
        id: mockIdCounter++,
        metric_type: id,
        org_unit: orgUnit.id,
        year: null,
        value: generateMockValue(orgUnit.id, id),
        string_value: "",
      })
    );

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error loading metric values data:", error);
    return NextResponse.json(
      { error: "Failed to load metric values data" },
      { status: 500 }
    );
  }
}
