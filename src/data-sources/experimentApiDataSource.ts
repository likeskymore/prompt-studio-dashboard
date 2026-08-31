import {
  Experiment,
  ExperimentRunState,
  Llm,
} from "@/features/experiment/models/ExperimentModels";
import { experimentApiService } from "@/services/experimentApi";
import { ExperimentDataSource } from "./types";

class ExperimentApiDataSource implements ExperimentDataSource {
  async getAllExperiments(): Promise<Experiment[]> {
    const response = await experimentApiService.getAllExperiments();

    return response.body.experiments ?? [];
  }

  async getAllExperimentStates(): Promise<ExperimentRunState[]> {
    const response = await experimentApiService.getAllExperimentStates();

    return response.body.experiment_states ?? [];
  }

  async getExperimentModels(experimentName: string): Promise<Llm[]> {
    const response =
      await experimentApiService.getExperimentModels(experimentName);

    return response.body.models ?? [];
  }
  async subscribeToExperimentRun(
    runId: string,
    options: {
      signal?: AbortSignal;
      onEvent: (event: string) => void;
      onData: (data: unknown) => void;
    },
  ): Promise<void> {
    return experimentApiService.subscribeToExperimentRun(runId, options);
  }
}

export const experimentApiDataSource = new ExperimentApiDataSource();
