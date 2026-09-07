import { MetricCardProps } from "@/types/charts";

export function MetricCard({
  title,
  value,
  detail,
  icon,
  secondaryValues,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
          </p>

          {detail ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {detail}
            </p>
          ) : null}

          {secondaryValues && secondaryValues.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {secondaryValues.map((item) => (
                <div key={item.label} className="text-xs">
                  <span className="text-muted-foreground">
                    {item.label}
                  </span>{" "}
                  <span className="font-medium">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}