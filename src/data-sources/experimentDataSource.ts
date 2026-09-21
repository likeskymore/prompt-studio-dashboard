import { experimentApiService } from "@/services/experimentApi";
import { experimentDbService } from "@/services/experimentDb";


export const experimentDataSource = {
  async getAllExperiments() {
    try {
      return await experimentApiService
        .getAllExperiments()
        .then((response) => response.body.experiments ?? []);
    } catch {
      return await experimentDbService.getAllExperiments();
    }
  },

  async getExperimentModels(experimentId: number) {
    try {
      return await experimentApiService
        .getExperimentModels(experimentId)
        .then((response) => response.body.models ?? []);
    } catch {
      return await experimentDbService.getExperimentModels(experimentId);
    }
  },

  async pauseExperimentRun(runId: string): Promise<void> {
    try {
      await experimentApiService.pauseExperimentRun(runId);
    } catch (error) {
      console.error("Failed to pause experiment run:", error);
      throw error;
    }
  },

  async resumeExperimentRun(runId: string): Promise<void> {
    try {
      await experimentApiService.resumeExperimentRun(runId);
    } catch (error) {
      console.error("Failed to resume experiment run:", error);
      throw error;
    }
  },

  async deleteExperiment(experimentId: number): Promise<string> {
    try {
      const response = await experimentApiService.deleteExperiment(experimentId);
      console.log(response);
      return response.body.message;
    } catch {
      return await experimentDbService.deleteExperiment(experimentId);
    }
  }
};
