import type { BaseResponse } from "@/types/api";

export class BaseApiError extends Error {
  constructor(
    public statusCode: number,
    public responseCode: string, // use "ErrorCode" in locales/*.json files to show friendly message
    public body: unknown,
  ) {
    super(typeof body === "string" ? body : JSON.stringify(body));
  }
}

export interface BaseQueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface GetRequestArgs {
  endpoint: string;
  params?: BaseQueryParams;
  signal?: AbortSignal;
}

export interface PostRequestArgs {
  endpoint: string;
  data: unknown;
  signal?: AbortSignal;
}

export interface PatchRequestArgs {
  endpoint: string;
  data: unknown;
}

export interface DeleteRequestArgs {
  endpoint: string;
}

export interface PutRequestArgs {
  endpoint: string;
  data: unknown;
}

export interface UploadRequestArgs {
  endpoint: string;
  formData: FormData;
  signal?: AbortSignal;
}

export interface SSERequestArgs {
  endpoint: string;
  data: unknown;
  signal?: AbortSignal;
  onEvent: (event: string) => void;
  onData: (data: unknown) => void;
}

function hasParams(params: BaseQueryParams | undefined): boolean {
  return params ? Object.keys(params).length > 0 : false;
}
function buildQueryString(params: BaseQueryParams): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

async function fetchRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<BaseResponse<T>> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_HOST}${endpoint}`,
    {
      ...options,
    },
  );

  const data = (await response
    .json()
    .catch(() => ({
      statusCode: response.status,
      responseCode: "",
      body: "",
    }))) as BaseResponse<T>;

  if (data.statusCode >= 400 || !response.ok) {
    throw new BaseApiError(data.statusCode, data.responseCode, data.body || "");
  }

  return data;
}

export const baseApiService = {
  get: async <T>({
    endpoint,
    params,
    signal,
  }: GetRequestArgs): Promise<BaseResponse<T>> => {
    const queryString = hasParams(params)
      ? `?${buildQueryString(params as BaseQueryParams)}`
      : "";
    return fetchRequest<T>(`${endpoint}${queryString}`, { signal });
  },

  post: async <T>({
    endpoint,
    data,
  }: PostRequestArgs): Promise<BaseResponse<T>> =>
    fetchRequest<T>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),

  patch: async <T>({
    endpoint,
    data,
  }: PatchRequestArgs): Promise<BaseResponse<T>> =>
    fetchRequest<T>(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),

  delete: async <T>({
    endpoint,
  }: DeleteRequestArgs): Promise<BaseResponse<T>> =>
    fetchRequest<T>(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }),

  put: async <T>({
    endpoint,
    data,
  }: PutRequestArgs): Promise<BaseResponse<T>> =>
    fetchRequest<T>(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),

  postFormData: async <T>({
    endpoint,
    formData,
    signal,
  }: UploadRequestArgs): Promise<BaseResponse<T>> =>
    fetchRequest<T>(endpoint, {
      method: "POST",
      body: formData,
      signal,
    }),

  getSSE: async ({
    endpoint,
    signal,
    onData,
    onEvent,
  }: SSERequestArgs): Promise<void> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_HOST}${endpoint}`,
      {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal,
      },
    );

    if (!response.ok) {
      throw new BaseApiError(
        response.status,
        "SSE_REQUEST_FAILED",
        await response.text(),
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get response reader");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const eventLines = chunk.split("\n");
          let eventName = "message";
          const dataLines: string[] = [];

          for (const line of eventLines) {
            if (line.startsWith("event: ")) eventName = line.slice(7).trim();
            if (line.startsWith("data: ")) dataLines.push(line.slice(6).trim());
          }

          if (dataLines.length > 0) {
            onEvent(eventName);
            onData(JSON.parse(dataLines.join("\n")));
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
