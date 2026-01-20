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
      "metric-types",
      "data.json"
    );
    const fileContent = await readFile(dataPath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading metric types data:", error);
    return NextResponse.json(
      { error: "Failed to load metric types data" },
      { status: 500 }
    );
  }
}
