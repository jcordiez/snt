import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Read from the external data file (mock data source)
    const dataPath = path.join(
      process.cwd(),
      "..",
      "api",
      "snt-malaria",
      "intervention_categories",
      "data.json"
    );
    const fileContent = await readFile(dataPath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading intervention categories data:", error);
    return NextResponse.json(
      { error: "Failed to load intervention categories data" },
      { status: 500 }
    );
  }
}
