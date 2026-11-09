import { experimentDataSource } from "@/data-sources/experimentDataSource";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ experimentName: string }> },
) {
  const { experimentName } = await params;

  try {
    const message = await experimentDataSource.rerunExperiment(experimentName);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error(`Failed to rerun experiment "${experimentName}":`, error);

    return NextResponse.json(
      { error: "Failed to rerun experiment" },
      { status: 503 },
    );
  }
}
