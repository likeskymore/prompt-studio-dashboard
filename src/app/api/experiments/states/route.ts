import { NextResponse } from "next/server";
import { experimentStateDataSource } from "@/data-sources/experimentStateDataSource";

export async function GET() {
  try {
    const experiment_states = await experimentStateDataSource.getAllExperimentStatesMetadata();

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