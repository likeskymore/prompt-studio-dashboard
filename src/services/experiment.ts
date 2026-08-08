import {
  ExperimentListResponse,
  RunningExperimentListResponse,
} from "@/features/experiment/models/ExperimentModels";
import { baseApiService } from "@/services/api";
import type { BaseResponse } from "@/types/api";

class ExperimentService {
  private readonly BASE_PATH = '/experiments';

  async getAllExperiments(): Promise<BaseResponse<ExperimentListResponse>> {
    return baseApiService.get<ExperimentListResponse>({
      endpoint: `${this.BASE_PATH}/`,
    });
  }


  async runExperiment(experimentName: string): Promise<BaseResponse<string>> {
    return baseApiService.get<string>({
      endpoint: `${this.BASE_PATH}/run/${experimentName}`,
    });
  }

  async getRunningExperiment(): Promise<BaseResponse<RunningExperimentListResponse>> {
    return baseApiService.get<RunningExperimentListResponse>({
      endpoint: `${this.BASE_PATH}/running-experiments`,
    });
  }

  async subscribeToExperimentRun(
    runId: number,
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

//   async getGeneratedDataFromLLM(
//     data: GenerateDataFromLLMArgs,
//   ): Promise<BaseResponse<GenerateDataFromLLMResponse>> {
//     return baseApiService.post<GenerateDataFromLLMResponse>({
//       endpoint: `${this.BASE_PATH}/generate-variable-values`,
//       data,
//     });
//   }
}

export const experimentService = new ExperimentService();
