import {
  ExperimentListResponse,
  LlmListResponse,
  BaseExperimentResponse,
  ResumeExperimentResponse,
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

  async rerunExperiment(experimentName: string): Promise<BaseResponse<string>> {
    return baseApiService.post<string>({
      endpoint: `${this.BASE_PATH}/run/${experimentName}/rerun`,
    });
  }

  async getExperimentModels(
    experimentId: number,
  ): Promise<BaseResponse<LlmListResponse>> {
    return baseApiService.get<LlmListResponse>({
      endpoint: `${this.BASE_PATH}/${experimentId}/models`,
    });
  }

  async pauseExperimentRun(
    runId: string,
  ): Promise<BaseResponse<BaseExperimentResponse>> {
    return baseApiService.post<BaseExperimentResponse>({
      endpoint: `${this.BASE_PATH}/run/${runId}/pause`,
    });
  }

  async resumeExperimentRun(
    runId: string,
  ): Promise<BaseResponse<ResumeExperimentResponse>> {
    return baseApiService.post<ResumeExperimentResponse>({
      endpoint: `${this.BASE_PATH}/run/${runId}/resume`,
    });
  }

  async deleteExperiment(experimentId: number): Promise<BaseResponse<BaseExperimentResponse>> {
    return baseApiService.delete<BaseExperimentResponse>({
      endpoint: `${this.BASE_PATH}/${experimentId}`,
    });
  }
}

export const experimentApiService = new ExperimentApiService();
