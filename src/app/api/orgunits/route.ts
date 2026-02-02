import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Read from the external data file (mock data source)
    const dataPath = path.join(process.cwd(), "data", "orgunits", "data.json");
    const fileContent = await readFile(dataPath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading orgunits data:", error);
    return NextResponse.json(
      { error: "Failed to load organization units data" },
      { status: 500 }
    );
  }
}
