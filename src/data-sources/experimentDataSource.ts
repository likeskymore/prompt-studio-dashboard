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

  async getExperimentModels(experimentName: string) {
    try {
      return await experimentApiService
        .getExperimentModels(experimentName)
        .then((response) => response.body.models ?? []);
    } catch {
      return await experimentDbService.getExperimentModels(experimentName);
    }
  },
};
