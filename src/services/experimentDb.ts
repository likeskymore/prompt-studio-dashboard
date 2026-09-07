import { Experiment, Llm } from "@/features/experiment/models/ExperimentModels";
import { baseDbService } from "@/services/db";

class ExperimentDbService {
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
}

export const experimentDbService = new ExperimentDbService();
