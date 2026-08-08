import { Button } from "@/components/ui/button";
import NavCard from "@/components/ui/nav-card";
import ControlPanel from "@/components/ui/control-panel";
import { Settings, ChartColumn } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">

      {/* Main navigation */}
      <section className="grid grid-cols-2 gap-8 mt-10">

        <NavCard
          title="Experiment Configurator"
          icon={Settings}
          href="/experiment-config"
        />

        <NavCard
          title="Analysis"
          icon={ChartColumn}
          href="/analysis"
        />

      </section>


      {/* Actions */}
      <section className="flex justify-center gap-10 mt-8">
        <Button
          variant="outline"
          className="
            border-2
            border-border
            hover:bg-accent
            hover:text-accent-foreground
          "
        >
          Open
        </Button>
        <Button
          variant="outline"
          className="
            border-2
            border-border
            hover:bg-accent
            hover:text-accent-foreground
          "
        >
          Export
        </Button>
        <Button
          variant="outline"
          className="
            border-2
            border-border
            hover:bg-accent
            hover:text-accent-foreground
          "
        >
          Settings
        </Button>
      </section>


      {/* Bottom panel */}
      <ControlPanel />

    </main>
  );
}