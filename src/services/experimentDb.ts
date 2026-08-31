import {
  Experiment,
  ExperimentRunState,
  Llm,
} from "@/features/experiment/models/ExperimentModels";
import { baseDbService } from "@/services/db";

class ExperimentDbService {
  async getAllExperimentStates(): Promise<ExperimentRunState[]> {
    return baseDbService.query<ExperimentRunState[]>(`
      SELECT *
      FROM Experiment_run
      ORDER BY created_at DESC
    `);
  }

  async getExperimentModels(experimentName: string): Promise<Llm[]> {
    return baseDbService.query<Llm[]>(
      ` 
        SELECT DISTINCT l.*
        FROM Llm l
        JOIN PromptConfig pc ON l.id = pc.llm_id
        JOIN Experiment e ON pc.experiment_id = e.id
        WHERE e.title = ?
      `,
      [experimentName],
    );
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return baseDbService.query<Experiment[]>(`
      SELECT *
      FROM Experiment
      ORDER BY id DESC
    `);
  }

  async getExperimentRunState(
    runId: string,
  ): Promise<ExperimentRunState | null> {
    const rows = await baseDbService.query<ExperimentRunState[]>(
      `
        SELECT
          run_id,
          experiment_name,
          status,
          created_at,
          started_at,
          finished_at,
          updated_at,
          total_tasks,
          attempts,
          completed,
          failed,
          retries,
          total_tokens,
          last_error,
          total_latency_ms,
          latency_count,
          p50_latency_ms,
          p95_latency_ms,
          p99_latency_ms,
          samples_json
        FROM Experiment_run
        WHERE run_id = ?
        LIMIT 1
      `,
      [runId],
    );

    return rows[0] ?? null;
  }
}

export const experimentDbService = new ExperimentDbService();
