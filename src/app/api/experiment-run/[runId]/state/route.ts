import { NextResponse } from "next/server";
import { monitoringDataSource } from "@/data-sources/monitoringDataSource";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;

    const experiment_state =
      await monitoringDataSource.getExperimentRunState(runId);

    if (!experiment_state) {
      return NextResponse.json(
        { error: "Experiment run not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      experiment_state,
    });
  } catch (error) {
    console.error("Failed to fetch experiment run state:", error);

    return NextResponse.json(
      { error: "Failed to fetch experiment run state" },
      { status: 503 },
    );
  }
}