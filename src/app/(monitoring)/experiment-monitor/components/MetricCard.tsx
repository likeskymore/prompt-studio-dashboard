import { MetricCardProps } from "@/types/charts";

export function MetricCard({ title, value, detail, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <div className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}