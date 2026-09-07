import { monitoringApiService } from "@/services/monitoringApi";
import { monitoringDbService } from "@/services/monitoringDb";

export const monitoringDataSource = {
  async getAllExperimentStatesMetadata() {
    try {
      return await monitoringApiService
        .getAllExperimentStatesMetadata()
        .then((response) => response.body.experiment_states_metadata ?? []);
    } catch {
      return await monitoringDbService.getAllExperimentStatesMetadata();
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
      await monitoringApiService.subscribeToExperimentRun(runId, options);

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
        const state = await monitoringDbService.getExperimentRunState(runId);

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
      return await monitoringApiService
        .getExperimentRunState(runId)
        .then((response) => response.body ?? null);
    } catch {
      return await monitoringDbService.getExperimentRunState(runId);
    }
  },
};
