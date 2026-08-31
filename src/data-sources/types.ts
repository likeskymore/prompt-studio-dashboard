import { Experiment, ExperimentRunState, Llm } from "@/features/experiment/models/ExperimentModels";

export interface ExperimentDataSource {
  getAllExperimentStates(): Promise<ExperimentRunState[]>;
  getExperimentModels(experimentName: string): Promise<Llm[]>;
  getAllExperiments(): Promise<Experiment[]>;
} 


export interface ExperimentLiveSource {
  subscribeToExperimentRun(
    runId: string,
    options: {
      signal: AbortSignal;
      onEvent: (event: string) => void;
      onData: (data: ExperimentRunState) => void;
    },
  ): Promise<void>;
}