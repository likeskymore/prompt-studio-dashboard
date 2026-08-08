export type Experiment = {
  id: number;
  title: string;
  max_retry?: number;
  threads?: number;
};

export type RunningExperiment = {
  run_id: number;
  experiment_name: string;
}

export type ExperimentListResponse = {
  experiments: Experiment[];
};

export type RunningExperimentListResponse = {
  running_experiments: RunningExperiment[];
}

export type LiveExperimentSnapshot = {
  experiment_name?: string;
  status?: string;
  started_at?: string;
  finished_at?: string;
  start_time?: string;
  end_time?: string;
  progress?: number;
  completion_percent?: number;
  current_iteration?: number;
  completed_iterations?: number;
  iteration_completed?: number;
  total_iterations?: number;
  iteration_total?: number;
  iterations_completed?: number;
  iterations_total?: number;
  tokens_used?: number;
  input_tokens?: number;
  output_tokens?: number;
  request_total?: number;
  requests_total?: number;
  successful_requests?: number;
  failed_requests?: number;
  timeout_requests?: number;
  retried_requests?: number;
  retries?: number;
  latency_ms?: number;
  average_latency_ms?: number;
  latency?: number;
  processed_items?: number;
  total_items?: number;
  data_processed?: number;
  data_total?: number;
  errors?: string[];
  error_messages?: string[];
  messages?: Array<string | { message?: string; text?: string; role?: string }>;
  logs?: Array<string | { message?: string; text?: string; level?: string }>;
  recent_events?: Array<string | { message?: string; event?: string; at?: string }>;
  [key: string]: unknown;
};