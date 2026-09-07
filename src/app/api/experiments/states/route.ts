import { NextResponse } from "next/server";
import { monitoringDataSource } from "@/data-sources/monitoringDataSource";

export async function GET() {
  try {
    const experiment_states = await monitoringDataSource.getAllExperimentStatesMetadata();

    return NextResponse.json({
      experiment_states
    });
  } catch (error) {
    console.error("Failed to fetch experiments:", error);

    return NextResponse.json(
      { error: "Failed to fetch experiments" },
      { status: 503 },
    );
  }
}