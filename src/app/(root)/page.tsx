import { Button } from "@/components/ui/button";
import NavCard from "@/components/ui/nav-card";
import ControlPanel from "@/components/ui/control-panel";
import { Monitor, ChartColumn, Play } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 lg:px-10">

        {/* Header */}
        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            PromptStudio
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Experiment Platform
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Configure experiments, monitor runs, and analyze your results.
          </p>
        </header>

        {/* Main navigation */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <NavCard
            title="Experiment Runner"
            icon={Play}
            href="/experiment-runner"
          />
          <NavCard
            title="Experiment Monitoring"
            icon={Monitor}
            href="/experiment-monitor"
          />

          <NavCard
            title="Analysis"
            icon={ChartColumn}
            href="/analysis"
          />
        </section>

        {/* Actions */}
        <section className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            className="min-w-28 border-2 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Open
          </Button>

          <Button
            variant="outline"
            className="min-w-28 border-2 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Export
          </Button>

          <Button
            variant="outline"
            className="min-w-28 border-2 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Settings
          </Button>
        </section>

        {/* Bottom panel */}
        <section className="mt-auto pt-12">
          <ControlPanel />
        </section>
      </div>
    </main>
  );
}