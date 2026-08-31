import {
  ExperimentListResponse,
  ExperimentStateListResponse,
  LlmListResponse,
} from "@/features/experiment/models/ExperimentModels";
import { baseApiService } from "@/services/api";
import type { BaseResponse } from "@/types/api";

class ExperimentApiService {
  private readonly BASE_PATH = "/experiments";

  async getAllExperiments(): Promise<BaseResponse<ExperimentListResponse>> {
    return baseApiService.get<ExperimentListResponse>({
      endpoint: `${this.BASE_PATH}/`,
    });
  }

  async getAllExperimentStates(): Promise<
    BaseResponse<ExperimentStateListResponse>
  > {
    return baseApiService.get<ExperimentStateListResponse>({
      endpoint: `${this.BASE_PATH}/states`,
    });
  }

  async runExperiment(experimentName: string): Promise<BaseResponse<string>> {
    return baseApiService.get<string>({
      endpoint: `${this.BASE_PATH}/run/${experimentName}`,
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
      endpoint: `${this.BASE_PATH}/${runId}/events`,
      data: null,
      signal: handlers.signal,
      onEvent: handlers.onEvent,
      onData: handlers.onData,
    });
  }

  async getExperimentModels(
    experimentName: string,
  ): Promise<BaseResponse<LlmListResponse>> {
    return baseApiService.get<LlmListResponse>({
      endpoint: `${this.BASE_PATH}/${experimentName}/models`,
    });
  }
}

export const experimentApiService = new ExperimentApiService();
