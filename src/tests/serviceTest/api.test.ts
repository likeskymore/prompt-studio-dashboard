import { afterEach, describe, expect, it, vi } from "vitest";
import { BaseApiError, baseApiService } from "@/services/api";

const apiHost = "https://api.example.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("baseApiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("serializes defined query parameters and returns the response body", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_HOST", apiHost);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        statusCode: 200,
        responseCode: "OK",
        body: { count: 2 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      baseApiService.get({
        endpoint: "/experiments",
        params: {
          search: "prompt & model",
          page: 0,
          active: false,
          omitted: undefined,
        },
      }),
    ).resolves.toMatchObject({ body: { count: 2 } });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiHost}/experiments?search=prompt+%26+model&page=0&active=false`,
      { signal: undefined },
    );
  });

  it("sends JSON for POST requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_HOST", apiHost);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ statusCode: 200, responseCode: "OK", body: "started" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await baseApiService.post({
      endpoint: "/experiments/run",
      data: { name: "demo" },
    });

    expect(fetchMock).toHaveBeenCalledWith(`${apiHost}/experiments/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "demo" }),
    });
  });

  it("throws BaseApiError for API error responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_HOST", apiHost);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            statusCode: 409,
            responseCode: "RUN_CONFLICT",
            body: { reason: "already running" },
          },
          409,
        ),
      ),
    );

    await expect(
      baseApiService.get({ endpoint: "/experiments" }),
    ).rejects.toMatchObject({
      name: "Error",
      statusCode: 409,
      responseCode: "RUN_CONFLICT",
      body: { reason: "already running" },
    } satisfies Partial<BaseApiError>);
  });

  it("uses the HTTP status when an error response is not JSON", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_HOST", apiHost);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream unavailable", { status: 503 })),
    );

    await expect(
      baseApiService.get({ endpoint: "/experiments" }),
    ).rejects.toMatchObject({
      statusCode: 503,
      responseCode: "",
      body: "",
    });
  });

  it("parses SSE events split across chunks and defaults unnamed events to message", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_HOST", apiHost);
    const encoder = new TextEncoder();
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('event: update\ndata: {"count":'));
          controller.enqueue(
            encoder.encode('2}\n\ndata: {"ready":true}\n\n'),
          );
          controller.close();
        },
      }),
    );
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    const events: string[] = [];
    const data: unknown[] = [];

    await baseApiService.getSSE({
      endpoint: "/events",
      data: null,
      onEvent: (event) => events.push(event),
      onData: (value) => data.push(value),
    });

    expect(fetchMock).toHaveBeenCalledWith(`${apiHost}/events`, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      signal: undefined,
    });
    expect(events).toEqual(["update", "message"]);
    expect(data).toEqual([{ count: 2 }, { ready: true }]);
  });

  it("throws BaseApiError when an SSE request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_HOST", apiHost);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("stream unavailable", { status: 503 })),
    );

    await expect(
      baseApiService.getSSE({
        endpoint: "/events",
        data: null,
        onEvent: vi.fn(),
        onData: vi.fn(),
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      responseCode: "SSE_REQUEST_FAILED",
      body: "stream unavailable",
    });
  });
});
