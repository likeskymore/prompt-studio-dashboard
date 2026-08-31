import type {
  Experiment,
  ExperimentRunState,
  Llm,
} from "@/features/experiment/models/ExperimentModels";

import type { ExperimentDataSource } from "./types";
import { experimentDbService } from "@/services/experimentDb";

class ExperimentDbDataSource implements ExperimentDataSource {
  async getAllExperimentStates(): Promise<ExperimentRunState[]> {
    return experimentDbService.getAllExperimentStates();
  }

  async getExperimentRunState(
    runId: string,
  ): Promise<ExperimentRunState | null> {
    return experimentDbService.getExperimentRunState(runId);
  }

  async getExperimentModels(experimentName: string): Promise<Llm[]> {
    return experimentDbService.getExperimentModels(experimentName);
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return experimentDbService.getAllExperiments();
  }
}

export const experimentDbDataSource = new ExperimentDbDataSource();