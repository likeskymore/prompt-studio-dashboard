"use client";

import { Experiment } from "@/features/experiment/models/ExperimentModels";
import { useEffect, useState } from "react";
import { experimentService } from "@/services/experiment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ExperimentConfigPage = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>("");
  const [runStatus, setRunStatus] = useState<string>("");

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const response = await experimentService.getAllExperiments();

        console.log("Fetched experiments:", response.body.experiments);

        setExperiments(response.body.experiments);
      } catch (error) {
        console.error("Failed to fetch experiments:", error);
      }
    };

    fetchExperiments();
  }, []);

  const handleRunExperiment = async (experimentName: string) => {
    if (!experimentName) {
      setRunStatus("Please select an experiment first");
      return;
    }

    try {
      const response = await experimentService.runExperiment(experimentName);

      if (response.responseCode === "SUCCESS") {
        setRunStatus(`Experiment "${experimentName}" started successfully`);
      } else {
        setRunStatus(`Failed: ${response.responseCode}`);
      }

    } catch (error) {
      console.error("Failed to run experiment:", error);
      setRunStatus("Failed to start experiment");
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">
        Experiment List
      </h1>

      <div className="h-96 w-full overflow-y-auto rounded-lg border border-border p-4">
        {experiments.length === 0 ? (
          <p className="text-muted-foreground">
            No experiments found
          </p>
        ) : (
          <div className="space-y-2">
            {experiments.map((experiment) => (
              <button
                key={experiment.id}
                onClick={() => setSelectedExperiment(experiment.title)}
                className={cn(
                  "w-full rounded-md border border-border p-3 text-left transition-colors",
                  selectedExperiment === experiment.title
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                )}
              >
                {experiment.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="
              border-2
              border-border
              hover:bg-accent
              hover:text-accent-foreground
            "
            onClick={() => handleRunExperiment(selectedExperiment)}
          >
            Run Experiment
          </Button>

          {runStatus && (
            <span className="text-sm text-muted-foreground">
              {runStatus}
            </span>
          )}
        </div>

        <Button
          asChild
          variant="outline"
          className="
            border-2
            border-border
            hover:bg-accent
            hover:text-accent-foreground
          "
        >
          <Link
            href="/experiment-monitor"
            className="flex items-center gap-2"
          >
            Monitor Experiment
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ExperimentConfigPage;