export type ExperimentRunStatus = "queued" | "running" | "completed" | "failed" | "paused";

export type ExperimentRunSample = {
  at: string;
  total_tasks: number;
  attempts: number;
  completed: number;
  failed: number;
  retries: number;
  total_tokens: number;
};

export type ExperimentRunState = {
  run_id: string;
  experiment_name: string;
  status: ExperimentRunStatus;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at: string;
  total_tasks: number;
  attempts: number;
  completed: number;
  failed: number;
  retries: number;
  total_tokens: number;
  last_error?: string;
  samples: ExperimentRunSample[];
};

export type Experiment = {
  id: number;
  title: string;
  max_retry?: number;
  threads?: number;
};

export type ExperimentListResponse = {
  experiments: Experiment[];
};

export type ExperimentStateListResponse = {
  experiment_states: ExperimentRunState[];
};
