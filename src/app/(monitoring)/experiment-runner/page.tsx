"use client";

import { Experiment } from "@/features/experiment/models/ExperimentModels";
import { useEffect, useState } from "react";
import { experimentApiService } from "@/services/experimentApi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";

const ExperimentRunnerPage = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [runStatus, setRunStatus] = useState<string>("");

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const response = await fetch("/api/experiments");

        if (!response.ok) {
          throw new Error("Failed to fetch experiments");
        }

        const data = await response.json();

        console.log("Fetched experiments:", data.experiments);

        setExperiments(data.experiments ?? []);
      } catch (error) {
        console.error("Failed to fetch experiments:", error);
      }
    };

    void fetchExperiments();
  }, []);

  const handleRerunExperiment = async (experimentName: string) => {
    if (!experimentName) {
      setRunStatus("Please select an experiment first");
      return;
    }

    try {
      const response = await experimentApiService.rerunExperiment(experimentName);

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

  const handleDeleteExperiment = async () => {
    if (!selectedExperiment) {
      return;
    }

    try {
      const response = await fetch(
        `/api/experiment/${selectedExperiment.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Failed to delete experiment");
      }

      setExperiments((currentExperiments) =>
        currentExperiments.filter((experiment) => experiment.id !== selectedExperiment.id),
      );
      setRunStatus(`Experiment "${selectedExperiment.title}" deleted successfully`);
      setSelectedExperiment(null);
    } catch (error) {
      console.error("Failed to delete experiment:", error);
      setRunStatus("Failed to delete experiment");
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
                onClick={() => setSelectedExperiment(experiment)}
                className={cn(
                  "w-full rounded-md border border-border p-3 text-left transition-colors",
                  selectedExperiment?.id === experiment.id
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
            onClick={() => handleRerunExperiment(selectedExperiment?.title ?? "")}
          >
            Rerun Experiment
          </Button>

          <Button
            variant="outline"
            className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDeleteExperiment}
            disabled={!selectedExperiment}
            aria-label="Delete selected experiment"
          >
            <Trash2 size={16} />
            Delete Experiment
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

export default ExperimentRunnerPage;