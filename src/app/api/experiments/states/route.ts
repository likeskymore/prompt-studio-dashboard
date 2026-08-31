import { NextResponse } from "next/server";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

export async function GET() {
  try {
    const experiment_states = await experimentDataSource.getAllExperimentStates();

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