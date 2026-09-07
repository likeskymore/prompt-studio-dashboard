import {
  ExperimentRunState,
} from "@/features/experiment/models/ExperimentModels";
import { baseDbService } from "@/services/db";

class MonitoringDbService {
  async getAllExperimentStatesMetadata(): Promise<ExperimentRunState[]> {
    return baseDbService.query<ExperimentRunState[]>(`
      SELECT run_id, experiment_name, status, started_at, finished_at, updated_at
      FROM Experiment_run
      ORDER BY created_at DESC
    `);
  }

  async getExperimentRunState(
    runId: string,
  ): Promise<ExperimentRunState | null> {
    const rows = await baseDbService.query<ExperimentRunState[]>(
      `
        SELECT *
        FROM Experiment_run
        WHERE run_id = ?
        LIMIT 1
      `,
      [runId],
    );

    return rows[0] ?? null;
  }
}

export const monitoringDbService = new MonitoringDbService();
