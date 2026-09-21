import { Experiment, Llm } from "@/features/experiment/models/ExperimentModels";
import { baseDbService } from "@/services/db";

class ExperimentDbService {
  async getExperimentModels(experimentId: number): Promise<Llm[]> {
    return baseDbService.query<Llm[]>(
      ` 
        SELECT DISTINCT l.*
        FROM Llm l
        JOIN PromptConfig pc ON l.id = pc.llm_id
        JOIN Experiment e ON pc.experiment_id = e.id
        WHERE e.id = ?
      `,
      [experimentId],
    );
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return baseDbService.query<Experiment[]>(`
      SELECT *
      FROM Experiment
      ORDER BY id DESC
    `);
  }
  
  async deleteExperiment(experimentId: number): Promise<string> {
    const result = await baseDbService.query<{ message: string }[]>(
      `
        DELETE FROM Experiment
        WHERE id = ?
      `,
      [experimentId],
    );

    return result[0]?.message || "Experiment deleted successfully.";
  }
}

export const experimentDbService = new ExperimentDbService();
