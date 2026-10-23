import { experimentStateApiService } from "@/services/experimentStateApi";
import { experimentStateDbService } from "@/services/experimentStateDb";

export const experimentStateDataSource = {
  async getAllExperimentStatesMetadata() {
    try {
      return await experimentStateApiService
        .getAllExperimentStatesMetadata()
        .then((response) => response.body.experiment_states_metadata ?? []);
    } catch {
      return await experimentStateDbService.getAllExperimentStatesMetadata();
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
      await experimentStateApiService.subscribeToExperimentRun(runId, options);

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
        const state = await experimentStateDbService.getExperimentRunState(runId);

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

  async getExperimentRunState(runId: string) {
    try {
      return await experimentStateApiService
        .getExperimentRunState(runId)
        .then((response) => response.body ?? null);
    } catch {
      return await experimentStateDbService.getExperimentRunState(runId);
    }
  },
};
