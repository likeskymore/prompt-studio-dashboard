import { NextRequest } from "next/server";
import { experimentDataSource } from "@/data-sources/experimentDataSource";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (request.signal.aborted) {
          return;
        }

        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      void experimentDataSource
        .subscribeToExperimentRun(id, {
          signal: request.signal,

          onEvent: (event) => {
            send(event, {});
          },

          onData: (data) => {
            send("snapshot", data);
          },
        })
        .catch((error) => {
          if (!request.signal.aborted) {
            console.error(
              "Experiment event stream failed:",
              error,
            );
          }
        });
    },

    cancel() {
      // request.signal is responsible for stopping
      // the SSE/DB polling operation.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}