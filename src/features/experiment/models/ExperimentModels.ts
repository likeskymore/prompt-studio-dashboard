export type ExperimentRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "paused";

export type ExperimentRunSample = {
  at: string;
  total_tasks: number;
  attempts: number;
  completed: number;
  failed: number;
  retries: number;
  total_tokens: number;
};

export type Llm = {
  id: number;
  base_model: string;
  name: string;
  model: string;
};

export type ExperimentRunState = {
  run_id: string;
  experiment_id: number;
  experiment_name: string;
  status: ExperimentRunStatus;
  created_at: string;
  started_at?: string;
  paused_at?: string;
  finished_at?: string;
  updated_at: string;
  total_paused_ms?: number;
  total_tasks: number;
  attempts: number;
  completed: number;
  failed: number;
  retries: number;
  total_tokens: number;
  last_error?: string;
  total_latency_ms: number;
  latency_count: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  latency_samples: number[];
  samples: ExperimentRunSample[];
};

export type ExperimentRunMetadata = {
  run_id: string;
  experiment_name: string;
  status: string;
  started_at?: string;
  finished_at?: string;
  updated_at: string;
};

export type Experiment = {
  id: number;
  title: string;
};

export type BaseExperimentResponse = {
  message: string;
};

export type ResumeExperimentResponse = {
  message: string;
  runId: string;
  eventsUrl: string;
};
export type ExperimentListResponse = {
  experiments: Experiment[];
};

export type ExperimentStateMetadataListResponse = {
  experiment_states_metadata: ExperimentRunMetadata[];
};

export type LlmListResponse = {
  models: Llm[];
};
