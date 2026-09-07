import {
  ExperimentListResponse,
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

  async runExperiment(experimentName: string): Promise<BaseResponse<string>> {
    return baseApiService.get<string>({
      endpoint: `${this.BASE_PATH}/run/${experimentName}`,
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
