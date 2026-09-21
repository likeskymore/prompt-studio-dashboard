import { experimentDataSource } from "@/data-sources/experimentDataSource";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;

  try {
    await experimentDataSource.resumeExperimentRun(runId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Failed to resume experiment run:", error);

    return NextResponse.json(
      { error: "Failed to resume experiment run" },
      { status: 503 },
    );
  }
}