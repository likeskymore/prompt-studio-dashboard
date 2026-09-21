import { NextResponse } from "next/server";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ experimentId: number }> },
) {
  try {
    const { experimentId } = await params;

    const message = await experimentDataSource.deleteExperiment(experimentId);

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Failed to delete experiment:", error);

    return NextResponse.json(
      { error: "Failed to delete experiment" },
      { status: 503 },
    );
  }
}