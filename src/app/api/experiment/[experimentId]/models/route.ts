import { NextResponse } from "next/server";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ experimentId: number }> },
) {
  try {
    const { experimentId } = await params;

    const models =
      await experimentDataSource.getExperimentModels(experimentId);

    return NextResponse.json({
      models,
    });
  } catch (error) {
    console.error("Failed to fetch experiment models:", error);

    return NextResponse.json(
      { error: "Failed to fetch experiment models" },
      { status: 503 },
    );
  }
}