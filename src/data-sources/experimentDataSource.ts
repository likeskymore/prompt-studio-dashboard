// src/data-sources/serverExperimentDataSource.ts

import { experimentApiDataSource } from "./experimentApiDataSource";
import { experimentDbDataSource } from "./experimentDbDataSource";

export const experimentDataSource = {
  async getAllExperiments() {
    try {
      return await experimentApiDataSource.getAllExperiments();
    } catch {
      return await experimentDbDataSource.getAllExperiments();
    }
  },

  async getAllExperimentStates() {
    try {
      return await experimentApiDataSource.getAllExperimentStates();
    } catch {
      return await experimentDbDataSource.getAllExperimentStates();
    }
  },

  async getExperimentModels(experimentName: string) {
    try {
      return await experimentApiDataSource.getExperimentModels(experimentName);
    } catch {
      return await experimentDbDataSource.getExperimentModels(experimentName);
    }
  },

  async subscribeToExperimentRun(
    runId: string,
    options: {
      signal: AbortSignal;
      onEvent: (event: string) => void;
      onData: (data: unknown) => void;
    },
  ) {
    try {
      await experimentApiDataSource.subscribeToExperimentRun(runId, options);

      return;
    } catch (error) {
      if (options.signal.aborted) {
        return;
      }

      console.warn("SSE unavailable, falling back to DB polling:", error);
    }

    const poll = async () => {
      if (options.signal.aborted) {
        return;
      }

      try {
        const state = await experimentDbDataSource.getExperimentRunState(runId);

        if (state) {
          options.onData(state);
        }
      } catch (error) {
        console.warn("DB state refresh failed:", error);
      }
    };

    await poll();

    const timer = setInterval(() => {
      void poll();
    }, 5000);

    options.signal.addEventListener("abort", () => clearInterval(timer), {
      once: true,
    });
  },
};
