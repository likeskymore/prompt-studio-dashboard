import {
    ExperimentRunState,
  ExperimentStateMetadataListResponse,
} from "@/features/experiment/models/ExperimentModels";
import { baseApiService } from "@/services/api";
import type { BaseResponse } from "@/types/api";

class MonitoringApiService {
  private readonly BASE_PATH = "/monitoring";

  async getAllExperimentStatesMetadata(): Promise<
    BaseResponse<ExperimentStateMetadataListResponse>
  > {
    return baseApiService.get<ExperimentStateMetadataListResponse>({
      endpoint: `${this.BASE_PATH}/states`,
    });
  }

  async subscribeToExperimentRun(
    runId: string,
    handlers: {
      signal?: AbortSignal;
      onEvent: (event: string) => void;
      onData: (data: unknown) => void;
    },
  ): Promise<void> {
    return baseApiService.getSSE({
      endpoint: `${this.BASE_PATH}/state/${runId}/events`,
      data: null,
      signal: handlers.signal,
      onEvent: handlers.onEvent,
      onData: handlers.onData,
    });
  }

  async getExperimentRunState(
    runId: string,
  ): Promise<BaseResponse<ExperimentRunState | null>> {
    return baseApiService.get<ExperimentRunState | null>({
      endpoint: `${this.BASE_PATH}/state/${runId}`,
    });
  }
}

export const monitoringApiService = new MonitoringApiService();
